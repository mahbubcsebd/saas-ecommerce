const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get Public Settings (Aggregated)
exports.getPublicSettings = async (req, res, next) => {
  try {
    const [
      general,
      currency,
      contact,
      seo,
      appearance,
      order // Needed for order rules like minAmount
    ] = await Promise.all([
      prisma.generalSetting.findFirst(),
      prisma.currencySetting.findFirst(),
      prisma.contactSetting.findFirst(),
      prisma.seoSetting.findFirst(),
      prisma.appearanceSetting.findFirst(),
      prisma.orderSetting.findFirst(),
    ]);

    // Note: Do NOT return Email or Payment settings publicly if they contain sensitive keys.
    // However, payment methods (enabled/disabled) are needed for checkout.
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
        } : null
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update Settings (Admin - Generic)
exports.updateSettings = async (req, res, next) => {
    try {
        const { type } = req.params; // general, currency, etc.
        const data = req.body;

        let updated;
        // Helper to update singleton.
        // We findFirst then update using structure.
        // Ideally we should have a singleton ID approach, but findFirst works for 1 record.

        const updateSingleton = async (model) => {
            const existing = await model.findFirst();
            if (existing) {
                return await model.update({ where: { id: existing.id }, data });
            } else {
                return await model.create({ data });
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
}
