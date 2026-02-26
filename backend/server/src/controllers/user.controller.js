const prisma = require('../config/prisma');
const { excludeFields } = require('../utils/exclude');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const { successResponse } = require('../utils/response');
const emailService = require('../services/emailService');

// Role hierarchy helper function
const getRoleHierarchy = (role) => {
  const hierarchy = {
    SUPER_ADMIN: 5,
    ADMIN: 4,
    MANAGER: 3,
    STAFF: 2,
    CUSTOMER: 1,
  };
  return hierarchy[role] || 0;
};

// Check if user can modify target user
const canModifyUser = (
  currentUserRole,
  targetUserRole,
  currentUserId,
  targetUserId
) => {
  const currentLevel = getRoleHierarchy(currentUserRole);
  const targetLevel = getRoleHierarchy(targetUserRole);

  // SUPER_ADMIN can modify anyone
  if (currentUserRole === 'SUPER_ADMIN') {
    return true;
  }

  // ADMIN can only modify MANAGER, STAFF, CUSTOMER
  if (currentUserRole === 'ADMIN') {
    return ['MANAGER', 'STAFF', 'CUSTOMER'].includes(targetUserRole);
  }

  // Users can usually modify themselves (managed in controller logic),
  // but this helper is often for "admin-like" actions on others.

  return false;
};

exports.getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    role,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    // Validate sort parameters
    const validSortFields = [
      'createdAt',
      'updatedAt',
      'firstName',
      'lastName',
      'email',
      'username',
    ];
    const validSortOrders = ['asc', 'desc'];

    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = validSortOrders.includes(sortOrder)
      ? sortOrder
      : 'desc';

    // Build where condition
    let whereCondition = {};

    // Search filter
    if (search && search.trim()) {
      whereCondition.OR = [
        { firstName: { contains: search.trim(), mode: 'insensitive' } },
        { lastName: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { username: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Status filter
    if (status === 'active') {
      whereCondition.isActive = true;
    } else if (status === 'inactive') {
      whereCondition.isActive = false;
    }

    // Role filter
    if (
      role &&
      ['CUSTOMER', 'ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF'].includes(role.toUpperCase())
    ) {
      whereCondition.role = role.toUpperCase();
    }

    // Get users with pagination and total count
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          role: true,
          phone: true,
          address: true,
          website: true,
          bio: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { orders: true }
          },
          orders: {
            where: { status: 'DELIVERED' }, // Sum only delivered orders for 'spent'
            select: { total: true }
          }
        },
        orderBy: {
          [sortField]: sortDirection,
        },
        skip,
        take: limitNum,
      }),
      prisma.user.count({
        where: whereCondition,
      }),
    ]);

    // Process users to calculate totalSpent and flatten counts
    const enrichedUsers = users.map(user => {
        const totalSpent = user.orders.reduce((sum, order) => sum + (order.total || 0), 0);
        // Remove orders array to keep response clean
        const { orders, ...rest } = user;
        return {
            ...rest,
            orderCount: user._count.orders,
            totalSpent
        };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);

    // Get stats
    const [
      activeCount,
      inactiveCount,
      adminCount,
      customerCount,
      superAdminCount,
      managerCount,
      staffCount,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
      prisma.user.count({ where: { role: 'MANAGER' } }),
      prisma.user.count({ where: { role: 'STAFF' } }),
    ]);

    return successResponse(res, {
        message: 'Users retrieved successfully',
        data: enrichedUsers,
        meta: {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            totalPages,
            stats: {
                total: totalCount,
                active: activeCount,
                inactive: inactiveCount,
                admins: adminCount,
                customers: customerCount,
                superAdmins: superAdminCount,
                managers: managerCount,
                staff: staffCount,
            }
        }
    });
});

exports.getUserById = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id; // Support both param and self

  if (!userId) {
    throw ApiError.badRequest('User ID is required');
  }

  // Validate ObjectID format
  if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      throw ApiError.badRequest('Invalid User ID format');
  }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw ApiError.notFound('User not found');
    }

    const safeUser = excludeFields(user, ['password']);

    return successResponse(res, {
        message: 'User retrieved successfully',
        data: safeUser,
    });
});

