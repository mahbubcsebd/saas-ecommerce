const express = require('express');

const routes = express.Router();

// Import all route files
const authRouter = require('./auth.routes');
const userRouter = require('./user.routes');
const meRouter = require('./me.routes');

// Use routes
routes.use('/auth', authRouter);
routes.use('/user', userRouter);
routes.use('/me', meRouter);
const productRouter = require('./product.routes');
routes.use('/products', productRouter);

const addressRouter = require('./address.routes');
routes.use('/addresses', addressRouter);

const cartRouter = require('./cart.routes');
routes.use('/cart', cartRouter);

const orderRouter = require('./order.routes');
routes.use('/orders', orderRouter);

const heroRouter = require('./hero.routes');
routes.use('/hero-slides', heroRouter);

const categoryRouter = require('./category.routes');
routes.use('/categories', categoryRouter);

const reviewRouter = require('./review.routes');
routes.use('/reviews', reviewRouter);

const uploadRouter = require('./upload.routes');
routes.use('/upload', uploadRouter);

const wishlistRouter = require('./wishlist.routes');
routes.use('/wishlist', wishlistRouter);

const discountRouter = require('./discount.routes');
routes.use('/discounts', discountRouter);

const homeRouter = require('./home.routes');
routes.use('/home', homeRouter);

const homeCategoryProductRouter = require('./homeCategoryProduct.routes');
routes.use('/homeCategoryWiseProduct', homeCategoryProductRouter);

const invoiceRouter = require('./invoice.routes');
routes.use('/invoices', invoiceRouter);

const couponRouter = require('./coupon.routes');
routes.use('/coupons', couponRouter);

const shippingRouter = require('./shipping.routes');
routes.use('/shipping', shippingRouter);

const courierRouter = require('./courier.routes');
routes.use('/couriers', courierRouter);

const staffRouter = require('./staff.routes');
routes.use('/staff', staffRouter);

const roleRouter = require('./role.routes');
routes.use('/roles', roleRouter);

const supplierRouter = require('./supplier.routes');
routes.use('/suppliers', supplierRouter);

const supplierPaymentRouter = require('./supplierPayment.routes');
routes.use('/supplier-payments', supplierPaymentRouter);

const purchaseRouter = require('./purchase.routes');
routes.use('/purchases', purchaseRouter);

const purchaseReturnRouter = require('./purchaseReturn.routes');
routes.use('/purchase-returns', purchaseReturnRouter);

const settingsRouter = require('./settings.routes');
routes.use('/settings', settingsRouter);

const translationRouter = require('./translation.routes');
routes.use('/translations', translationRouter);

const adminUserRouter = require('./admin/user.routes');
routes.use('/admin/users', adminUserRouter);

const aiRouter = require('./ai/gemini.routes');
routes.use('/ai', aiRouter);

const languageRouter = require('./language.routes');
routes.use('/languages', languageRouter);

const inventoryRouter = require('./inventory.routes');
const damageRouter = require('./damage.routes');
routes.use('/inventory', inventoryRouter);
routes.use('/inventory/damage', damageRouter);

const landingPageRouter = require('./landing-page.routes');
routes.use('/landing-pages', landingPageRouter);

const notificationRouter = require('./notification.routes');
routes.use('/notifications', notificationRouter);

const chatRouter = require('./chat.routes');
routes.use('/chat', chatRouter);

const analyticsRouter = require('./analytics.routes');
routes.use('/analytics', analyticsRouter);

const returnRouter = require('./return.routes');
routes.use('/returns', returnRouter);

const customerGroupRouter = require('./customer-group.routes');
routes.use('/customer-groups', customerGroupRouter);

const campaignRouter = require('./campaign.routes');
routes.use('/campaigns', campaignRouter);

const flashSaleRouter = require('./flash-sale.routes');
routes.use('/flash-sales', flashSaleRouter);

const emailTemplateRouter = require('./emailTemplate.routes');
routes.use('/email-templates', emailTemplateRouter);

const abandonedCartRouter = require('./abandonedCart.routes');
routes.use('/abandoned-carts', abandonedCartRouter);

const taxRouter = require('./tax.routes');
routes.use('/tax-configurations', taxRouter);

const backupRouter = require('./backup.routes');
routes.use('/backup', backupRouter);

module.exports = routes;
