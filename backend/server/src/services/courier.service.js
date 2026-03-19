const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CourierService {
  /**
   * Get all couriers with basic rates count
   */
  async getAllCouriers() {
    return await prisma.courier.findMany({
      include: {
        _count: {
          select: { shippingRates: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get courier by ID with full rates details
   */
  async getCourierById(id) {
    return await prisma.courier.findUnique({
      where: { id },
      include: {
        shippingRates: {
          include: {
            zone: {
              select: { name: true },
            },
          },
        },
      },
    });
  }

  /**
   * Create courier
   */
  async createCourier(data) {
    return await prisma.courier.create({
      data: {
        name: data.name,
        code: data.code.toLowerCase(),
        description: data.description,
        logo: data.logo,
        website: data.website,
        apiConfig: data.apiConfig || {},
        trackingUrl: data.trackingUrl,
        trackingType: data.trackingType || 'POLLING',
        supportedCountries: data.supportedCountries || [],
        supportedRegions: data.supportedRegions || [],
        serviceLevels: data.serviceLevels || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  /**
   * Update courier
   */
  async updateCourier(id, data) {
    const payload = { ...data };
    if (payload.code) payload.code = payload.code.toLowerCase();

    return await prisma.courier.update({
      where: { id },
      data: payload,
    });
  }

  /**
   * Delete courier
   */
  async deleteCourier(id) {
    // Check for dependencies in ShippingRates
    const dependencyCount = await prisma.shippingRate.count({
      where: { courierId: id },
    });

    if (dependencyCount > 0) {
      throw new Error(
        'Cannot delete courier with active shipping rates. Reassign or delete rates first.'
      );
    }

    return await prisma.courier.delete({
      where: { id },
    });
  }
}

module.exports = new CourierService();
