const staffService = require('../services/staff.service');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * Get all staff members
 */
exports.getAllStaff = asyncHandler(async (req, res) => {
    const staff = await staffService.getAllStaff();
    return successResponse(res, {
        message: 'Staff members retrieved successfully',
        data: staff
    });
});

/**
 * Update staff permissions
 */
exports.updatePermissions = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
        throw ApiError.badRequest('Permissions must be an array of strings');
    }

    const updatedUser = await staffService.updatePermissions(userId, permissions);

    // Track this action
    await staffService.logActivity({
        userId: req.user.id,
        action: 'UPDATE_PERMISSIONS',
        target: `User: ${updatedUser.firstName} ${updatedUser.lastName}`,
        metadata: { permissions },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
    });

    return successResponse(res, {
        message: 'Permissions updated successfully',
        data: updatedUser
    });
});

/**
 * Get staff activity logs
 */
exports.getActivityLogs = asyncHandler(async (req, res) => {
    const { userId, action, startDate, endDate, search, page, limit } = req.query;

    const logsData = await staffService.getActivityLogs({
        userId,
        action,
        startDate,
        endDate,
        search,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20
    });

    return successResponse(res, {
        message: 'Activity logs retrieved successfully',
        data: logsData
    });
});

/**
 * Export activity logs as CSV
 */
exports.exportActivityLogs = asyncHandler(async (req, res) => {
    const { userId, action, startDate, endDate, search } = req.query;

    const logs = await staffService.getActivityLogsForExport({
        userId,
        action,
        startDate,
        endDate,
        search
    });

    if (!logs || logs.length === 0) {
        return successResponse(res, { message: 'No logs found to export', data: [] });
    }

    // Generate CSV
    const csvRows = [];
    // Header
    csvRows.push(['Timestamp', 'User', 'Email', 'Action', 'Target', 'IP Address'].join(','));

    // Rows
    logs.forEach(log => {
        const row = [
            `"${new Date(log.timestamp).toLocaleString()}"`,
            `"${log.user.firstName} ${log.user.lastName}"`,
            `"${log.user.email}"`,
            `"${log.action}"`,
            `"${log.target.replace(/"/g, '""')}"`,
            `"${log.ipAddress || 'Internal'}"`
        ];
        csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=activity_logs_${new Date().toISOString().split('T')[0]}.csv`);

    return res.status(200).send(csvContent);
});

/**
 * Log a generic activity (called by other controllers via service or this controller if needed)
 */
exports.logActivity = asyncHandler(async (req, res) => {
    const { action, target, metadata } = req.body;

    const activity = await staffService.logActivity({
        userId: req.user.id,
        action,
        target,
        metadata,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
    });

    return successResponse(res, {
        message: 'Activity logged successfully',
        data: activity
    });
});
