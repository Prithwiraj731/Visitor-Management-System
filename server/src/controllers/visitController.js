import crypto from 'crypto';
import QRCode from 'qrcode';
import { Op } from 'sequelize';
import { Visit, Visitor, User, Department, Notification } from '../models/index.js';
import { logAudit } from '../utils/auditLogger.js';
import { readLockdownState } from './systemController.js';
import {
  signQrPayload,
  verifyQrSignature,
  escapeLike,
  maskPhone
} from '../config/security.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper to generate cryptographically random unique badge serial
const generateBadgeNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomInt(10000000, 99999999);
  return `VMS-${dateStr}-${rand}`;
};

const findHostUser = async (hostId, hostNameParam) => {
  let hostUser = null;

  if (hostId && UUID_REGEX.test(String(hostId).trim())) {
    hostUser = await User.findOne({
      where: { id: String(hostId).trim(), isActive: true },
      include: [{ model: Department, as: 'department' }]
    });
  }

  // Allow standby name resolution when UI submits fallback host name
  if (!hostUser && hostId && !UUID_REGEX.test(String(hostId).trim())) {
    const cleanHost = escapeLike(String(hostId).replace(/\(.*?\)/g, '').trim());
    if (cleanHost.length >= 2) {
      hostUser = await User.findOne({
        where: {
          [Op.or]: [
            { fullName: { [Op.like]: `%${cleanHost}%` } },
            { email: cleanHost.toLowerCase() }
          ],
          isActive: true
        },
        include: [{ model: Department, as: 'department' }]
      });
    }
  }

  if (!hostUser && hostNameParam) {
    const cleanName = escapeLike(String(hostNameParam).replace(/\(.*?\)/g, '').trim());
    if (cleanName.length >= 2) {
      hostUser = await User.findOne({
        where: {
          fullName: { [Op.like]: `%${cleanName}%` },
          isActive: true
        },
        include: [{ model: Department, as: 'department' }]
      });
    }
  }

  return hostUser;
};

