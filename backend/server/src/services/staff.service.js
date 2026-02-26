const prisma = require('../config/prisma');

class StaffService {
    /**
     * Get all users with staff-related roles
     */
    async getAllStaff() {
        return await prisma.user.findMany({
            where: {
                role: {
                    in: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'STAFFER']
                }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                username: true,
                role: true,
                status: true,
                isActive: true,
                permissions: true,
                customRoleId: true,
                customRole: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                avatar: true,
                phone: true,
                lastSeen: true,
                isOnline: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Update user permissions
     */
    async updatePermissions(userId, permissions) {
        return await prisma.user.update({
            where: { id: userId },
            data: { permissions }
        });
    }

    /**
     * Log staff activity
     */
    async logActivity(data) {
        return await prisma.staffActivity.create({
            data: {
                userId: data.userId,
                action: data.action,
                target: data.target,
                metadata: data.metadata || {},
                ipAddress: data.ipAddress,
                userAgent: data.userAgent
            }
        });
    }

    /**
     * Get activity logs
     */
    async getActivityLogs(filters = {}) {
        const { userId, action, startDate, endDate, search, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;

        const where = {};
        if (userId) where.userId = userId;
        if (action) where.action = action;

        // Date Range Filtering
        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp.gte = new Date(startDate);
            if (endDate) where.timestamp.lte = new Date(endDate);
        }

        // Search in user name/email or action/target
        if (search) {
            where.OR = [
                { action: { contains: search, mode: 'insensitive' } },
                { target: { contains: search, mode: 'insensitive' } },
                {
                    user: {
                        OR: [
                            { firstName: { contains: search, mode: 'insensitive' } },
                            { lastName: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } }
                        ]
                    }
                }
            ];
        }

        const [logs, total] = await Promise.all([
            prisma.staffActivity.findMany({
                where,
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatar: true
                        }
                    }
                },
                orderBy: { timestamp: 'desc' },
                skip,
                take: limit
            }),
            prisma.staffActivity.count({ where })
        ]);

        return {
            logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get activity logs for export (no pagination)
     */
    async getActivityLogsForExport(filters = {}) {
        const { userId, action, startDate, endDate, search } = filters;

        const where = {};
        if (userId) where.userId = userId;
        if (action) where.action = action;

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp.gte = new Date(startDate);
            if (endDate) where.timestamp.lte = new Date(endDate);
        }

        if (search) {
            where.OR = [
                { action: { contains: search, mode: 'insensitive' } },
                { target: { contains: search, mode: 'insensitive' } },
                {
                    user: {
                        OR: [
                            { firstName: { contains: search, mode: 'insensitive' } },
                            { lastName: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } }
                        ]
                    }
                }
            ];
        }

        return await prisma.staffActivity.findMany({
            where,
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            orderBy: { timestamp: 'desc' }
        });
    }
}

module.exports = new StaffService();
