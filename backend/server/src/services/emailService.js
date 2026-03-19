const nodemailer = require('nodemailer');
require('dotenv').config();

const prisma = require('../config/prisma');

/**
 * Creates a transporter based on DB settings or Environment Variables
 */
const getTransporter = async () => {
  const settings = await prisma.emailSetting.findFirst();

  if (settings && settings.smtpHost && settings.smtpUser && settings.smtpPass) {
    return nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpSecure,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
    });
  }

  // Fallback to Environment Variables
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER_NAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * Get Sender Info (From Name/Email) from DB or Environment
 */
const getSenderInfo = async (settings) => {
  const dbSettings = settings || (await prisma.emailSetting.findFirst());
  const company = await prisma.companySetting.findFirst();

  const fromName =
    dbSettings?.fromName || process.env.COMPANY_NAME || company?.name || 'Mahbub Shop';
  const fromEmail = dbSettings?.fromEmail || process.env.SMTP_FROM || process.env.SMTP_USER_NAME;

  return `"${fromName}" <${fromEmail}>`;
};

/**
 * Send invitation email
 */
exports.sendInvitationEmail = async ({ to, name, invitationLink, expiryDays }) => {
  const transporter = await getTransporter();
  const mailOptions = {
    from: await getSenderInfo(),
    to,
    subject: 'Welcome! Set up your account',
    html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
                    .button {
                        display: inline-block;
                        padding: 12px 30px;
                        background: #2563eb;
                        color: white !important;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                        font-weight: bold;
                    }
                    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to ${process.env.COMPANY_NAME || 'Our Shop'}!</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${name},</p>
                        <p>An account has been created for you. To complete your registration and set your password, please click the button below:</p>
                        <div style="text-align: center;">
                            <a href="${invitationLink}" class="button">Set Up Your Password</a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #666; font-size: 14px;">${invitationLink}</p>
                        <p>This link will expire in ${expiryDays} days.</p>
                        <p>If you didn't expect this email, please ignore it.</p>
                        <p>Best regards,<br>The ${process.env.COMPANY_NAME || 'Mahbub Shop'} Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Invitation email sent to:', to);
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

/**
 * Send welcome email (after self-registration)
 */
exports.sendWelcomeEmail = async ({ to, name }) => {
  const transporter = await getTransporter();
  const mailOptions = {
    from: await getSenderInfo(),
    to,
    subject: 'Welcome to our store!',
    html: `
            <!DOCTYPE html>
            <html>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial;">
                    <h2>Welcome ${name}!</h2>
                    <p>Thank you for registering with ${process.env.COMPANY_NAME || 'Mahbub Shop'}.</p>
                    <p>Your account has been successfully created.</p>
                    <p>Happy shopping!</p>
                </div>
            </body>
            </html>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Welcome email sending error:', error);
    // Don't throw for welcome email
  }
};
/**
 * Send email verification email
 */
exports.sendVerificationEmail = async ({ to, name, verificationLink }) => {
  const mailOptions = {
    from: `"${process.env.COMPANY_NAME || 'Mahbub Shop'}" <${process.env.SMTP_USER_NAME}>`,
    to,
    subject: 'Verify your email address',
    html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
                    .button {
                        display: inline-block;
                        padding: 12px 30px;
                        background: #2563eb;
                        color: white !important;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                        font-weight: bold;
                    }
                    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to ${process.env.COMPANY_NAME || 'Mahbub Shop'}!</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${name},</p>
                        <p>Thank you for registering. Please verify your email address to activate your account:</p>
                        <div style="text-align: center;">
                            <a href="${verificationLink}" class="button">Verify Email</a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #666; font-size: 14px;">${verificationLink}</p>
                        <p>If you didn't create an account, please ignore this email.</p>
                        <p>Best regards,<br>The ${process.env.COMPANY_NAME || 'Mahbub Shop'} Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent to:', to);
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
exports.sendPasswordResetEmail = async ({ to, name, resetLink }) => {
  const mailOptions = {
    from: `"${process.env.COMPANY_NAME || 'Mahbub Shop'}" <${process.env.SMTP_USER_NAME}>`,
    to,
    subject: 'Reset your password',
    html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
                    .button {
                        display: inline-block;
                        padding: 12px 30px;
                        background: #2563eb;
                        color: white !important;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                        font-weight: bold;
                    }
                    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${name},</p>
                        <p>We received a request to reset your password. Click the button below to set a new password.</p>
                        <div style="text-align: center;">
                            <a href="${resetLink}" class="button">Reset Password</a>
                        </div>
                        <p>Or copy this link into your browser:</p>
                        <p style="word-break: break-all; color: #666; font-size: 14px;">${resetLink}</p>
                        <p>This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
                        <p>Best regards,<br>The ${process.env.COMPANY_NAME || 'Mahbub Shop'} Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', to);
  } catch (error) {
    console.error('Password reset email error:', error);
    throw error;
  }
};

/**
 * Send order confirmation email with invoice and order number
 */
const jwt = require('jsonwebtoken');

exports.sendOrderConfirmationEmail = async ({ to, name, order }) => {
  // Generate a temporary token for the download link (valid for 7 days)
  const token = jwt.sign(
    { userId: order.userId, role: order.user?.role || 'CUSTOMER' },
    process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_KEY || 'FHDJKFHDJKSHFJKFHJKDSHF',
    { expiresIn: '7d' }
  );

  const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/invoices/${order.id}/download?token=${token}`;

  const itemsHtml = order.items
    .map((it) => {
      const title = it.product?.name || 'Item';
      const variant = it.variant?.name ? `(${it.variant.name})` : '';
      const qty = it.quantity || 1;
      const price = it.salePrice ?? it.unitPrice ?? 0;
      const total = price * qty;
      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 8px; font-size: 12px; color: #333;">
                <div style="font-weight: bold;">${title}</div>
                <div style="font-size: 11px; color: #666;">${variant}</div>
            </td>
            <td style="padding: 12px 8px; text-align: center; font-size: 12px; color: #333;">${qty}</td>
            <td style="padding: 12px 8px; text-align: right; font-size: 12px; color: #333;">${price.toFixed(2)}</td>
            <td style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 12px; color: #333;">${total.toFixed(2)}</td>
        </tr>`;
    })
    .join('');

  const shippingAddress = order.shippingAddress || {};
  const shippingAddressString = `
    ${shippingAddress.addressLine1 || shippingAddress.address || ''}<br>
    ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}<br>
    ${shippingAddress.country || 'Bangladesh'}<br>
    ${shippingAddress.phone || ''}
  `;

  const transporter = await getTransporter();
  const mailOptions = {
    from: await getSenderInfo(),
    to,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: Helvetica, Arial, sans-serif; color:#000000; margin:0; padding:0; background-color:#f9fafb;">
                <div style="max-width:800px; margin:20px auto; background:#ffffff; padding:40px; border-radius:8px; border:1px solid #e5e7eb;">

                    <!-- Header -->
                    <div style="display:flex; justify-content:space-between; margin-bottom:30px; flex-wrap:wrap;">
                        <div style="margin-bottom:20px;">
                            <h1 style="margin:0 0 10px 0; font-size:24px; font-weight:bold; color:#000;">${process.env.COMPANY_NAME || 'Mahbub Shop'}</h1>
                            <p style="margin:2px 0; font-size:12px; color:#555;">123 eCommerce St, Dhaka, Bangladesh</p>
                            <p style="margin:2px 0; font-size:12px; color:#555;">Phone: +880 1234 567890</p>
                            <p style="margin:2px 0; font-size:12px; color:#555;">Email: support@mahbubshop.com</p>
                        </div>
                        <div style="text-align:right; min-width:200px;">
                            <h2 style="margin:0 0 10px 0; font-size:28px; font-weight:bold; color:#e5e7eb;">INVOICE</h2>
                            <p style="margin:2px 0; font-size:14px;"><strong>#${order.invoiceNumber || order.orderNumber}</strong></p>
                            <p style="margin:2px 0; font-size:12px; color:#555;">Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
                            <p style="margin:2px 0; font-size:12px; color:#555;">Status: <span style="text-transform:uppercase;">${order.paymentStatus}</span></p>
                        </div>
                    </div>

                    <hr style="border:0; border-top:1px solid #000; margin:20px 0;">

                    <!-- Addresses -->
                    <table style="width:100%; border-collapse:collapse; margin-bottom:40px;">
                        <tr>
                            <td style="width:50%; vertical-align:top; padding-right:20px;">
                                <h3 style="font-size:11px; font-weight:bold; color:#555; margin-bottom:10px; text-transform:uppercase;">Bill To</h3>
                                <p style="margin:0; font-size:14px; font-weight:bold;">${name}</p>
                                <p style="margin:5px 0 0 0; font-size:12px; color:#333;">${to}</p>
                                <p style="margin:2px 0 0 0; font-size:12px; color:#333;">${order.user?.phone || order.walkInPhone || ''}</p>
                            </td>
                            <td style="width:50%; vertical-align:top; padding-left:20px; text-align:right;">
                                <h3 style="font-size:11px; font-weight:bold; color:#555; margin-bottom:10px; text-transform:uppercase;">Ship To</h3>
                                <p style="margin:0; font-size:14px; font-weight:bold;">${order.shippingAddress?.name || name}</p>
                                <p style="margin:5px 0 0 0; font-size:12px; color:#333; line-height:1.5;">${shippingAddressString}</p>
                            </td>
                        </tr>
                    </table>

                    <!-- Items -->
                    <table style="width:100%; border-collapse:collapse; margin-bottom:30px;">
                        <thead style="background-color:#f3f4f6;">
                            <tr>
                                <th style="padding:12px 8px; text-align:left; font-size:11px; font-weight:bold; color:#555; border-bottom:1px solid #e5e7eb;">ITEM DESCRIPTION</th>
                                <th style="padding:12px 8px; text-align:center; font-size:11px; font-weight:bold; color:#555; border-bottom:1px solid #e5e7eb;">QTY</th>
                                <th style="padding:12px 8px; text-align:right; font-size:11px; font-weight:bold; color:#555; border-bottom:1px solid #e5e7eb;">UNIT PRICE</th>
                                <th style="padding:12px 8px; text-align:right; font-size:11px; font-weight:bold; color:#555; border-bottom:1px solid #e5e7eb;">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <!-- Totals -->
                    <div style="display:flex; justify-content:flex-end;">
                        <div style="width:300px;">
                            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #f3f4f6;">
                                <span style="font-size:12px; color:#555;">Subtotal</span>
                                <span style="font-size:12px; font-weight:bold;">${order.subtotal.toFixed(2)}</span>
                            </div>
                            ${
                              order.discountAmount > 0
                                ? `
                            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #f3f4f6;">
                                <span style="font-size:12px; color:#555;">Discount</span>
                                <span style="font-size:12px; color:red;">-${order.discountAmount.toFixed(2)}</span>
                            </div>`
                                : ''
                            }
                            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #f3f4f6;">
                                <span style="font-size:12px; color:#555;">Shipping</span>
                                <span style="font-size:12px;">${(order.shippingCost || 0).toFixed(2)}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; padding:12px 0; margin-top:5px; border-top:2px solid #000;">
                                <span style="font-size:16px; font-weight:bold;">Total</span>
                                <span style="font-size:16px; font-weight:bold;">${order.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Download Button -->
                    <div style="text-align:center; margin-top:40px; margin-bottom:30px;">
                        <a href="${downloadUrl}" style="background-color:#000000; color:#ffffff; padding:14px 28px; text-decoration:none; font-weight:bold; border-radius:4px; font-size:14px; display:inline-block;">Download Official Invoice (PDF)</a>
                        <p style="margin-top:15px; font-size:11px; color:#888;">Direct Link: <a href="${downloadUrl}" style="color:#666;">${downloadUrl}</a></p>
                    </div>

                    <!-- Footer -->
                    <div style="margin-top:50px; padding-top:20px; border-top:1px solid #e5e7eb; font-size:11px; color:#888; text-align:center;">
                        <p style="margin:0 0 10px 0;"><strong>Terms & Conditions</strong></p>
                        <p style="margin:0;">Payment is due within 15 days. Please check the goods upon delivery. Returns accepted within 7 days with original receipt.</p>
                        <p style="margin-top:20px;">Thank you for your business!</p>
                    </div>
                </div>
            </body>
            </html>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent to:', to);
  } catch (e) {
    console.error('Order confirmation email error:', e);
  }
};

/**
 * Send email with Invoice PDF attachment
 */
exports.sendInvoicePdfEmail = async ({ to, name, invoiceNumber, pdfBuffer }) => {
  const mailOptions = {
    from: `"${process.env.COMPANY_NAME || 'Mahbub Shop'}" <${process.env.SMTP_FROM || process.env.SMTP_USER_NAME}>`,
    to,
    subject: `Invoice for your order - ${invoiceNumber}`,
    html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
                <h2>Hello ${name},</h2>
                <p>Thank you for your business! Please find attached the invoice <strong>#${invoiceNumber}</strong> for your recent order.</p>
                <p>If you have any questions, feel free to contact us.</p>
                <p>Best regards,<br>${process.env.COMPANY_NAME || 'Mahbub Shop'} Team</p>
            </div>
        `,
    attachments: [
      {
        filename: `Invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invoice email sent to: ${to} for invoice ${invoiceNumber}`);
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};
const juice = require('juice');

/**
 * Send custom email to user
 */
exports.sendCustomEmail = async ({ to, subject, message }) => {
  // Check if the message seems to be a full HTML document (with body/html tags)
  const isFullHtml =
    message.toLowerCase().includes('<html') || message.toLowerCase().includes('<body');

  let rawHtml = message;

  // Hardcoded subset of Tailwind CSS for email templates to avoid external compilation issues
  // and missing Node.js dependencies during runtime.
  const generatedCss = `
        /* Typography */
        .text-xs { font-size: 0.75rem; line-height: 1rem; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .text-base { font-size: 1rem; line-height: 1.5rem; }
        .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
        .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
        .text-2xl { font-size: 1.5rem; line-height: 2rem; }
        .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }

        .font-normal { font-weight: 400; }
        .font-medium { font-weight: 500; }
        .font-bold { font-weight: 700; }
        .font-extrabold { font-weight: 800; }

        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }

        .uppercase { text-transform: uppercase; }
        .tracking-wider { letter-spacing: 0.05em; }
        .leading-relaxed { line-height: 1.625; }

        /* Colors */
        .text-white { color: #ffffff; }
        .text-gray-500 { color: #6b7280; }
        .text-gray-600 { color: #4b5563; }
        .text-gray-700 { color: #374151; }
        .text-gray-800 { color: #1f2937; }
        .text-blue-600 { color: #2563eb; }
        .text-blue-800 { color: #1e40af; }
        .text-red-400 { color: #f87171; }
        .text-slate-300 { color: #cbd5e1; }
        .text-slate-500 { color: #64748b; }
        .text-slate-900 { color: #0f172a; }

        .bg-white { background-color: #ffffff; }
        .bg-gray-50 { background-color: #f9fafb; }
        .bg-blue-50 { background-color: #eff6ff; }
        .bg-blue-600 { background-color: #2563eb; }
        .bg-red-500 { background-color: #ef4444; }
        .bg-slate-800 { background-color: #1e293b; }
        .bg-slate-900 { background-color: #0f172a; }

        /* Spacing & Layout */
        .p-4 { padding: 1rem; }
        .p-8 { padding: 2rem; }
        .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
        .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }

        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-8 { margin-top: 2rem; }

        .mx-auto { margin-left: auto; margin-right: auto; }

        .max-w-md { max-width: 28rem; }
        .w-full { width: 100%; }

        .inline-block { display: inline-block; }
        .block { display: block; }

        /* Borders & Radius */
        .rounded { border-radius: 0.25rem; }
        .rounded-md { border-radius: 0.375rem; }
        .rounded-lg { border-radius: 0.5rem; }
        .rounded-full { border-radius: 9999px; }

        .border { border-width: 1px; border-style: solid; }
        .border-gray-200 { border-color: #e5e7eb; }
        .border-slate-700 { border-color: #334155; }

        .outline { outline-style: solid; }
        .outline-1 { outline-width: 1px; }
        .outline-gray-200 { outline-color: #e5e7eb; }

        .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .decoration-none { text-decoration: none; }
    `;

  if (!isFullHtml) {
    rawHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>${generatedCss}</style>
            </head>
            <body style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
                ${message}
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 11px; color: #888;">This email was sent by an administrator from ${process.env.COMPANY_NAME || 'Mahbub Shop'}.</p>
            </body>
            </html>
        `;
  } else {
    if (rawHtml.toLowerCase().includes('</head>')) {
      rawHtml = rawHtml.replace(/<\/head>/i, `<style>${generatedCss}</style></head>`);
    } else {
      rawHtml = `<style>${generatedCss}</style>\n` + rawHtml;
    }
  }

  // Convert Tailwind/CSS classes to inline styles
  const inlinedHtml = juice(rawHtml);

  const mailOptions = {
    from: `"${process.env.COMPANY_NAME || 'Mahbub Shop'}" <${process.env.SMTP_FROM || process.env.SMTP_USER_NAME}>`,
    to,
    subject,
    html: inlinedHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Custom email sent to: ${to}`);
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};
/**
 * Replace {{variable.key}} placeholders in a string.
 * data = { user: { firstName: '...' }, custom: { ...} }
 */
exports.replaceVariables = (template, data) => {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const parts = key.trim().split('.');
    let val = data;
    for (const part of parts) {
      val = val?.[part];
    }
    return val !== undefined && val !== null ? String(val) : match;
  });
};

/**
 * Send campaign / quick direct email with variable substitution,
 * Tailwind CSS inlining, and optional nodemailer attachments.
 */
exports.sendCampaignEmail = async ({ to, subject, html, attachments = [] }) => {
  // Inline Tailwind classes (same subset as sendCustomEmail)
  const juice = require('juice');
  const tailwindCss = `
    .text-xs{font-size:.75rem;line-height:1rem}.text-sm{font-size:.875rem;line-height:1.25rem}.text-base{font-size:1rem;line-height:1.5rem}.text-lg{font-size:1.125rem;line-height:1.75rem}.text-xl{font-size:1.25rem;line-height:1.75rem}.text-2xl{font-size:1.5rem;line-height:2rem}.text-3xl{font-size:1.875rem;line-height:2.25rem}.text-4xl{font-size:2.25rem;line-height:2.5rem}.font-normal{font-weight:400}.font-medium{font-weight:500}.font-semibold{font-weight:600}.font-bold{font-weight:700}.font-extrabold{font-weight:800}.font-black{font-weight:900}.text-center{text-align:center}.text-left{text-align:left}.text-right{text-align:right}.uppercase{text-transform:uppercase}.tracking-wider{letter-spacing:.05em}.tracking-tight{letter-spacing:-.025em}.leading-relaxed{line-height:1.625}.leading-tight{line-height:1.25}.decoration-none,.no-underline{text-decoration:none}
    .text-white{color:#fff}.text-gray-400{color:#9ca3af}.text-gray-500{color:#6b7280}.text-gray-600{color:#4b5563}.text-gray-700{color:#374151}.text-gray-800{color:#1f2937}.text-gray-900{color:#111827}.text-blue-100{color:#dbeafe}.text-blue-600{color:#2563eb}.text-blue-800{color:#1e40af}.text-indigo-600{color:#4f46e5}.text-red-400{color:#f87171}.text-red-600{color:#dc2626}.text-green-600{color:#16a34a}.text-slate-300{color:#cbd5e1}.text-slate-400{color:#94a3b8}.text-slate-500{color:#64748b}.text-slate-900{color:#0f172a}
    .bg-white{background-color:#fff}.bg-gray-50{background-color:#f9fafb}.bg-gray-100{background-color:#f3f4f6}.bg-blue-50{background-color:#eff6ff}.bg-blue-600{background-color:#2563eb}.bg-red-500{background-color:#ef4444}.bg-green-500{background-color:#22c55e}.bg-indigo-600{background-color:#4f46e5}.bg-slate-800{background-color:#1e293b}.bg-slate-900{background-color:#0f172a}.bg-black{background-color:#000}
    .p-2{padding:.5rem}.p-3{padding:.75rem}.p-4{padding:1rem}.p-5{padding:1.25rem}.p-6{padding:1.5rem}.p-8{padding:2rem}.p-12{padding:3rem}.px-3{padding-left:.75rem;padding-right:.75rem}.px-4{padding-left:1rem;padding-right:1rem}.px-6{padding-left:1.5rem;padding-right:1.5rem}.px-8{padding-left:2rem;padding-right:2rem}.py-1{padding-top:.25rem;padding-bottom:.25rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}.py-3{padding-top:.75rem;padding-bottom:.75rem}.py-4{padding-top:1rem;padding-bottom:1rem}.mb-1{margin-bottom:.25rem}.mb-2{margin-bottom:.5rem}.mb-4{margin-bottom:1rem}.mb-6{margin-bottom:1.5rem}.mb-8{margin-bottom:2rem}.mt-4{margin-top:1rem}.mt-6{margin-top:1.5rem}.mt-8{margin-top:2rem}.mx-auto{margin-left:auto;margin-right:auto}.max-w-sm{max-width:24rem}.max-w-md{max-width:28rem}.max-w-xl{max-width:36rem}.w-full{width:100%}.block{display:block}.inline-block{display:inline-block}.flex{display:flex}.grid{display:grid}.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.gap-4{gap:1rem}
    .rounded{border-radius:.25rem}.rounded-md{border-radius:.375rem}.rounded-lg{border-radius:.5rem}.rounded-xl{border-radius:.75rem}.rounded-2xl{border-radius:1rem}.rounded-full{border-radius:9999px}.border{border-width:1px;border-style:solid}.border-gray-100{border-color:#f3f4f6}.border-gray-200{border-color:#e5e7eb}.border-slate-700{border-color:#334155}.shadow-sm{box-shadow:0 1px 2px 0 rgba(0,0,0,0.05)}.shadow-xl{box-shadow:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1)}
    .overflow-hidden{overflow:hidden}.object-cover{object-fit:cover}.h-48{height:12rem}.text-xs{font-size:.75rem}
  `;

  const isFullHtml = html.toLowerCase().includes('<html') || html.toLowerCase().includes('<body');
  let rawHtml = html;
  if (!isFullHtml) {
    rawHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${tailwindCss}</style></head><body style="font-family:Arial,sans-serif;padding:20px;line-height:1.6;color:#333;background:#f9fafb;">${html}<hr style="border:0;border-top:1px solid #eee;margin:20px 0;"><p style="font-size:11px;color:#888;">Sent by ${process.env.COMPANY_NAME || 'Mahbub Shop'}</p></body></html>`;
  } else {
    rawHtml = rawHtml.replace(/<\/head>/i, `<style>${tailwindCss}</style></head>`);
  }

  const inlinedHtml = juice(rawHtml);

  const transporter = await getTransporter();
  const mailOptions = {
    from: await getSenderInfo(),
    to,
    subject,
    html: inlinedHtml,
    attachments: attachments.length > 0 ? attachments : undefined,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Campaign email sent to: ${to}`);
};

/**
 * Send abandoned cart recovery email
 */
exports.sendAbandonedCartRecoveryEmail = async ({ to, name, cart, recoveryLink }) => {
  const itemsHtml = cart.items
    .map((it) => {
      const title = it.product?.name || 'Item';
      const variant = it.variant?.name ? `(${it.variant.name})` : '';
      const qty = it.quantity || 1;
      const price = it.unitPrice || 0;
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <div style="font-weight: bold;">${title}</div>
            <div style="font-size: 12px; color: #666;">${variant}</div>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${qty}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${price.toFixed(2)}</td>
        </tr>`;
    })
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #2563eb;">Did you forget something?</h2>
      <p>Hi ${name},</p>
      <p>We noticed you left some items in your shopping cart. We've saved them for you, but they might sell out soon!</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total</td>
            <td style="padding: 10px; text-align: right; font-weight: bold;">${(cart.total || 0).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${recoveryLink}" style="background: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Complete Your Purchase</a>
      </div>

      <p style="font-size: 13px; color: #666;">If you have any questions, feel free to reply to this email. We're here to help!</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 11px; color: #999; text-align: center;">Sent by ${process.env.COMPANY_NAME || 'Mahbub Shop'}</p>
    </div>
  `;

  await this.sendCampaignEmail({
    to,
    subject: 'Complete your purchase - Items waiting in your cart',
    html,
  });
};
