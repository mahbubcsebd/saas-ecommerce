const prisma = require('../config/prisma');

// ============================================================
// CREATE a new customer group
// ============================================================
const createCustomerGroup = async (req, res) => {
    try {
        const { name, description, discountType, discountValue, isActive } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Group name is required.' });
        }

        if (discountType && !['PERCENTAGE', 'FLAT'].includes(discountType)) {
            return res.status(400).json({ success: false, message: 'discountType must be PERCENTAGE or FLAT.' });
        }

        const group = await prisma.customerGroup.create({
            data: {
                name,
                description: description || null,
                discountType: discountType || 'PERCENTAGE',
                discountValue: discountValue ? parseFloat(discountValue) : 0,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return res.status(201).json({ success: true, data: group });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'A group with this name already exists.' });
        }
        console.error('createCustomerGroup error:', error);
        return res.status(500).json({ success: false, message: 'Server error creating customer group.' });
    }
};

// ============================================================
// GET all customer groups with member count
// ============================================================
const getAllCustomerGroups = async (req, res) => {
    try {
        const groups = await prisma.customerGroup.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { users: true } },
            },
        });

        return res.status(200).json({ success: true, data: groups });
    } catch (error) {
        console.error('getAllCustomerGroups error:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching customer groups.' });
    }
};

// ============================================================
// GET a single customer group with its members
// ============================================================
const getCustomerGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [group, membersCount] = await Promise.all([
            prisma.customerGroup.findUnique({
                where: { id },
                include: {
                    users: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatar: true,
                            status: true,
                            createdAt: true,
                        },
                        skip,
                        take: parseInt(limit),
                        orderBy: { createdAt: 'desc' },
                    },
                    _count: { select: { users: true } },
                },
            }),
            prisma.user.count({ where: { groupId: id } }),
        ]);

        if (!group) {
            return res.status(404).json({ success: false, message: 'Customer group not found.' });
        }

        return res.status(200).json({
            success: true,
            data: group,
            pagination: {
                total: membersCount,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(membersCount / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('getCustomerGroup error:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching customer group.' });
    }
};

// ============================================================
// UPDATE a customer group
// ============================================================
const updateCustomerGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, discountType, discountValue, isActive } = req.body;

        const existing = await prisma.customerGroup.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Customer group not found.' });
        }

        const updated = await prisma.customerGroup.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(discountType !== undefined && { discountType }),
                ...(discountValue !== undefined && { discountValue: parseFloat(discountValue) }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'A group with this name already exists.' });
        }
        console.error('updateCustomerGroup error:', error);
        return res.status(500).json({ success: false, message: 'Server error updating customer group.' });
    }
};

// ============================================================
// DELETE a customer group (unassign users first)
// ============================================================
const deleteCustomerGroup = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.customerGroup.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Customer group not found.' });
        }

        // First, unlink all users from this group
        await prisma.user.updateMany({
            where: { groupId: id },
            data: { groupId: null },
        });

        await prisma.customerGroup.delete({ where: { id } });

        return res.status(200).json({ success: true, message: 'Customer group deleted successfully.' });
    } catch (error) {
        console.error('deleteCustomerGroup error:', error);
        return res.status(500).json({ success: false, message: 'Server error deleting customer group.' });
    }
};

// ============================================================
// ASSIGN users to a group
// ============================================================
const assignUsersToGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { userIds } = req.body; // array of user IDs

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Provide an array of userIds.' });
        }

        const group = await prisma.customerGroup.findUnique({ where: { id } });
        if (!group) {
            return res.status(404).json({ success: false, message: 'Customer group not found.' });
        }

        const result = await prisma.user.updateMany({
            where: { id: { in: userIds } },
            data: { groupId: id },
        });

        return res.status(200).json({
            success: true,
            message: `${result.count} user(s) assigned to "${group.name}".`,
        });
    } catch (error) {
        console.error('assignUsersToGroup error:', error);
        return res.status(500).json({ success: false, message: 'Server error assigning users.' });
    }
};

// ============================================================
// REMOVE a single user from a group
// ============================================================
const removeUserFromGroup = async (req, res) => {
    try {
        const { id, userId } = req.params;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.groupId !== id) {
            return res.status(404).json({ success: false, message: 'User not found in this group.' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { groupId: null },
        });

        return res.status(200).json({ success: true, message: 'User removed from group.' });
    } catch (error) {
        console.error('removeUserFromGroup error:', error);
        return res.status(500).json({ success: false, message: 'Server error removing user from group.' });
    }
};

module.exports = {
    createCustomerGroup,
    getAllCustomerGroups,
    getCustomerGroup,
    updateCustomerGroup,
    deleteCustomerGroup,
    assignUsersToGroup,
    removeUserFromGroup,
};
