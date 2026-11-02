import { Department, User, Visit } from '../models/index.js';
import { logAudit } from '../utils/auditLogger.js';

export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.findAll({
      include: [
        { model: User, as: 'head', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'fullName', 'role'] }
      ],
      order: [['name', 'ASC']]
    });

    // Calculate active visitor count per department
    const results = await Promise.all(
      departments.map(async (dept) => {
        const activeCount = await Visit.count({
          where: {
            departmentId: dept.id,
            status: 'checked_in'
          }
        });
        const deptJson = dept.toJSON();
        deptJson.activeVisitorsCount = activeCount;
        return deptJson;
      })
    );

    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, floor, building, headId } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }

    const dept = await Department.create({
      name: name.trim(),
      floor: floor || 'Ground Floor',
      building: building || 'Main Tower',
      headId: headId || null
    });

    await logAudit({
      req,
      action: 'DEPARTMENT_CREATED',
      entityType: 'Department',
      entityId: dept.id,
      details: { name: dept.name }
    });

    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: dept
    });
  } catch (error) {
    next(error);
  }
};

