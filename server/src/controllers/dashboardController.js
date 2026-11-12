import { Op } from 'sequelize';
import { Visit, Visitor, Department, User } from '../models/index.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const isStaff = Boolean(req.user);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Filter by role if host
    const baseWhere = req.user?.role === 'host' ? { hostId: req.user.id } : {};

    // 10-hour cutoff for checked-out visitors
    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);

    // Who is here criteria:
    // - Actively checked in (approved by guard)
    // - OR checked out within the last 10 hours
    // - Excludes all pending (awaited for approval) visits
    const whoIsHereWhere = {
      ...baseWhere,
      [Op.or]: [
        { status: 'checked_in' },
        {
          status: 'checked_out',
          checkOutTime: { [Op.gte]: tenHoursAgo }
        }
      ]
    };

    const recentVisitQuery = isStaff
      ? {
          where: whoIsHereWhere,
          include: [
            { model: Visitor, as: 'visitor', attributes: ['id', 'fullName', 'company', 'phone'] },
            { model: User, as: 'host', attributes: ['id', 'fullName'] },
            { model: Department, as: 'department', attributes: ['id', 'name', 'floor', 'building'] }
          ],
          order: [['updatedAt', 'DESC']],
          limit: 20
        }
      : {
          // Public landing feed: return non-PII operational telemetry only (no phone, email, ID proof, QR, or notes)
          where: whoIsHereWhere,
          attributes: ['id', 'status', 'checkInTime', 'checkOutTime', 'createdAt', 'updatedAt'],
          include: [
            { model: Visitor, as: 'visitor', attributes: ['id', 'fullName'] },
            { model: User, as: 'host', attributes: ['id', 'fullName'] },
            { model: Department, as: 'department', attributes: ['id', 'name'] }
          ],
          order: [['updatedAt', 'DESC']],
          limit: 20
        };

    const [
      totalToday,
      currentlyInside,
      pendingApprovals,
      completedToday,
      recentVisits
    ] = await Promise.all([
      Visit.count({
        where: {
          ...baseWhere,
          createdAt: { [Op.between]: [todayStart, todayEnd] }
        }
      }),
      Visit.count({
        where: {
          ...baseWhere,
          status: 'checked_in'
        }
      }),
      Visit.count({
        where: {
          ...baseWhere,
          status: 'pending'
        }
      }),
      Visit.count({
        where: {
          ...baseWhere,
          status: 'checked_out',
          checkOutTime: { [Op.between]: [todayStart, todayEnd] }
        }
      }),
      Visit.findAll(recentVisitQuery)
    ]);

    // Average duration in minutes for completed visits
    const completedList = await Visit.findAll({
      where: {
        ...baseWhere,
        status: 'checked_out',
        checkInTime: { [Op.ne]: null },
        checkOutTime: { [Op.ne]: null }
      },
      attributes: ['checkInTime', 'checkOutTime'],
      limit: 50
    });

    let avgDurationMinutes = 0;
    if (completedList.length > 0) {
      const totalMinutes = completedList.reduce((acc, v) => {
        const diff = (new Date(v.checkOutTime) - new Date(v.checkInTime)) / 60000;
        return acc + (diff > 0 ? diff : 0);
      }, 0);
      avgDurationMinutes = Math.round(totalMinutes / completedList.length);
    }

    return res.status(200).json({
      success: true,
      data: {
        totalToday,
        currentlyInside,
        pendingApprovals,
        completedToday,
        avgDurationMinutes,
        recentVisits
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTrends = async (req, res, next) => {
  try {
    const days = 7;
    const trends = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const count = await Visit.count({
        where: {
          createdAt: { [Op.between]: [dayStart, dayEnd] }
        }
      });

      const dayLabel = dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      trends.push({ date: dayLabel, visits: count });
    }

    // Top companies
    const visitorsWithCompany = await Visitor.findAll({
      where: { company: { [Op.ne]: null } },
      attributes: ['company']
    });

    const companyCounts = {};
    visitorsWithCompany.forEach(v => {
      const c = v.company?.trim();
      if (c) companyCounts[c] = (companyCounts[c] || 0) + 1;
    });

    const topCompanies = Object.entries(companyCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Department breakdown
    const departments = await Department.findAll();
    const deptDistribution = await Promise.all(
      departments.map(async (d) => {
        const count = await Visit.count({ where: { departmentId: d.id } });
        return { name: d.name, count };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        trends,
        topCompanies,
        deptDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};