export const createVisit = async (req, res, next) => {
  try {
    const isPublicKiosk = !req.user;

    if (isPublicKiosk) {
      const lockdown = await readLockdownState();
      if (lockdown.isLockdown) {
        return res.status(423).json({
          success: false,
          message: 'DEFCON 1 Lockdown active: Kiosk self-registration is temporarily suspended. Report to security desk.'
        });
      }
    }

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

    const cleanPhone = phone.trim();

    // 1. Find or create visitor profile safely
    let visitor = await Visitor.findOne({ where: { phone: cleanPhone } });
    if (!visitor) {
      visitor = await Visitor.create({
        fullName: fullName.trim(),
        email: email ? email.trim().toLowerCase() : null,
        phone: cleanPhone,
        company: company ? company.trim() : null,
        photoUrl: photoUrl || null,
        idProofType: idProofType || 'National ID / Driving License',
        idProofNumber: idProofNumber || null
      });
    } else if (!isPublicKiosk) {
      // Only authenticated staff may update stored visitor profile fields
      await visitor.update({
        fullName: fullName.trim(),
        email: email ? email.trim().toLowerCase() : visitor.email,
        company: company ? company.trim() : visitor.company,
        photoUrl: photoUrl || visitor.photoUrl,
        idProofNumber: idProofNumber || visitor.idProofNumber
      });
    }

    // 2. Resolve host employee strictly (no arbitrary fallback to unrelated admins)
    const hostNameParam = req.body.hostName || req.body.host;
    const hostUser = await findHostUser(hostId, hostNameParam);

    if (!hostUser) {
      return res.status(404).json({
        success: false,
        message: 'Selected host employee was not found or is inactive.'
      });
    }

    const targetDeptId = departmentId || hostUser.departmentId || null;

    // 3. Prepare Signed Visit Record
    const badgeNumber = generateBadgeNumber();
    const issuedAt = new Date().toISOString();
    const signedQrObj = signQrPayload({
      vmsBadge: badgeNumber,
      visitor: visitor.fullName,
      host: hostUser.fullName,
      createdAt: issuedAt
    });
    const qrPayload = JSON.stringify(signedQrObj);
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, { width: 300, margin: 1 });

    const isStaffDirectCheckIn = Boolean(
      autoCheckIn &&
      req.user &&
      (req.user.role === 'guard' || req.user.role === 'admin' || req.user.role === 'super_admin')
    );
    const initialStatus = isStaffDirectCheckIn ? 'checked_in' : 'pending';
    const effectiveVisitType = isPublicKiosk ? 'walk_in' : visitType;

    const visit = await Visit.create({
      visitorId: visitor.id,
      hostId: hostUser.id,
      departmentId: targetDeptId,
      guardId: req.user?.role === 'guard' ? req.user.id : null,
      purpose: purpose.trim(),
      visitType: effectiveVisitType,
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

    // 5. Return loaded record (sanitize sensitive fields for unauthenticated kiosk responses)
    const createdVisit = await Visit.findByPk(visit.id, {
      include: [
        {
          model: Visitor,
          as: 'visitor',
          attributes: isPublicKiosk ? ['id', 'fullName', 'company', 'phone'] : undefined
        },
        {
          model: User,
          as: 'host',
          attributes: isPublicKiosk ? ['id', 'fullName'] : ['id', 'fullName', 'email', 'phone']
        },
        { model: Department, as: 'department', attributes: ['id', 'name', 'floor', 'building'] }
      ]
    });

    const responseData = createdVisit.toJSON();
    if (isPublicKiosk && responseData.visitor?.phone) {
      responseData.visitor.phone = maskPhone(responseData.visitor.phone);
    }

    return res.status(201).json({
      success: true,
      message: initialStatus === 'checked_in' ? 'Visitor checked in successfully' : 'Visit registration submitted',
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};

export const getVisits = async (req, res, next) => {
  try {
    const querySource = req.validatedQuery || req.query;
    const {
      status,
      departmentId,
      hostId,
      search,
      badgeNumber,
      fromDate,
      toDate,
      page = 1,
      limit = 20
    } = querySource;

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const where = {};
    const visitorWhere = {};

    // Role-based scoping: regular hosts only see visits for themselves
    if (req.user.role === 'host') {
      where.hostId = req.user.id;
    } else if (hostId) {
      where.hostId = hostId;
    }

    if (badgeNumber) {
      where.badgeNumber = { [Op.like]: `%${escapeLike(badgeNumber.trim())}%` };
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
      const trimmedSearch = escapeLike(search.trim());
      if (/^VMS-/i.test(search.trim())) {
        where.badgeNumber = { [Op.like]: `%${trimmedSearch}%` };
      } else {
        visitorWhere[Op.or] = [
          { fullName: { [Op.like]: `%${trimmedSearch}%` } },
          { phone: { [Op.like]: `%${trimmedSearch}%` } },
          { company: { [Op.like]: `%${trimmedSearch}%` } }
        ];
      }
    }

    const offset = (safePage - 1) * safeLimit;

    const { count, rows } = await Visit.findAndCountAll({
      where,
      include: [
        { model: Visitor, as: 'visitor', where: Object.keys(visitorWhere).length ? visitorWhere : undefined },
        { model: User, as: 'host', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'building', 'floor'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: safeLimit,
      offset
    });

    return res.status(200).json({
      success: true,
      data: rows,
      meta: {
        page: safePage,
        limit: safeLimit,
        total: count,
        totalPages: Math.ceil(count / safeLimit)
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

    const roleScope = req.user.role === 'host' ? { hostId: req.user.id } : {};

    const visits = await Visit.findAll({
      where: {
        ...roleScope,
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

    if (!['pending', 'approved'].includes(visit.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot check in visit with status '${visit.status}'.`
      });
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

    if (visit.status !== 'checked_in') {
      return res.status(400).json({
        success: false,
        message: `Cannot check out visit with status '${visit.status}'.`
      });
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

    if (visit.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Only pending visits can be approved (current status: '${visit.status}').`
      });
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

    if (!['pending', 'approved'].includes(visit.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject visit with status '${visit.status}'.`
      });
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

export const verifyVisitQr = async (req, res, next) => {
  try {
    const { qrData } = req.body;
    const raw = String(qrData || '').trim();
    let serialToLookup = null;
    let parsedJson = null;

    if (raw.startsWith('{')) {
      try {
        parsedJson = JSON.parse(raw);
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Malformed QR JSON payload.'
        });
      }

      if (!parsedJson || typeof parsedJson !== 'object') {
        return res.status(400).json({ success: false, message: 'Invalid QR structure.' });
      }

      // If signed credential (v2+), strictly enforce HMAC signature
      if (parsedJson.sig !== undefined || parsedJson.v >= 2) {
        if (!verifyQrSignature(parsedJson)) {
          await logAudit({
            req,
            action: 'QR_SIGNATURE_INVALID',
            entityType: 'Visit',
            entityId: parsedJson.vmsBadge || 'UNKNOWN',
            details: { reason: 'HMAC mismatch' }
          });
          return res.status(403).json({
            success: false,
            message: 'SECURITY ALERT: Invalid or tampered QR credential signature.'
          });
        }
      }

      serialToLookup = String(
        parsedJson.vmsBadge || parsedJson.badgeNumber || parsedJson.badge || parsedJson.id || ''
      ).trim();
    } else {
      const vmsMatch = raw.match(/VMS-\d{8}-\d+/i);
      serialToLookup = vmsMatch ? vmsMatch[0].toUpperCase() : raw;
    }

    if (!serialToLookup) {
      return res.status(400).json({
        success: false,
        message: 'QR payload does not contain a valid badge identifier.'
      });
    }

    const whereClause = UUID_REGEX.test(serialToLookup)
      ? { id: serialToLookup }
      : { badgeNumber: serialToLookup.toUpperCase() };

    const visit = await Visit.findOne({
      where: whereClause,
      include: [
        { model: Visitor, as: 'visitor' },
        { model: User, as: 'host', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: Department, as: 'department' }
      ]
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: `No visit record matches credential "${serialToLookup}".`
      });
    }

    // Verify legacy unsigned JSON fields match DB record
    if (parsedJson && parsedJson.sig === undefined) {
      const visitorMatches =
        !parsedJson.visitor ||
        parsedJson.visitor.toLowerCase() === (visit.visitor?.fullName || '').toLowerCase();
      if (!visitorMatches) {
        return res.status(403).json({
          success: false,
          message: 'QR payload visitor identity does not match registered badge.'
        });
      }
    }

    return res.status(200).json({
      success: true,
      verifiedSignature: Boolean(parsedJson?.sig),
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

    const isStaff = Boolean(req.user);
    const upperId = cleanId.toUpperCase();
    const isUuid = UUID_REGEX.test(cleanId);

    const includeConfig = [
      {
        model: Visitor,
        as: 'visitor',
        attributes: isStaff ? undefined : ['id', 'fullName', 'company', 'phone']
      },
      {
        model: User,
        as: 'host',
        attributes: isStaff ? ['id', 'fullName', 'email', 'phone'] : ['id', 'fullName']
      },
      {
        model: Department,
        as: 'department',
        attributes: ['id', 'name', 'floor', 'building']
      }
    ];

    const visitAttributes = isStaff
      ? undefined
      : ['id', 'status', 'badgeNumber', 'qrCode', 'purpose', 'visitType', 'checkInTime', 'checkOutTime', 'createdAt', 'updatedAt'];

    let visit = null;

    // 1. Exact Badge Serial lookup (no Op.like substring matching)
    visit = await Visit.findOne({
      where: {
        [Op.or]: [
          { badgeNumber: cleanId },
          { badgeNumber: upperId }
        ]
      },
      attributes: visitAttributes,
      include: includeConfig,
      order: [['createdAt', 'DESC']]
    });

    // 2. Exact UUID lookup
    if (!visit && isUuid) {
      visit = await Visit.findByPk(cleanId, {
        attributes: visitAttributes,
        include: includeConfig
      });
    }

    // 3. Exact Phone recovery lookup (only when >= 7 digits; no fullName or partial substring search)
    const digitCount = cleanId.replace(/\D/g, '').length;
    if (!visit && digitCount >= 7) {
      const matchedVisitor = await Visitor.findOne({
        where: { phone: cleanId },
        attributes: ['id']
      });

      if (matchedVisitor) {
        visit = await Visit.findOne({
          where: { visitorId: matchedVisitor.id },
          attributes: visitAttributes,
          include: includeConfig,
          order: [['createdAt', 'DESC']]
        });
      }
    }

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    const payload = visit.toJSON();
    if (!isStaff && payload.visitor?.phone) {
      payload.visitor.phone = maskPhone(payload.visitor.phone);
    }

    return res.status(200).json({
      success: true,
      data: payload
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
