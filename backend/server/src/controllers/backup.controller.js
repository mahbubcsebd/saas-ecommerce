const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');
const { successResponse, errorResponse } = require('../utils/response');

const prisma = new PrismaClient();

// Backup directory
const BACKUP_DIR = path.join(__dirname, '../../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Prisma model names that actually exist in the schema
const BACKUP_TABLES = [
  'user',
  'product',
  'productVariant',
  'category',
  'order',
  'orderItem',
  'cart',
  'cartItem',
  'discount',
  'review',
  'supplier',
  'purchase',
  'purchaseItem',
  'returnRequest',
  'invoice',
  'address',
  'wishlist',
  'stockMovement',
  'damageReport',
  'shippingZone',
  'shippingRate',
  'courier',
  'campaign',
  'notification',
  'conversation',
  'chatMessage',
  'heroSlide',
  'emailTemplate',
  'landingPage',
];

// ─── Create database backup ───
const createDatabaseBackup = async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `database-backup-${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      type: 'manual',
      data: {},
    };

    // Export data from each table
    for (const table of BACKUP_TABLES) {
      try {
        if (prisma[table]) {
          const data = await prisma[table].findMany({
            take: 10000, // Limit to prevent memory issues
          });
          backupData.data[table] = data;
        }
      } catch (error) {
        console.log(`Skipping table ${table}:`, error.message);
      }
    }

    // Write backup file
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

    const fileSize = fs.statSync(backupPath).size;

    // Save backup record
    await prisma.backup.create({
      data: {
        fileName: backupFileName,
        filePath: backupPath,
        type: 'database',
        size: fileSize,
        status: 'completed',
        createdBy: req.user?.id || null,
      },
    });

    return successResponse(res, {
      message: 'Database backup created successfully',
      data: {
        fileName: backupFileName,
        size: fileSize,
        tablesBackedUp: Object.keys(backupData.data).length,
        totalRecords: Object.values(backupData.data).reduce((sum, arr) => sum + arr.length, 0),
      },
    });
  } catch (error) {
    console.error('Database backup error:', error);
    return errorResponse(res, {
      statusCode: 500,
      message: 'Failed to create database backup',
    });
  }
};

// ─── Export specific data type ───
const exportData = async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;

    let data = [];
    let fileName = '';
    const dateStr = new Date().toISOString().split('T')[0];

    switch (type) {
      case 'products':
        data = await prisma.product.findMany({
          include: {
            category: true,
            variants: true,
          },
        });
        fileName = `products-export-${dateStr}`;
        break;

      case 'orders':
        data = await prisma.order.findMany({
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
              },
            },
          },
        });
        fileName = `orders-export-${dateStr}`;
        break;

      case 'customers':
        data = await prisma.user.findMany({
          where: { role: 'CUSTOMER' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            status: true,
            createdAt: true,
            orders: {
              select: {
                id: true,
                orderNumber: true,
                total: true,
                status: true,
                createdAt: true,
              },
            },
          },
        });
        fileName = `customers-export-${dateStr}`;
        break;

      case 'categories':
        data = await prisma.category.findMany({
          include: {
            children: true,
          },
        });
        fileName = `categories-export-${dateStr}`;
        break;

      case 'suppliers':
        data = await prisma.supplier.findMany({
          include: {
            purchases: {
              select: {
                id: true,
                purchaseNumber: true,
                total: true,
                status: true,
                createdAt: true,
              },
            },
          },
        });
        fileName = `suppliers-export-${dateStr}`;
        break;

      case 'inventory':
        data = await prisma.product.findMany({
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            stock: true,
            minStockLevel: true,
            costPrice: true,
            sellingPrice: true,
            trackInventory: true,
            variants: {
              select: {
                id: true,
                name: true,
                sku: true,
                stock: true,
                minStockLevel: true,
              },
            },
          },
        });
        fileName = `inventory-export-${dateStr}`;
        break;

      default:
        return errorResponse(res, {
          statusCode: 400,
          message: `Invalid export type: ${type}. Available types: products, orders, customers, categories, suppliers, inventory`,
        });
    }

    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);
      return res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.json"`);
      return res.json(data);
    }
  } catch (error) {
    console.error('Export data error:', error);
    return errorResponse(res, {
      statusCode: 500,
      message: 'Failed to export data',
    });
  }
};

