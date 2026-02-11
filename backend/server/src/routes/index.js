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

const supplierRouter = require('./supplier.routes');
routes.use('/suppliers', supplierRouter);

const purchaseRouter = require('./purchase.routes');
routes.use('/purchases', purchaseRouter);

const settingsRouter = require('./settings.routes');
routes.use('/settings', settingsRouter);

const translationRouter = require('./translation.routes');
routes.use('/translations', translationRouter);

module.exports = routes;
