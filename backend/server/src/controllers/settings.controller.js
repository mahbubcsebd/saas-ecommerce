const prisma = require('../config/prisma');
const emailService = require('../services/emailService');
const smsService = require('../services/sms.service');

// Get Public Settings (Aggregated)
exports.getPublicSettings = async (req, res, next) => {
  try {
    const [
      general,
      currency,
      contact,
      seo,
      appearance,
      order, // Needed for order rules like minAmount
      company
    ] = await Promise.all([
      prisma.generalSetting.findFirst(),
      prisma.currencySetting.findFirst(),
      prisma.contactSetting.findFirst(),
      prisma.seoSetting.findFirst(),
      prisma.appearanceSetting.findFirst(),
      prisma.orderSetting.findFirst(),
      prisma.companySetting.findFirst(),
    ]);

    // Note: Do NOT return Email or Payment settings publicly if they contain sensitive keys.
    const paymentRaw = await prisma.paymentSetting.findFirst();
    const payment = paymentRaw ? {
        codEnabled: paymentRaw.codEnabled,
        bkashEnabled: paymentRaw.bkashEnabled,
        nagadEnabled: paymentRaw.nagadEnabled,
        stripeEnabled: paymentRaw.stripeEnabled,
        sslcEnabled: paymentRaw.sslcEnabled,
        codExtraCharge: paymentRaw.codExtraCharge,
        codNote: paymentRaw.codNote
    } : null;

    res.status(200).json({
      success: true,
      data: {
        general,
        currency,
        contact,
        seo,
        appearance,
        payment,
        order: order ? {
            minOrderAmount: order.minOrderAmount,
            maxOrderAmount: order.maxOrderAmount,
            orderPrefix: order.orderPrefix,
            returnPolicyDays: order.returnPolicyDays
        } : null,
        company
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get settings by type (Admin - Full)
exports.getSettingsByType = async (req, res, next) => {
    try {
        const { type } = req.params;
        let data;

        switch (type) {
            case 'general': data = await prisma.generalSetting.findFirst(); break;
            case 'currency': data = await prisma.currencySetting.findFirst(); break;
            case 'contact': data = await prisma.contactSetting.findFirst(); break;
            case 'seo': data = await prisma.seoSetting.findFirst(); break;
            case 'email': data = await prisma.emailSetting.findFirst(); break;
            case 'appearance': data = await prisma.appearanceSetting.findFirst(); break;
            case 'payment': data = await prisma.paymentSetting.findFirst(); break;
            case 'order': data = await prisma.orderSetting.findFirst(); break;
            case 'company': data = await prisma.companySetting.findFirst(); break;
            case 'legal': data = await prisma.legalSetting.findFirst(); break;
            case 'tax': data = await prisma.taxSetting.findFirst(); break;
            case 'shipping': data = await prisma.shippingSetting.findFirst(); break;
            case 'sms': data = await prisma.smsSetting.findFirst(); break;
            case 'integrations': data = await prisma.integrationSetting.findFirst(); break;
            case 'webhooks': data = await prisma.webhook.findMany(); break;
            default: return res.status(400).json({ success: false, message: "Invalid setting type" });
        }

        res.status(200).json({
            success: true,
            data: data || {}
        });
    } catch (error) {
        next(error);
    }
};

// Update Settings (Admin - Generic)
exports.updateSettings = async (req, res, next) => {
    try {
        const { type } = req.params;
        const data = req.body;

        let updated;

        const updateSingleton = async (model) => {
            const existing = await model.findFirst();
            const { id, createdAt, updatedAt, ...updateData } = data;

            if (existing) {
                return await model.update({ where: { id: existing.id }, data: updateData });
            } else {
                return await model.create({ data: updateData });
            }
        };

        const updateCompany = async (model) => {
             const existing = await model.findFirst();
             const { id, createdAt, updatedAt, ...updateData } = data;

             if (existing) {
                 return await model.update({ where: { id: existing.id }, data: updateData });
             } else {
                 return await model.create({ data: updateData });
             }
        };

        switch (type) {
            case 'general': updated = await updateSingleton(prisma.generalSetting); break;
            case 'currency': updated = await updateSingleton(prisma.currencySetting); break;
            case 'contact': updated = await updateSingleton(prisma.contactSetting); break;
            case 'seo': updated = await updateSingleton(prisma.seoSetting); break;
            case 'email': updated = await updateSingleton(prisma.emailSetting); break;
            case 'appearance': updated = await updateSingleton(prisma.appearanceSetting); break;
            case 'payment': updated = await updateSingleton(prisma.paymentSetting); break;
            case 'order': updated = await updateSingleton(prisma.orderSetting); break;
            case 'company': updated = await updateCompany(prisma.companySetting); break;
            case 'legal': updated = await updateSingleton(prisma.legalSetting); break;
            case 'tax': updated = await updateSingleton(prisma.taxSetting); break;
            case 'shipping': updated = await updateSingleton(prisma.shippingSetting); break;
            case 'sms': updated = await updateSingleton(prisma.smsSetting); break;
            case 'integrations': updated = await updateSingleton(prisma.integrationSetting); break;
            default: return res.status(400).json({ success: false, message: "Invalid setting type" });
        }

        res.status(200).json({
            success: true,
            data: updated,
            message: `${type} settings updated successfully`
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Test Email Connection
 */
exports.testEmailConnection = async (req, res, next) => {
    try {
        const { settings, testEmail } = req.body;

        if (!settings || !settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
            return res.status(400).json({ success: false, message: "Missing SMTP configuration" });
        }

        // 1. Verify connection
        const verifyResult = await emailService.testSmtpConnection(settings);
        if (!verifyResult.success) {
            return res.status(400).json({ success: false, message: verifyResult.message });
        }

        // 2. Send test email if email provided
        if (testEmail) {
            await emailService.sendTestEmail(testEmail, settings);
        }

        res.status(200).json({
            success: true,
            message: testEmail ? "Connection verified and test email sent!" : "Connection verified successfully!"
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Test SMS Connection
 */
exports.testSmsConnection = async (req, res, next) => {
    try {
        const { settings, testNumber } = req.body;

        if (!settings || !settings.gateway) {
            return res.status(400).json({ success: false, message: "Missing SMS configuration" });
        }

        if (!testNumber) {
            return res.status(400).json({ success: false, message: "Test phone number is required" });
        }

        const result = await smsService.testSmsConnection(testNumber, settings);

        if (result.success) {
            res.status(200).json({
                success: true,
                message: "SMS sent successfully!"
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Webhook CRUD
 */
exports.createWebhook = async (req, res, next) => {
    try {
        const { name, url, secret, events, isActive } = req.body;
        const webhook = await prisma.webhook.create({
            data: { name, url, secret, events: events || [], isActive: isActive !== undefined ? isActive : true }
        });
        res.status(201).json({ success: true, data: webhook });
    } catch (error) {
        next(error);
    }
};

exports.updateWebhook = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updated = await prisma.webhook.update({
            where: { id },
            data
        });
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

exports.deleteWebhook = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.webhook.delete({ where: { id } });
        res.status(200).json({ success: true, message: "Webhook deleted successfully" });
    } catch (error) {
        next(error);
    }
};
