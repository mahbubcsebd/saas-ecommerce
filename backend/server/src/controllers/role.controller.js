const roleService = require('../services/role.service');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * Get all custom roles
 */
exports.getAllRoles = asyncHandler(async (req, res) => {
    const roles = await roleService.getAllRoles();
    return successResponse(res, {
        message: 'Roles retrieved successfully',
        data: roles
    });
});

/**
 * Get role by ID
 */
exports.getRoleById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const role = await roleService.getRoleById(id);

    if (!role) {
        throw ApiError.notFound('Role not found');
    }

    return successResponse(res, {
        message: 'Role details retrieved successfully',
        data: role
    });
});

/**
 * Create custom role
 */
exports.createRole = asyncHandler(async (req, res) => {
    const { name, description, permissions } = req.body;

    if (!name) {
        throw ApiError.badRequest('Role name is required');
    }

    const role = await roleService.createRole({ name, description, permissions });

    return successResponse(res, {
        statusCode: 201,
        message: 'Role created successfully',
        data: role
    });
});

/**
 * Update custom role
 */
exports.updateRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const updatedRole = await roleService.updateRole(id, { name, description, permissions });

    return successResponse(res, {
        message: 'Role updated successfully',
        data: updatedRole
    });
});

/**
 * Delete custom role
 */
exports.deleteRole = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        await roleService.deleteRole(id);
        return successResponse(res, {
            message: 'Role deleted successfully'
        });
    } catch (error) {
        throw ApiError.badRequest(error.message);
    }
});