// ─── Convert JSON to CSV ───
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';

  // Flatten nested objects for CSV
  const flattenObj = (obj, prefix = '') => {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}_${key}` : key;
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        Object.assign(result, flattenObj(value, newKey));
      } else if (Array.isArray(value)) {
        result[newKey] = JSON.stringify(value);
      } else {
        result[newKey] = value;
      }
    }
    return result;
  };

  const flatData = data.map((item) => flattenObj(item));
  const headers = [...new Set(flatData.flatMap((obj) => Object.keys(obj)))];
  const csvHeaders = headers.join(',');

  const csvRows = flatData.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return '""';
        const str = String(value).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
};

// ─── Get backup history ───
const getBackupHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where = type ? { type } : {};

    const [backups, total] = await Promise.all([
      prisma.backup.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.backup.count({ where }),
    ]);

    return successResponse(res, {
      message: 'Backup history retrieved',
      data: {
        backups: backups.map((b) => ({
          ...b,
          creator: b.creator
            ? {
                id: b.creator.id,
                name: `${b.creator.firstName} ${b.creator.lastName}`,
                email: b.creator.email,
              }
            : null,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get backup history error:', error);
    return errorResponse(res, {
      statusCode: 500,
      message: 'Failed to get backup history',
    });
  }
};

// ─── Download backup file ───
const downloadBackup = async (req, res) => {
  try {
    const { id } = req.params;

    const backup = await prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      return errorResponse(res, { statusCode: 404, message: 'Backup not found' });
    }

    if (!fs.existsSync(backup.filePath)) {
      return errorResponse(res, { statusCode: 404, message: 'Backup file not found on disk' });
    }

    res.download(backup.filePath, backup.fileName);
  } catch (error) {
    console.error('Download backup error:', error);
    return errorResponse(res, {
      statusCode: 500,
      message: 'Failed to download backup',
    });
  }
};

// ─── Delete backup ───
const deleteBackup = async (req, res) => {
  try {
    const { id } = req.params;

    const backup = await prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      return errorResponse(res, { statusCode: 404, message: 'Backup not found' });
    }

    // Delete file from disk
    if (fs.existsSync(backup.filePath)) {
      fs.unlinkSync(backup.filePath);
    }

    // Delete record from DB
    await prisma.backup.delete({
      where: { id },
    });

    return successResponse(res, { message: 'Backup deleted successfully' });
  } catch (error) {
    console.error('Delete backup error:', error);
    return errorResponse(res, {
      statusCode: 500,
      message: 'Failed to delete backup',
    });
  }
};

// ─── Restore from backup ───
const restoreFromBackup = async (req, res) => {
  try {
    const { id } = req.params;

    const backup = await prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      return errorResponse(res, { statusCode: 404, message: 'Backup not found' });
    }

    if (backup.type !== 'database' && backup.type !== 'scheduled') {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Only database/scheduled backups can be restored',
      });
    }

    if (!fs.existsSync(backup.filePath)) {
      return errorResponse(res, { statusCode: 404, message: 'Backup file not found on disk' });
    }

    // Read backup file
    const backupData = JSON.parse(fs.readFileSync(backup.filePath, 'utf8'));

    const restored = [];
    const failed = [];

    // Restore data table by table
    for (const [table, records] of Object.entries(backupData.data)) {
      if (prisma[table] && Array.isArray(records) && records.length > 0) {
        try {
          // Delete existing data
          await prisma[table].deleteMany({});

          // Insert records one by one to handle date conversions
          let insertedCount = 0;
          for (const record of records) {
            try {
              // Convert date strings back to Date objects
              const processed = {};
              for (const [key, value] of Object.entries(record)) {
                if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
                  processed[key] = new Date(value);
                } else {
                  processed[key] = value;
                }
              }
              await prisma[table].create({ data: processed });
              insertedCount++;
            } catch (err) {
              // Skip individual record errors
            }
          }
          restored.push({ table, records: insertedCount });
        } catch (error) {
          failed.push({ table, error: error.message });
        }
      }
    }

    // Create restore record
    await prisma.backup.create({
      data: {
        fileName: `restore-from-${backup.fileName}`,
        filePath: backup.filePath,
        type: 'restore',
        size: backup.size,
        status: 'completed',
        createdBy: req.user?.id || null,
        metadata: {
          restoredFrom: backup.id,
          restoredAt: new Date().toISOString(),
          tablesRestored: restored,
          tablesFailed: failed,
        },
      },
    });

    return successResponse(res, {
      message: 'Database restored successfully',
      data: { restored, failed },
    });
  } catch (error) {
    console.error('Restore backup error:', error);
    return errorResponse(res, {
      statusCode: 500,
      message: 'Failed to restore database',
    });
  }
};

// ─── Schedule automatic backup ───
let scheduledJobs = {};

const scheduleBackup = async (req, res) => {
  try {
    const { frequency, time, enabled } = req.body;

    if (!frequency || !time) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Frequency and time are required',
      });
    }

    // Find existing schedule or create
    const existing = await prisma.backupSchedule.findFirst();

    let schedule;
    if (existing) {
      schedule = await prisma.backupSchedule.update({
        where: { id: existing.id },
        data: { frequency, time, enabled: !!enabled },
      });
    } else {
      schedule = await prisma.backupSchedule.create({
        data: { frequency, time, enabled: !!enabled },
      });
    }

    // Setup cron job if enabled
    if (enabled) {
      setupScheduledBackup(frequency, time);
    } else {
      // Stop existing jobs
      Object.values(scheduledJobs).forEach((job) => job.stop());
      scheduledJobs = {};
    }

    return successResponse(res, {
      message: 'Backup schedule updated successfully',
      data: schedule,
    });
  } catch (error) {
    console.error('Schedule backup error:', error);
    return errorResponse(res, {
      statusCode: 500,
      message: 'Failed to schedule backup',
    });
  }
};

// ─── Setup cron job for scheduled backups ───
const setupScheduledBackup = (frequency, time) => {
  // Clear existing jobs
  Object.values(scheduledJobs).forEach((job) => job.stop());
  scheduledJobs = {};

  const [hours, minutes] = time.split(':');
  let cronExpression;

  switch (frequency) {
    case 'daily':
      cronExpression = `${minutes} ${hours} * * *`;
      break;
    case 'weekly':
      cronExpression = `${minutes} ${hours} * * 0`;
      break;
    case 'monthly':
      cronExpression = `${minutes} ${hours} 1 * *`;
      break;
    default:
      return;
  }

  const job = cron.schedule(
    cronExpression,
    async () => {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `auto-backup-${timestamp}.json`;
        const backupPath = path.join(BACKUP_DIR, backupFileName);

        const backupData = {
          timestamp: new Date().toISOString(),
          version: '1.0',
          type: 'scheduled',
          data: {},
        };

        for (const table of BACKUP_TABLES) {
          try {
            if (prisma[table]) {
              const data = await prisma[table].findMany({ take: 10000 });
              backupData.data[table] = data;
            }
          } catch (error) {
            console.log(`Auto-backup: skipping ${table}:`, error.message);
          }
        }

        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

        await prisma.backup.create({
          data: {
            fileName: backupFileName,
            filePath: backupPath,
            type: 'scheduled',
            size: fs.statSync(backupPath).size,
            status: 'completed',
            createdBy: null,
          },
        });

        console.log('Scheduled backup completed:', backupFileName);
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'Asia/Dhaka',
    }
  );

  scheduledJobs[frequency] = job;
};

// ─── Get backup settings ───
const getBackupSettings = async (req, res) => {
  try {
    const schedule = await prisma.backupSchedule.findFirst();

    return successResponse(res, {
      message: 'Backup settings retrieved',
      data: schedule || {
        frequency: 'daily',
        time: '02:00',
        enabled: false,
      },
    });
  } catch (error) {
    console.error('Get backup settings error:', error);
    return errorResponse(res, {
      statusCode: 500,
      message: 'Failed to get backup settings',
    });
  }
};

// ─── Initialize scheduled backup on server start ───
const initScheduledBackup = async () => {
  try {
    const schedule = await prisma.backupSchedule.findFirst();
    if (schedule && schedule.enabled) {
      setupScheduledBackup(schedule.frequency, schedule.time);
      console.log(`Auto-backup initialized: ${schedule.frequency} at ${schedule.time}`);
    }
  } catch (error) {
    console.log('No backup schedule found, skipping auto-backup init');
  }
};

// Initialize on module load
initScheduledBackup();

module.exports = {
  createDatabaseBackup,
  exportData,
  getBackupHistory,
  downloadBackup,
  deleteBackup,
  restoreFromBackup,
  scheduleBackup,
  getBackupSettings,
};
