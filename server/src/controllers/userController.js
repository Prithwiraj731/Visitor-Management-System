import { User, Department } from '../models/index.js';
import { logAudit } from '../utils/auditLogger.js';

export const getUsers = async (req, res, next) => {
  try {
    const { role, departmentId, isActive, search } = req.query;
    const where = {};

    if (role) where.role = role;
    if (departmentId) where.departmentId = departmentId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const users = await User.findAll({
      where,
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'building', 'floor'] }],
      order: [['fullName', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

export const getHosts = async (req, res, next) => {
  try {
    const hosts = await User.findAll({
      where: { role: 'host', isActive: true },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'floor', 'building'] }],
      order: [['fullName', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      data: hosts
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { fullName, email, password, role, phone, departmentId } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, password, and role are required.'
      });
    }

    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    const user = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      phone: phone ? phone.trim() : null,
      departmentId: departmentId || null
    });

    await logAudit({
      req,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role }
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, phone, departmentId, role, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.update({
      fullName: fullName !== undefined ? fullName : user.fullName,
      phone: phone !== undefined ? phone : user.phone,
      departmentId: departmentId !== undefined ? departmentId : user.departmentId,
      role: role !== undefined ? role : user.role,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    await logAudit({
      req,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: user.id,
      details: { role, isActive }
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

