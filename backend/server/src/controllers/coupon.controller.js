const couponService = require('../services/coupon.service');

exports.validateCoupon = async (req, res, next) => {
    try {
        const { code, cart, country } = req.body;
        const userId = req.user ? req.user.id : null; // Assumes auth middleware populates req.user

        if (!code) {
            return res.status(400).json({ success: false, message: 'Coupon code is required' });
        }

        const result = await couponService.validateAndApply(code, userId, {
            ...cart,
            country
        });

        if (!result.valid) {
            return res.status(400).json({ success: false, message: result.error });
        }

        res.json({
            success: true,
            discount: result.discountAmount,
            coupon: {
                code: result.coupon.code,
                name: result.coupon.name,
                type: result.coupon.type,
                value: result.coupon.value
            }
        });

    } catch (error) {
        next(error);
    }
};
