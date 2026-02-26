const prisma = require('../config/prisma');

class RoleService {
    /**
     * Get all custom roles
     */
    async getAllRoles() {
        return await prisma.customRole.findMany({
            include: {
                _count: {
                    select: { users: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get role by ID
     */
    async getRoleById(id) {
        return await prisma.customRole.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
    }

    /**
     * Create custom role
     */
    async createRole(data) {
        return await prisma.customRole.create({
            data: {
                name: data.name,
                description: data.description,
                permissions: data.permissions || []
            }
        });
    }

    /**
     * Update custom role
     */
    async updateRole(id, data) {
        return await prisma.customRole.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                permissions: data.permissions
            }
        });
    }

    /**
     * Delete custom role
     */
    async deleteRole(id) {
        // Check if users are assigned to this role
        const userCount = await prisma.user.count({
            where: { customRoleId: id }
        });

        if (userCount > 0) {
            throw new Error('Cannot delete role while users are assigned to it');
        }

        return await prisma.customRole.delete({
            where: { id }
        });
    }
}

module.exports = new RoleService();
