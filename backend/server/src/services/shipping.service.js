const prisma = require('../config/prisma');

class ShippingService {

    /**
     * Calculate shipping options
     * @param {object} input - { country: "BD", state: null, postalCode: null, cartTotal: 1000, cartWeight: 2.5 }
     */
    async calculateShipping(input) {

        // 1. Find applicable shipping zones (by priority)
        // We fetch active zones and check matches in memory or via query
        // Since array contains query is specific, doing a broad fetch and filter might be safer for complex conditions
        // but Prisma supports 'has' for array fields.

        const zones = await prisma.shippingZone.findMany({
            where: {
                isActive: true,
                OR: [
                    { countries: { has: input.country } },
                    // If state or city is provided, we can look for it.
                    // We treat 'regions' as a list that can contain state OR city names
                    input.state ? { regions: { has: input.state } } : undefined,
                    input.city ? { regions: { has: input.city } } : undefined
                ].filter(Boolean)
            },
            include: {
                rates: {
                    where: { isActive: true }
                }
            },
            orderBy: { priority: 'desc' }
        });

        // 2. Filter zones to find the best match
        // Priority 1: Zone explicitly lists the city/state in 'regions'
        // Priority 2: Zone has NO regions (catch-all for country) - but usually we rely on 'priority' field from DB for this.
        // The query above fetches all potentially matching zones.
        // We need to ensure that if "Dhaka" is in input, we pick "Inside Dhaka" (regions=['Dhaka']) over "Outside Dhaka" (regions=[])

        let validZones = [];

        for (const zone of zones) {
             // If zone has specific regions, Input MUST match one of them
             if (zone.regions && zone.regions.length > 0) {
                 const matchCity = input.city && zone.regions.includes(input.city);
                 const matchState = input.state && zone.regions.includes(input.state);
                 if (matchCity || matchState) {
                     validZones.push(zone);
                 }
             } else {
                 // Zone has no regions -> Applies to whole country (e.g. Outside Dhaka if configured as catch-all)
                 // matches because we filtered by country in query
                 validZones.push(zone);
             }
        }

        // 3. Get all applicable rates from matching zones
        const shippingOptions = [];
        const seenRateIds = new Set();

        for (const zone of validZones) {
            for (const rate of zone.rates) {
                if (seenRateIds.has(rate.id)) continue;

                // Check weight constraints
                if (rate.minWeight && input.cartWeight < rate.minWeight) continue;
                if (rate.maxWeight && input.cartWeight > rate.maxWeight) continue;

                // Check order value constraints
                if (rate.minOrderValue && input.cartTotal < rate.minOrderValue) continue;

                // Calculate cost
                const cost = this.calculateRateCost(rate, input);

                shippingOptions.push({
                    id: rate.id,
                    method: rate.method,
                    carrier: rate.carrier,
                    cost,
                    estimatedDays: rate.estimatedDays,
                    isFree: cost === 0,
                    zoneId: zone.id
                });

                seenRateIds.add(rate.id);
            }
        }

        if (shippingOptions.length === 0) {
            // Fallback: Check if there's a "Global" zone (empty countries/regions or named Global)
            // Or return generic error
            // For now, strict match.
        }

        // Sort by cost
        return shippingOptions.sort((a, b) => a.cost - b.cost);
    }

    calculateRateCost(rate, input) {
        let cost = 0;

        switch (rate.calculationType) {
            case 'FLAT':
                cost = rate.flatRate || 0;
                break;

            case 'WEIGHT_BASED':
                const baseRate = rate.baseRate || 0;
                const perKgRate = rate.perKgRate || 0;
                cost = baseRate + (input.cartWeight * perKgRate);
                break;

            case 'ORDER_VALUE':
                // Free shipping if threshold met
                if (rate.freeShippingThreshold &&
                    input.cartTotal >= rate.freeShippingThreshold) {
                    cost = 0;
                } else {
                    cost = rate.flatRate || 0;
                }
                break;

            default:
                cost = rate.flatRate || 0;
        }

        return Math.round(cost * 100) / 100;
    }
    /**
     * Get All Shipping Zones (Admin)
     */
    async getAllZones() {
        return await prisma.shippingZone.findMany({
            include: {
                rates: true
            },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
        });
    }

    /**
     * Get Zone By ID
     */
    async getZoneById(id) {
        return await prisma.shippingZone.findUnique({
            where: { id },
            include: { rates: true }
        });
    }

    /**
     * Create Shipping Zone
     */
    async createZone(data) {
        return await prisma.shippingZone.create({
            data: {
                name: data.name,
                countries: data.countries || [],
                regions: data.regions || [],
                isActive: data.isActive !== undefined ? data.isActive : true,
                priority: data.priority || 0
            }
        });
    }

    /**
     * Update Shipping Zone
     */
    async updateZone(id, data) {
        return await prisma.shippingZone.update({
            where: { id },
            data: {
                name: data.name,
                countries: data.countries,
                regions: data.regions,
                isActive: data.isActive,
                priority: data.priority
            }
        });
    }

    /**
     * Delete Shipping Zone
     */
    async deleteZone(id) {
        // Delete associated rates first (Prisma handle this if setup with Cascade, but manual for safety here if no cascade)
        await prisma.shippingRate.deleteMany({
            where: { zoneId: id }
        });
        return await prisma.shippingZone.delete({
            where: { id }
        });
    }

    /**
     * Create Shipping Rate
     */
    async createRate(zoneId, data) {
        return await prisma.shippingRate.create({
            data: {
                zoneId,
                method: data.method,
                carrier: data.carrier,
                calculationType: data.calculationType,
                flatRate: data.flatRate,
                baseRate: data.baseRate,
                perKgRate: data.perKgRate,
                freeShippingThreshold: data.freeShippingThreshold,
                minWeight: data.minWeight,
                maxWeight: data.maxWeight,
                minOrderValue: data.minOrderValue,
                estimatedDays: data.estimatedDays,
                courierId: data.courierId,
                isActive: data.isActive !== undefined ? data.isActive : true
            }
        });
    }

    /**
     * Update Shipping Rate
     */
    async updateRate(id, data) {
        return await prisma.shippingRate.update({
            where: { id },
            data: {
                method: data.method,
                carrier: data.carrier,
                calculationType: data.calculationType,
                flatRate: data.flatRate,
                baseRate: data.baseRate,
                perKgRate: data.perKgRate,
                freeShippingThreshold: data.freeShippingThreshold,
                minWeight: data.minWeight,
                maxWeight: data.maxWeight,
                minOrderValue: data.minOrderValue,
                estimatedDays: data.estimatedDays,
                courierId: data.courierId,
                isActive: data.isActive
            }
        });
    }

    /**
     * Delete Shipping Rate
     */
    async deleteRate(id) {
        return await prisma.shippingRate.delete({
            where: { id }
        });
    }
}

module.exports = new ShippingService();
