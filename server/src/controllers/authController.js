import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User, Department } from '../models/index.js';
import { logAudit } from '../utils/auditLogger.js';
import {
  securityConfig,
  revokeRefreshJti,
  isRefreshJtiRevoked,
  recordUserLogout,
  isTokenIssuedBeforeLogout
} from '../config/security.js';

const getRefreshCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
};

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    securityConfig.jwtSecret,
    { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );

  const refreshToken = jwt.sign(
    { id: user.id, jti: crypto.randomUUID() },
    securityConfig.jwtRefreshSecret,
    { algorithm: 'HS256', expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      where: { email: normalizedEmail },
      include: [{ model: Department, as: 'department' }]
    });

    if (!user) {
      await logAudit({
        req,
        action: 'USER_LOGIN_FAILED',
        entityType: 'User',
        details: { email: normalizedEmail, reason: 'USER_NOT_FOUND' }
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      await logAudit({
        req,
        action: 'USER_LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        details: { email: normalizedEmail, reason: 'ACCOUNT_DISABLED' }
      });
      return res.status(403).json({
        success: false,
        message: 'This account has been disabled. Contact system administrator.'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await logAudit({
        req,
        action: 'USER_LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        details: { email: normalizedEmail, reason: 'INVALID_PASSWORD' }
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Set secure HTTP-only refresh cookie
    res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

    await logAudit({
      req,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role }
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token missing'
      });
    }

    const decoded = jwt.verify(token, securityConfig.jwtRefreshSecret, { algorithms: ['HS256'] });

    if (
      (decoded.jti && isRefreshJtiRevoked(decoded.jti)) ||
      isTokenIssuedBeforeLogout(decoded.id, decoded.iat)
    ) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked'
      });
    }

    const user = await User.findByPk(decoded.id, {
      include: [{ model: Department, as: 'department' }]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User no longer active or found'
      });
    }

    // Rotate refresh token: revoke the old jti and issue a fresh token pair
    if (decoded.jti) {
      revokeRefreshJti(decoded.jti);
    }

    const { accessToken, refreshToken } = generateTokens(user);
    res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: user.toJSON()
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

export const logout = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, securityConfig.jwtRefreshSecret, {
        algorithms: ['HS256'],
        ignoreExpiration: true
      });
      if (decoded?.jti) {
        revokeRefreshJti(decoded.jti);
      }
    } catch {
      // ignore invalid refresh token on logout
    }
  }

  const clearOpts = getRefreshCookieOptions();
  delete clearOpts.maxAge;
  res.clearCookie('refreshToken', clearOpts);

  if (req.user) {
    recordUserLogout(req.user.id);
    await logAudit({
      req,
      action: 'USER_LOGOUT',
      entityType: 'User',
      entityId: req.user.id
    });
  }
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user.toJSON()
  });
};
