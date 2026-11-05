import jwt from 'jsonwebtoken';
import { User, Department } from '../models/index.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vms_super_secret_production_ready_jwt_key_2026_x89!');
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'building', 'floor'] }]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated or does not exist.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please refresh your session.',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.'
    });
  }
};

export const optionalAuthenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vms_super_secret_production_ready_jwt_key_2026_x89!');
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'building', 'floor'] }]
    });

    if (user && user.isActive) {
      req.user = user;
    } else {
      req.user = null;
    }
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};