exports.updateUser = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { userId } = req.params; // Target user ID from URL
    const idToUpdate = userId || currentUser.id; // Default to self if no param

    if (!idToUpdate) {
      throw ApiError.badRequest('User ID is required');
    }

    // Check permissions if updating another user
    if (userId && userId !== currentUser.id) {
       // Fetch target user role for permission check
       const targetUser = await prisma.user.findUnique({
         where: { id: userId },
         select: { role: true }
       });

       if (!targetUser) {
         throw ApiError.notFound('User not found');
       }

       if (!canModifyUser(currentUser.role, targetUser.role, currentUser.id, userId)) {
          throw ApiError.forbidden('You do not have permission to update this user');
       }
    }

    // Pick only fields that exist in req.body
    const allowedFields = [
      'firstName',
      'lastName',
      'address',
      'phone',
      'website',
      'bio',
      'bio',
      'dob',
      'isActive',
      'status', // Added status
      'avatar',
    ];
    const updateData = {};

    // Handle file upload
    if (req.file) {
      updateData.avatar = req.file.path;
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'dob' && req.body[field]) {
          updateData[field] = new Date(req.body[field]);
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    // Sync isActive with status
    if (updateData.status) {
        if (updateData.status === 'ACTIVE') {
            updateData.isActive = true;
        } else {
            updateData.isActive = false;
        }
    } else if (updateData.isActive !== undefined) {
        // If only isActive is provided, update status accordingly
        updateData.status = updateData.isActive ? 'ACTIVE' : 'INACTIVE';
    }

    if (Object.keys(updateData).length === 0) {
      throw ApiError.badRequest('No valid fields provided to update');
    }

    const updatedUser = await prisma.user.update({
      where: { id: idToUpdate },
      data: updateData,
    });

    return successResponse(res, {
        message: 'User updated successfully',
        data: updatedUser,
    });
});

// Update user role (SUPERADMIN only)
exports.updateUserRole = exports.roleUpdate = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const currentUser = req.user;

  if (!userId || !role) {
    throw ApiError.badRequest('User ID and role are required');
  }

  // Only SUPERADMIN can update roles
  // Note: The original logic had complex hierarchy checks in roleUpdate vs updateUserRole.
  // I will use the more complex one from roleUpdate as it seems newer/better.

  const normalizedRole = role.toUpperCase();
  const currentUserRole = currentUser.role;

  // Validate role values
  const validRoles = ['CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'];
  if (!validRoles.includes(normalizedRole)) {
    throw ApiError.badRequest('Invalid role. Valid roles are: CUSTOMER, STAFF, MANAGER, ADMIN, SUPER_ADMIN');
  }

  // 1. Basic Auth Check
  if (!currentUserRole) {
      throw ApiError.forbidden('User role not found. Invalid authentication.');
  }

  // 2. Only SUPER_ADMIN can assign SUPER_ADMIN role
  if (normalizedRole === 'SUPER_ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      throw ApiError.forbidden('Only Super Administrators can assign Super Admin role');
  }

  // 3. Users can only assign roles equal or lower than their own
  const roleHierarchy = {
      CUSTOMER: 1,
      STAFF: 2,
      MANAGER: 3,
      ADMIN: 4,
      SUPER_ADMIN: 5,
  };

  if (roleHierarchy[normalizedRole] > roleHierarchy[currentUserRole]) {
      throw ApiError.forbidden(`You cannot assign a role higher than your own (${currentUserRole})`);
  }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, firstName: true, lastName: true, email: true },
    });

    if (!targetUser) {
      throw ApiError.notFound('User not found');
    }

    const currentUserId = currentUser.id;

    // 4. Prevent users from updating their own role (except SUPER_ADMIN)
    if (userId === currentUserId && currentUserRole !== 'SUPER_ADMIN') {
        throw ApiError.forbidden('You cannot update your own role');
    }

    // 5. Prevent SUPER_ADMIN from demoting themselves
    if (
      userId === currentUserId &&
      currentUserRole === 'SUPER_ADMIN' &&
      normalizedRole !== 'SUPER_ADMIN'
    ) {
        throw ApiError.forbidden('SUPER_ADMIN cannot demote themselves');
    }

    // 6. Prevent non-SUPER_ADMIN from modifying SUPER_ADMIN
    if (targetUser.role === 'SUPER_ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
        throw ApiError.forbidden('Only Super Administrators can modify Super Admin roles');
    }

    // 7. Check if role is already the same
    if (targetUser.role === normalizedRole) {
        throw ApiError.badRequest(`User already has ${normalizedRole} role`);
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: normalizedRole },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return successResponse(res, {
        message: `User role successfully updated from ${targetUser.role} to ${normalizedRole}`,
        data: {
            user: updatedUser,
            previousRole: targetUser.role,
            newRole: normalizedRole,
            updatedBy: {
                id: currentUserId,
                email: currentUser.email || 'N/A',
                role: currentUser.role,
            },
            timestamp: new Date().toISOString(),
        }
    });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUser = req.user;

  if (!userId) {
    throw ApiError.badRequest('User ID is required');
  }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, firstName: true, lastName: true },
    });

    if (!targetUser) {
      throw ApiError.notFound('User not found');
    }



    // Check permissions
    if (
      !canModifyUser(
        currentUser.role,
        targetUser.role,
        currentUser.id,
        userId
      )
    ) {
      throw ApiError.forbidden('You do not have permission to delete this user');
    }

    // Prevent SUPER_ADMIN from deleting themselves
    if (currentUser.role === 'SUPER_ADMIN' && currentUser.id === userId) {
      throw ApiError.forbidden('SUPER_ADMIN cannot delete themselves');
    }

    // Delete user from database
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    });

    return successResponse(res, {
        message: 'User deleted successfully',
        data: deletedUser,
    });
});

