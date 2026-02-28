const prisma = require('../config/prisma');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class AnalyticsService {

    /**
     * Track event (stores in DB + sends to GA4 + Meta)
     */
    async trackEvent(eventData) {
        try {
            const {
                eventName,
                userId,
                sessionId,
                clientId,
                eventType,
                pageUrl,
                pageTitle,
                referrer,
                userAgent,
                ipAddress,
                utmParams = {},
                eventData: customData,
                revenue,
                productId,
                productName,
                productPrice,
                quantity,
            } = eventData;

            // Parse user agent
            const deviceInfo = this.parseUserAgent(userAgent);

            // Get location from IP
            const location = await this.getLocationFromIP(ipAddress);

            // 1. Store in our database
            const analyticsEvent = await prisma.analyticsEvent.create({
                data: {
                    eventName,
                    eventType: eventType || 'CUSTOM',
                    userId,
                    sessionId: sessionId || uuidv4(),
                    clientId: clientId || 'unknown',
                    pageUrl,
                    pageTitle,
                    referrer,
                    utmSource: utmParams.source,
                    utmMedium: utmParams.medium,
                    utmCampaign: utmParams.campaign,
                    utmTerm: utmParams.term,
                    utmContent: utmParams.content,
                    userAgent,
                    ipAddress,
                    country: location.country,
                    city: location.city,
                    device: deviceInfo.device,
                    browser: deviceInfo.browser,
                    os: deviceInfo.os,
                    eventData: customData,
                    revenue: parseFloat(revenue) || undefined,
                    productId,
                    productName,
                    productPrice: parseFloat(productPrice) || undefined,
                    quantity: parseInt(quantity) || undefined,
                },
            });

            // 2. Send to GA4
            await this.sendToGA4(eventData, deviceInfo, location);

            // 3. Send to Meta Pixel
            if (this.isEcommerceEvent(eventName)) {
                await this.sendToMetaPixel(eventData, deviceInfo, location);
            }

            // 4. Update session
            if (sessionId) {
                 await this.updateSession(sessionId, userId, eventData, location, deviceInfo);
            }

            return analyticsEvent;

        } catch (error) {
            console.error('Analytics tracking error:', error);
        }
    }

    /**
     * Track Purchase (High-level helper for Order Controller)
     */
    async trackPurchase(order, req) {
        try {
            const userAgent = req.headers['user-agent'];
            const ipAddress = req.ip || req.connection.remoteAddress;

            const eventData = {
                eventName: 'purchase',
                eventType: 'ECOMMERCE',
                userId: order.userId,
                sessionId: order.sessionId || uuidv4(),
                clientId: order.id,
                revenue: order.total,
                userAgent,
                ipAddress,
                pageUrl: req.headers.referer,
                eventData: {
                    transaction_id: order.orderNumber,
                    shipping: order.shippingCost,
                    tax: order.vatAmount,
                    items: order.items.map(item => ({
                        id: item.productId,
                        name: item.productName,
                        price: item.unitPrice,
                        quantity: item.quantity,
                        variant: item.variantId
                    }))
                }
            };

            return await this.trackEvent(eventData);
        } catch (error) {
            console.error('Track purchase error:', error);
        }
    }

    /**
     * Send to Google Analytics 4 (Measurement Protocol)
     */
    async sendToGA4(eventData, deviceInfo, location) {
        try {
            const {
                eventName,
                clientId,
                sessionId,
                userId,
                pageUrl,
                pageTitle,
                referrer,
                revenue,
                productId,
                productName,
                productPrice,
                quantity,
                eventData: customData,
            } = eventData;

            const integration = await prisma.integrationSetting.findFirst();
            if (!integration || !integration.googleAnalyticsId || integration.googleAnalyticsId.length === 0) return;

            const config = integration.thirdPartyConfig || {};
            const apiSecret = config.ga4ApiSecret;

            if (!apiSecret) return;

            const payload = {
                client_id: clientId || 'unknown',
                user_id: userId,
                events: [{
                    name: eventName,
                    params: {
                        session_id: sessionId,
                        page_location: pageUrl,
                        page_title: pageTitle,
                        page_referrer: referrer,

                        // Device info
                        device_category: deviceInfo.device,
                        browser: deviceInfo.browser,
                        operating_system: deviceInfo.os,

                        // Location
                        country: location.country,
                        city: location.city,

                        // E-commerce params
                        ...(revenue && {
                            currency: 'BDT',
                            value: revenue,
                        }),

                        ...(productId && {
                            items: [{
                                item_id: productId,
                                item_name: productName,
                                price: productPrice,
                                quantity: quantity || 1,
                            }],
                        }),

                        // Custom params
                        ...customData,
                    },
                }],
            };

            for (const measurementId of integration.googleAnalyticsId) {
                await axios.post(
                    `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
                    payload,
                    {
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            }
        } catch (error) {
            console.error('GA4 send error:', error.message);
        }
    }

    /**
     * Send to Meta Pixel (Conversions API)
     */
    async sendToMetaPixel(eventData, deviceInfo, location) {
        try {
            const {
                eventName,
                userId,
                userAgent,
                ipAddress,
                revenue,
                productId,
                productName,
                productPrice,
                quantity,
            } = eventData;

            const integration = await prisma.integrationSetting.findFirst();
            if (!integration || !integration.facebookPixelId || integration.facebookPixelId.length === 0) return;

            const config = integration.thirdPartyConfig || {};
            const accessToken = config.facebookAccessToken;

            if (!accessToken) return;

            // Map event names to Meta standard events
            const metaEventName = this.mapToMetaEvent(eventName);

            const eventId = uuidv4(); // For deduplication

            const payload = {
                data: [{
                    event_name: metaEventName,
                    event_time: Math.floor(Date.now() / 1000),
                    event_id: eventId,
                    event_source_url: eventData.pageUrl,
                    action_source: 'website',

                    user_data: {
                        client_ip_address: ipAddress,
                        client_user_agent: userAgent,
                        ...(userId && { external_id: userId }),
                        ...(location.country && { country: location.country.toLowerCase() }),
                        ...(location.city && { city: location.city.toLowerCase() }),
                    },

                    custom_data: {
                        currency: 'BDT',
                        ...(revenue && { value: revenue }),
                        ...(productId && {
                            content_ids: [productId],
                            content_name: productName,
                            content_type: 'product',
                            contents: [{
                                id: productId,
                                quantity: quantity || 1,
                                item_price: productPrice,
                            }],
                        }),
                    },
                }],
            };

            for (const pixelId of integration.facebookPixelId) {
                await axios.post(
                    `https://graph.facebook.com/v18.0/${pixelId}/events`,
                    payload,
                    {
                        params: { access_token: accessToken },
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            }

            // Store in DB for tracking
            await prisma.pixelEvent.create({
                data: {
                    pixel: 'META',
                    eventName: metaEventName,
                    eventId,
                    userId,
                    eventData: payload,
                    sentToPixel: true,
                },
            });
        } catch (error) {
            console.error('Meta Pixel send error:', error.message);
        }
    }

    /**
     * Update or create session
     */
    async updateSession(sessionId, userId, eventData, location, deviceInfo) {
        try {
            const existingSession = await prisma.analyticsSession.findUnique({
                where: { sessionId },
            });

            if (existingSession) {
                // Update existing session
                await prisma.analyticsSession.update({
                    where: { sessionId },
                    data: {
                        endTime: new Date(),
                        pageViews: { increment: eventData.eventName === 'page_view' ? 1 : 0 },
                        events: { increment: 1 },
                        ...(eventData.revenue && {
                            converted: true,
                            revenue: { increment: parseFloat(eventData.revenue) },
                        }),
                        ...(userId && !existingSession.userId && { userId }), // Associate user if verified
                    },
                });
            } else {
                // Create new session
                await prisma.analyticsSession.create({
                    data: {
                        sessionId,
                        userId,
                        clientId: eventData.clientId || 'unknown',
                        startTime: new Date(),
                        pageViews: eventData.eventName === 'page_view' ? 1 : 0,
                        events: 1,
                        source: eventData.utmParams?.source,
                        medium: eventData.utmParams?.medium,
                        campaign: eventData.utmParams?.campaign,
                        device: deviceInfo.device,
                        browser: deviceInfo.browser,
                        os: deviceInfo.os,
                        country: location.country,
                    },
                });
            }
        } catch (error) {
            console.error('Update session error:', error);
        }
    }

    /**
     * Helper: Parse user agent
     */
    parseUserAgent(userAgent) {
        const ua = userAgent?.toLowerCase() || '';

        let device = 'desktop';
        if (/mobile|android|iphone|ipad|tablet/.test(ua)) {
            device = /tablet|ipad/.test(ua) ? 'tablet' : 'mobile';
        }

        let browser = 'unknown';
        if (ua.includes('chrome')) browser = 'chrome';
        else if (ua.includes('firefox')) browser = 'firefox';
        else if (ua.includes('safari')) browser = 'safari';
        else if (ua.includes('edge')) browser = 'edge';

        let os = 'unknown';
        if (ua.includes('windows')) os = 'windows';
        else if (ua.includes('mac')) os = 'macos';
        else if (ua.includes('linux')) os = 'linux';
        else if (ua.includes('android')) os = 'android';
        else if (ua.includes('ios') || ua.includes('iphone')) os = 'ios';

        return { device, browser, os };
    }

    /**
     * Helper: Get location from IP
     */
    async getLocationFromIP(ipAddress) {
        try {
            // Use ipapi.co (free tier: 1000 requests/day)
            // Ideally should hide behind a key or use a local DB in production
            if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1') return { country: 'Local', city: 'Host' };

            const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`);
            return {
                country: response.data.country_name,
                city: response.data.city,
            };
        } catch (error) {
            return { country: 'Unknown', city: 'Unknown' };
        }
    }

    /**
     * Helper: Check if e-commerce event
     */
    isEcommerceEvent(eventName) {
        const ecommerceEvents = [
            'view_item',
            'add_to_cart',
            'remove_from_cart',
            'begin_checkout',
            'purchase',
            'add_payment_info',
            'add_shipping_info',
        ];
        return ecommerceEvents.includes(eventName);
    }

    /**
     * Helper: Map to Meta standard events
     */
    mapToMetaEvent(eventName) {
        const mapping = {
            'page_view': 'PageView',
            'view_item': 'ViewContent',
            'add_to_cart': 'AddToCart',
            'begin_checkout': 'InitiateCheckout',
            'purchase': 'Purchase',
            'add_payment_info': 'AddPaymentInfo',
            'search': 'Search',
            'lead': 'Lead',
        };
        return mapping[eventName] || 'CustomEvent';
    }

    /**
     * Generate daily summary (run via cron)
     */
    async generateDailySummary(date = new Date()) {
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const [sessions, pageViews, transactions] = await Promise.all([
            prisma.analyticsSession.findMany({
                where: {
                    startTime: { gte: startOfDay, lte: endOfDay },
                },
            }),
            prisma.analyticsEvent.count({
                where: {
                    eventName: 'page_view',
                    timestamp: { gte: startOfDay, lte: endOfDay },
                },
            }),
            prisma.analyticsEvent.findMany({
                where: {
                    eventName: 'purchase',
                    timestamp: { gte: startOfDay, lte: endOfDay },
                },
            }),
        ]);

        const totalUsers = new Set(sessions.map(s => s.userId).filter(Boolean)).size;
        const totalSessions = sessions.length;
        const totalRevenue = transactions.reduce((sum, t) => sum + (t.revenue || 0), 0);
        const avgOrderValue = transactions.length > 0 ? totalRevenue / transactions.length : 0;
        const conversionRate = totalSessions > 0 ? (transactions.length / totalSessions) * 100 : 0;

        await prisma.analyticsDailySummary.create({
            data: {
                date: startOfDay,
                totalUsers,
                totalSessions,
                totalPageViews: pageViews,
                avgSessionDuration: 0, // Calculate separately
                bounceRate: 0, // Calculate separately
                transactions: transactions.length,
                revenue: totalRevenue,
                avgOrderValue,
                conversionRate,
                topSources: [],
                topPages: [],
                topProducts: [],
            },
        });
    }
}

module.exports = new AnalyticsService();
