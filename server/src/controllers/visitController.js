import QRCode from 'qrcode';
import { Op } from 'sequelize';
import { Visit, Visitor, User, Department, Notification } from '../models/index.js';
import { logAudit } from '../utils/auditLogger.js';

// Helper to generate unique badge number
const generateBadgeNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `VMS-${dateStr}-${rand}`;
};

export const createVisit = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      company,
      photoUrl,
      idProofType,
      idProofNumber,
      hostId,
      departmentId,
      purpose,
      visitType = 'walk_in',
      notes,
      autoCheckIn = true
    } = req.body;

    if (!fullName || !phone || !hostId || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Full name, phone, host, and purpose of visit are mandatory.'
      });
    }

    // 1. Find or create the visitor profile
    let visitor = await Visitor.findOne({ where: { phone: phone.trim() } });
    if (!visitor) {
      visitor = await Visitor.create({
        fullName: fullName.trim(),
        email: email ? email.trim().toLowerCase() : null,
        phone: phone.trim(),
        company: company ? company.trim() : null,
        photoUrl: photoUrl || null,
        idProofType: idProofType || 'National ID / Driving License',
        idProofNumber: idProofNumber || null
      });
    } else {
      // Update info if provided
      await visitor.update({
        fullName: fullName.trim(),
        email: email ? email.trim().toLowerCase() : visitor.email,
        company: company ? company.trim() : visitor.company,
        photoUrl: photoUrl || visitor.photoUrl,
        idProofNumber: idProofNumber || visitor.idProofNumber
      });
    }

    // 2. Determine department and host employee (with multi-tier fallback resolution)
    let targetDeptId = departmentId;
    let hostUser = null;

    if (hostId) {
      try {
        hostUser = await User.findByPk(hostId, {
          include: [{ model: Department, as: 'department' }]
        });
      } catch {
        // hostId was not a valid UUID format
      }
    }

    // Try finding by name or email if hostId was not an exact PK match
    if (!hostUser && hostId) {
      const cleanHost = String(hostId).replace(/\(.*?\)/g, '').trim();
      try {
        hostUser = await User.findOne({
          where: {
            [Op.or]: [
              { fullName: { [Op.like]: `%${cleanHost}%` } },
              { email: { [Op.like]: `%${cleanHost}%` } }
            ],
            isActive: true
          },
          include: [{ model: Department, as: 'department' }]
        });
      } catch {
        // search error
      }
    }

    // Also check req.body.hostName or req.body.host if provided
    const hostNameParam = req.body.hostName || req.body.host;
    if (!hostUser && hostNameParam) {
      const cleanName = String(hostNameParam).replace(/\(.*?\)/g, '').trim();
      try {
        hostUser = await User.findOne({
          where: {
            fullName: { [Op.like]: `%${cleanName}%` },
            isActive: true
          },
          include: [{ model: Department, as: 'department' }]
        });
      } catch {
        // search error
      }
    }

    // Graceful fallback: If host is still not found, assign the visit to the active administrative host
    if (!hostUser) {
      hostUser = await User.findOne({
        where: { isActive: true },
        order: [['createdAt', 'ASC']],
        include: [{ model: Department, as: 'department' }]
      });
    }

    if (!hostUser) {
      return res.status(404).json({
        success: false,
        message: 'No active staff member available to host visits.'
      });
    }

    if (!targetDeptId && hostUser.departmentId) {
      targetDeptId = hostUser.departmentId;
    }

    // 3. Prepare Visit Record
    const badgeNumber = generateBadgeNumber();
    const qrPayload = JSON.stringify({
      vmsBadge: badgeNumber,
      visitor: visitor.fullName,
      phone: visitor.phone,
      host: hostUser.fullName,
      createdAt: new Date().toISOString()
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, { width: 300, margin: 1 });

    const isStaffDirectCheckIn = Boolean(
      autoCheckIn &&
      req.user &&
      (req.user.role === 'guard' || req.user.role === 'admin' || req.user.role === 'super_admin')
    );
    const initialStatus = isStaffDirectCheckIn ? 'checked_in' : 'pending';

    const visit = await Visit.create({
      visitorId: visitor.id,
      hostId: hostUser.id,
      departmentId: targetDeptId,
      guardId: req.user?.role === 'guard' ? req.user.id : null,
      purpose,
      visitType,
      status: initialStatus,
      badgeNumber,
      qrCode: qrCodeDataUrl,
      checkInTime: initialStatus === 'checked_in' ? new Date() : null,
      notes: notes || null
    });

    // 4. Create Notification for Host
    await Notification.create({
      userId: hostUser.id,
      visitId: visit.id,
      title: initialStatus === 'checked_in' ? 'Visitor Arrived' : 'New Visit Requested',
      message: `${visitor.fullName} from ${visitor.company || 'Private'} ${initialStatus === 'checked_in' ? 'has arrived and checked in at the reception' : 'has a scheduled visit pending approval'} for "${purpose}".`,
      type: initialStatus === 'checked_in' ? 'arrival' : 'approval_request'
    });

    await logAudit({
      req,
      action: initialStatus === 'checked_in' ? 'VISITOR_CHECK_IN' : 'VISIT_CREATED',
      entityType: 'Visit',
      entityId: visit.id,
      details: { visitor: visitor.fullName, host: hostUser.fullName, badgeNumber }
    });

    // 5. Return loaded record
    const createdVisit = await Visit.findByPk(visit.id, {
      include: [
        { model: Visitor, as: 'visitor' },
        { model: User, as: 'host', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: Department, as: 'department' }
      ]
    });

    return res.status(201).json({
      success: true,
      message: initialStatus === 'checked_in' ? 'Visitor checked in successfully' : 'Visit registration submitted',
      data: createdVisit
    });
  } catch (error) {
    next(error);
  }
};