// Toggle user status with role hierarchy
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUser = req.user;

  if (!id) {
    throw ApiError.badRequest('User ID is required');
  }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, isActive: true, role: true },
    });

    if (!targetUser) {
      throw ApiError.notFound('User not found');
    }

    // Check permissions
    if (
      !canModifyUser(currentUser.role, targetUser.role, currentUser.id, id)
    ) {
      throw ApiError.forbidden('You do not have permission to modify this user');
    }

    // Prevent SUPER_ADMIN from deactivating themselves
    if (currentUser.role === 'SUPER_ADMIN' && currentUser.userId === id) {
      throw ApiError.forbidden('SUPER_ADMIN cannot deactivate themselves');
    }

    // Toggle status
    // Toggle status
    const newIsActive = !targetUser.isActive;
    const newStatus = newIsActive ? 'ACTIVE' : 'INACTIVE';

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
          isActive: newIsActive,
          status: newStatus
      },
    });

    return successResponse(res, {
        message: `User status updated to ${
            updatedUser.isActive ? 'Active' : 'Inactive'
        }`,
        data: updatedUser,
    });
});

// @desc    Send custom email to user
// @route   POST /api/v1/user/:userId/send-email
// @access  Private (Admin/Manager)
exports.sendEmailToUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { subject, message } = req.body;

    if (!subject || !message) {
        throw ApiError.badRequest('Subject and message are required');
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true }
    });

    if (!user) {
        throw ApiError.notFound('User not found');
    }

    await emailService.sendCustomEmail({
        to: user.email,
        subject,
        message
    });

    return successResponse(res, {
        message: `Email sent successfully to ${user.email}`,
    });
});

// @desc    Export customers to CSV
// @route   GET /api/v1/user/export
// @access  Private (Admin/Manager)
exports.exportCustomers = asyncHandler(async (req, res) => {
    const customers = await prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
            _count: {
                select: { orders: true }
            },
            orders: {
                where: { status: 'DELIVERED' },
                select: { total: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // CSV Header
    let csv = 'First Name,Last Name,Email,Phone,Status,Joined Date,Total Orders,Total Spent\n';

    // CSV Rows
    customers.forEach(user => {
        const totalSpent = user.orders.reduce((sum, order) => sum + (order.total || 0), 0);
        csv += `${user.firstName},${user.lastName},${user.email},${user.phone || ''},${user.isActive ? 'Active' : 'Inactive'},${user.createdAt.toISOString().split('T')[0]},${user._count.orders},${totalSpent}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
    return res.status(200).send(csv);
});
