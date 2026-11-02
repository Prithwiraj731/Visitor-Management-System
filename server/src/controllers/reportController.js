import { Parser } from 'json2csv';
import { Op } from 'sequelize';
import { Visit, Visitor, User, Department } from '../models/index.js';

export const getReportSummary = async (req, res, next) => {
  try {
    const { fromDate, toDate, departmentId, status } = req.query;
    const where = {};

    if (fromDate && toDate) {
      where.createdAt = {
        [Op.between]: [new Date(fromDate), new Date(toDate)]
      };
    }
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;

    const visits = await Visit.findAll({
      where,
      include: [
        { model: Visitor, as: 'visitor' },
        { model: User, as: 'host', attributes: ['id', 'fullName', 'email'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      count: visits.length,
      data: visits
    });
  } catch (error) {
    next(error);
  }
};

export const exportCsv = async (req, res, next) => {
  try {
    const { fromDate, toDate, departmentId, status } = req.query;
    const where = {};

    if (fromDate && toDate) {
      where.createdAt = {
        [Op.between]: [new Date(fromDate), new Date(toDate)]
      };
    }
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;

    const visits = await Visit.findAll({
      where,
      include: [
        { model: Visitor, as: 'visitor' },
        { model: User, as: 'host', attributes: ['fullName'] },
        { model: Department, as: 'department', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const flattened = visits.map(v => ({
      'Badge Number': v.badgeNumber || 'N/A',
      'Visitor Name': v.visitor?.fullName || 'N/A',
      'Phone': v.visitor?.phone || 'N/A',
      'Company': v.visitor?.company || 'N/A',
      'Host Employee': v.host?.fullName || 'N/A',
      'Department': v.department?.name || 'N/A',
      'Purpose': v.purpose || 'N/A',
      'Status': v.status,
      'Check-In Time': v.checkInTime ? new Date(v.checkInTime).toLocaleString() : 'N/A',
      'Check-Out Time': v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : 'N/A',
      'Date Registered': new Date(v.createdAt).toLocaleDateString()
    }));

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(flattened);

    res.header('Content-Type', 'text/csv');
    res.attachment(`vms_visitor_report_${new Date().toISOString().slice(0, 10)}.csv`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

