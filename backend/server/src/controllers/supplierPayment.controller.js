const prisma = require('../config/prisma');
const { errorResponse } = require('../helpers/responseHandler');

/**
 * Record Supplier Payment
 */
exports.createPayment = async (req, res, next) => {
  try {
    const { supplierId, amount, paymentMethod, reference, notes, paymentDate } = req.body;

    const paymentNumber = `SP-${Date.now()}`;

    const payment = await prisma.$transaction(async (tx) => {
      // 1. Create Payment Record
      const newPayment = await tx.supplierPayment.create({
        data: {
          paymentNumber,
          supplierId,
          amount,
          paymentMethod,
          reference,
          notes,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        },
      });

      // 2. Update Supplier Balance
      const supplier = await tx.supplier.findUnique({ where: { id: supplierId } });
      const previousBalance = supplier.dueBalance || 0;
      const newBalance = previousBalance - amount;

      await tx.supplier.update({
        where: { id: supplierId },
        data: { dueBalance: newBalance },
      });

      // 3. Create Transaction Record
      await tx.supplierTransaction.create({
        data: {
          supplierId,
          type: 'PAYMENT',
          amount: -amount, // Negative for payment
          balanceAfter: newBalance,
          referenceId: newPayment.id,
          paymentId: newPayment.id,
          notes: `Payment ${paymentNumber}${notes ? ' - ' + notes : ''}`,
        },
      });

      return newPayment;
    });

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment recorded successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Supplier Ledger (Transaction History)
 */
exports.getSupplierLedger = async (req, res, next) => {
  try {
    const { supplierId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await prisma.supplierTransaction.findMany({
      where: { supplierId },
      include: {
        purchase: { select: { purchaseNumber: true } },
        purchaseReturn: { select: { returnNumber: true } },
        payment: { select: { paymentNumber: true, paymentMethod: true, reference: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.supplierTransaction.count({ where: { supplierId } });

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};
