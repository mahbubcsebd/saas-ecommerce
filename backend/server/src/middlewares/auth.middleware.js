const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
require('dotenv').config();
const { excludeFields } = require('../utils/exclude');

// 1. Authenticate User
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
    // Fallback to cookie
    else if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // Fallback to query param (for downloads/email links)
    else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      console.log(`[AUTH] Missing token for ${req.method} ${req.originalUrl}`);
      return res.status(401).json({
        success: false,
        message: 'Access token not found',
        code: 'TOKEN_MISSING',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_KEY || 'FHDJKFHDJKSHFJKFHJKDSHF'
      );
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access token expired',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid access token',
        code: 'TOKEN_INVALID',
      });
    }

    // Fetch User
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        customRole: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.status !== 'ACTIVE' && user.isActive === false) {
       return res.status(403).json({
         success: false,
         message: 'Account is inactive',
         code: 'USER_INACTIVE',
       });
    }

    req.user = excludeFields(user, ['password']);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// 2. Role Guards (Hierarchical)

// Super Admin Only
const isSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, message: 'Super Admin access required', code: 'FORBIDDEN' });
    }
    next();
};

// Admin or above (SUPER_ADMIN, ADMIN)
const isAdmin = (req, res, next) => {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Admin access required', code: 'FORBIDDEN' });
    }
    next();
};

// Manager or above (SUPER_ADMIN, ADMIN, MANAGER)
const isManager = (req, res, next) => {
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Manager access required', code: 'FORBIDDEN' });
    }
    next();
};

// Staff or above (SUPER_ADMIN, ADMIN, MANAGER, STAFF)
const isStaff = (req, res, next) => {
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Staff access required', code: 'FORBIDDEN' });
    }
    next();
};

// 3. Special Permissions

// Can Manage User
const canManageUser = async (req, res, next) => {
    try {
        const targetUserId = req.params.id || req.params.userId || req.body.userId;

        if (!targetUserId) return next();

        // If managing self, allow? Usually user management is by others.
        // Let's assume this is for Admin actions.

        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { role: true }
        });

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const currentUserRole = req.user.role;

        // Super Admin can manage everyone
        if (currentUserRole === 'SUPER_ADMIN') return next();



        // Admin cannot manage Super Admin
        if (currentUserRole === 'ADMIN') {
            if (targetUser.role === 'SUPER_ADMIN') {
                return res.status(403).json({ success: false, message: 'Cannot manage Super Admin' });
            }
            return next();
        }

        // Managers/Staff cannot manage users (handled by isAdmin guard usually, but double check)
        return res.status(403).json({ success: false, message: 'Insufficient permissions to manage users' });

    } catch (error) {
        next(error);
    }
};

// 4. Permission-based Guard
const hasPermission = (permission) => {
    return (req, res, next) => {
        const user = req.user;

        // Admins and Super Admins have all permissions
        if (['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
            return next();
        }

        // Aggregate permissions from user and custom role
        const userPermissions = user.permissions || [];
        const rolePermissions = user.customRole?.permissions || [];
        const allPermissions = [...new Set([...userPermissions, ...rolePermissions])];

        // Check if user has required permission
        // Supports wildcard check, e.g., 'product.*' includes 'product.read'
        const hasDirectPermission = allPermissions.includes(permission);
        const hasWildcardPermission = allPermissions.some(p => {
            if (p.endsWith('.*')) {
                const module = p.split('.')[0];
                return permission.startsWith(`${module}.`);
            }
            if (p === '*') return true;
            return false;
        });

        if (hasDirectPermission || hasWildcardPermission) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: `Insufficient permissions: ${permission} required`,
            code: 'INSUFFICIENT_PERMISSIONS'
        });
    };
};

module.exports = {
    authenticate,
    authMiddleware: authenticate, // Alias for backward compatibility if needed
    isAdmin,
    isManager,
    isStaff,
    canManageUser,
    hasPermission
};