export const getVisits = async (req, res, next) => {
  try {
    const { status, departmentId, hostId, search, badgeNumber, fromDate, toDate, page = 1, limit = 20 } = req.query;
    const where = {};
    const visitorWhere = {};

    // Role-based scoping: regular hosts only see visits for themselves
    if (req.user.role === 'host') {
      where.hostId = req.user.id;
    } else if (hostId) {
      where.hostId = hostId;
    }

    if (badgeNumber) {
      where.badgeNumber = { [Op.like]: `%${badgeNumber.trim()}%` };
    }

    if (status) {
      where.status = status;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (fromDate && toDate) {
      where.createdAt = {
        [Op.between]: [new Date(fromDate), new Date(toDate)]
      };
    }

    if (search && !badgeNumber) {
      const trimmedSearch = search.trim();
      if (/^VMS-/i.test(trimmedSearch)) {
        where.badgeNumber = { [Op.like]: `%${trimmedSearch}%` };
      } else {
        visitorWhere[Op.or] = [
          { fullName: { [Op.like]: `%${trimmedSearch}%` } },
          { phone: { [Op.like]: `%${trimmedSearch}%` } },
          { company: { [Op.like]: `%${trimmedSearch}%` } }
        ];
      }
    }

    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const { count, rows } = await Visit.findAndCountAll({
      where,
      include: [
        { model: Visitor, as: 'visitor', where: Object.keys(visitorWhere).length ? visitorWhere : undefined },
        { model: User, as: 'host', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'building', 'floor'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return res.status(200).json({
      success: true,
      data: rows,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTodayVisits = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const visits = await Visit.findAll({
      where: {
        [Op.or]: [
          { checkInTime: { [Op.between]: [todayStart, todayEnd] } },
          { status: 'checked_in' },
          { status: 'pending' }
        ]
      },
      include: [
        { model: Visitor, as: 'visitor' },
        { model: User, as: 'host', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: Department, as: 'department' }
      ],
      order: [['updatedAt', 'DESC']]
    });

    const activeInside = visits.filter(v => v.status === 'checked_in').length;
    const pendingApproval = visits.filter(v => v.status === 'pending').length;
    const completedToday = visits.filter(v => v.status === 'checked_out').length;

    return res.status(200).json({
      success: true,
      data: {
        activeInside,
        pendingApproval,
        completedToday,
        visits
      }
    });
  } catch (error) {
    next(error);
  }
};

export const checkInVisit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const visit = await Visit.findByPk(id, {
      include: [{ model: Visitor, as: 'visitor' }, { model: User, as: 'host' }]
    });

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    if (visit.status === 'checked_in') {
      return res.status(400).json({ success: false, message: 'Visitor is already checked in' });
    }

    await visit.update({
      status: 'checked_in',
      checkInTime: new Date(),
      guardId: req.user.role === 'guard' ? req.user.id : visit.guardId
    });

    // Notify host
    await Notification.create({
      userId: visit.hostId,
      visitId: visit.id,
      title: 'Visitor Checked In',
      message: `${visit.visitor.fullName} has checked in and is on their way to see you.`,
      type: 'arrival'
    });

    await logAudit({
      req,
      action: 'VISITOR_CHECK_IN',
      entityType: 'Visit',
      entityId: visit.id,
      details: { badgeNumber: visit.badgeNumber }
    });

    return res.status(200).json({
      success: true,
      message: 'Visitor checked in successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

export const checkOutVisit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const visit = await Visit.findByPk(id, {
      include: [{ model: Visitor, as: 'visitor' }, { model: User, as: 'host' }]
    });

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    if (visit.status === 'checked_out') {
      return res.status(400).json({ success: false, message: 'Visitor is already checked out' });
    }

    const checkOutTime = new Date();
    await visit.update({
      status: 'checked_out',
      checkOutTime
    });

    // Notify host
    await Notification.create({
      userId: visit.hostId,
      visitId: visit.id,
      title: 'Visitor Departed',
      message: `${visit.visitor.fullName} has checked out of the premises.`,
      type: 'checkout'
    });

    await logAudit({
      req,
      action: 'VISITOR_CHECK_OUT',
      entityType: 'Visit',
      entityId: visit.id,
      details: { badgeNumber: visit.badgeNumber, checkOutTime }
    });

    return res.status(200).json({
      success: true,
      message: 'Visitor checked out successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

export const approveVisit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const visit = await Visit.findByPk(id, {
      include: [{ model: Visitor, as: 'visitor' }]
    });

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    // Only host or admin can approve
    if (req.user.role === 'host' && visit.hostId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only approve visits addressed to you.' });
    }

    await visit.update({ status: 'approved' });

    await logAudit({
      req,
      action: 'VISIT_APPROVED',
      entityType: 'Visit',
      entityId: visit.id,
      details: { approvedBy: req.user.fullName }
    });

    return res.status(200).json({
      success: true,
      message: 'Visit approved',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

export const rejectVisit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const visit = await Visit.findByPk(id);

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    if (req.user.role === 'host' && visit.hostId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only reject visits addressed to you.' });
    }

    await visit.update({
      status: 'rejected',
      notes: reason ? `${visit.notes || ''} [Rejection Reason: ${reason}]` : visit.notes
    });

    await logAudit({
      req,
      action: 'VISIT_REJECTED',
      entityType: 'Visit',
      entityId: visit.id,
      details: { rejectedBy: req.user.fullName, reason }
    });

    return res.status(200).json({
      success: true,
      message: 'Visit rejected',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

export const getVisitPass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cleanId = String(id || '').trim();
    if (!cleanId) {
      return res.status(400).json({ success: false, message: 'Pass identifier required' });
    }

    const upperId = cleanId.toUpperCase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    let visit = null;

    // 1. Direct Badge Number Lookup (exact, uppercase, or partial wildcard)
    try {
      visit = await Visit.findOne({
        where: {
          [Op.or]: [
            { badgeNumber: cleanId },
            { badgeNumber: upperId },
            { badgeNumber: { [Op.like]: `%${cleanId}%` } },
            { badgeNumber: { [Op.like]: `%${upperId}%` } }
          ]
        },
        include: [
          { model: Visitor, as: 'visitor' },
          { model: User, as: 'host', attributes: ['id', 'fullName', 'email', 'phone'] },
          { model: Department, as: 'department' }
        ],
        order: [['createdAt', 'DESC']]
      });
    } catch {
      // quiet fallback
    }

    // 2. Primary Key UUID Lookup (only if string matches UUID format to prevent PG error)
    if (!visit && isUuid) {
      try {
        visit = await Visit.findByPk(cleanId, {
          include: [
            { model: Visitor, as: 'visitor' },
            { model: User, as: 'host', attributes: ['id', 'fullName', 'email', 'phone'] },
            { model: Department, as: 'department' }
          ]
        });
      } catch {
        // Not a valid PK format
      }
    }

    // 3. Fallback: Search by Visitor Phone Number or Full Name (returns latest visit)
    if (!visit && cleanId.length >= 3) {
      try {
        const matchedVisitors = await Visitor.findAll({
          where: {
            [Op.or]: [
              { phone: { [Op.like]: `%${cleanId}%` } },
              { fullName: { [Op.like]: `%${cleanId}%` } }
            ]
          },
          attributes: ['id']
        });

        if (matchedVisitors.length > 0) {
          const visitorIds = matchedVisitors.map((v) => v.id);
          visit = await Visit.findOne({
            where: { visitorId: { [Op.in]: visitorIds } },
            include: [
              { model: Visitor, as: 'visitor' },
              { model: User, as: 'host', attributes: ['id', 'fullName', 'email', 'phone'] },
              { model: Department, as: 'department' }
            ],
            order: [['createdAt', 'DESC']]
          });
        }
      } catch {
        // search error
      }
    }

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    return res.status(200).json({
      success: true,
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

export const getEmergencyManifest = async (req, res, next) => {
  try {
    const activeVisits = await Visit.findAll({
      where: { status: 'checked_in' },
      include: [
        { model: Visitor, as: 'visitor' },
        { model: User, as: 'host', attributes: ['id', 'fullName', 'phone', 'email'] },
        { model: Department, as: 'department' }
      ],
      order: [['checkInTime', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      timestamp: new Date(),
      totalInside: activeVisits.length,
      data: activeVisits
    });
  } catch (error) {
    next(error);
  }
};

export const deleteVisit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const visit = await Visit.findByPk(id, {
      include: [{ model: Visitor, as: 'visitor' }]
    });

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit record not found' });
    }

    // Safety guard: cannot delete an active visitor who is currently inside the building
    if (visit.status === 'checked_in') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an active visit. The visitor must be checked out first.'
      });
    }

    const badgeNumber = visit.badgeNumber;
    const visitorName = visit.visitor?.fullName;
    const visitorId = visit.visitorId;

    // Delete associated notifications
    await Notification.destroy({ where: { visitId: id } });

    // Delete visit record
    await visit.destroy();

    // If visitor profile has no other visits, clean up visitor record
    if (visitorId) {
      const remainingVisits = await Visit.count({ where: { visitorId } });
      if (remainingVisits === 0) {
        await Visitor.destroy({ where: { id: visitorId } });
      }
    }

    await logAudit({
      req,
      action: 'VISIT_DELETED',
      entityType: 'Visit',
      entityId: id,
      details: { badgeNumber, visitor: visitorName }
    });

    return res.status(200).json({
      success: true,
      message: 'Visitor record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

