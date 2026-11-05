import { Op } from 'sequelize';
import { Visit, Visitor, Department, User } from '../models/index.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Filter by role if host
    const baseWhere = req.user?.role === 'host' ? { hostId: req.user.id } : {};

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
      Visit.findAll({
        where: baseWhere,
        include: [
          { model: Visitor, as: 'visitor' },
          { model: User, as: 'host', attributes: ['id', 'fullName'] },
          { model: Department, as: 'department', attributes: ['id', 'name'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 8
      })
    ]);

    // Average duration in minutes for completed today visits
    const completedList = await Visit.findAll({
      where: {
        ...baseWhere,
        status: 'checked_out',
        checkInTime: { [Op.ne]: null },
        checkOutTime: { [Op.ne]: null }
      },
      limit: 50
    });

    let avgDurationMinutes = 45; // default fallback
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

