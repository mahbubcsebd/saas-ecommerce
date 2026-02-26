/**
 * Fixed Transactional Email Template Renderer
 *
 * These are hardcoded, production-ready email HTML bodies.
 * Call the appropriate function when a system event occurs
 * and pass the result to sendCampaignEmail or sendCustomEmail.
 *
 * Usage:
 *   const html = templates.welcome({ firstName: 'John', shopUrl: 'https://...' });
 *   await emailService.sendCampaignEmail({ to, subject: 'Welcome!', html });
 */

const COMPANY = process.env.COMPANY_NAME || 'Mahbub Shop';
const SUPPORT_EMAIL = process.env.SMTP_FROM || 'support@mahbubshop.com';

const footer = () => `
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af;">
    <p style="margin:0;">${COMPANY} &bull; <a href="mailto:${SUPPORT_EMAIL}" style="color:#9ca3af;">${SUPPORT_EMAIL}</a></p>
    <p style="margin:6px 0 0;">This is an automated email. Please do not reply directly.</p>
  </div>
`;

const emailWrapper = (body) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
    ${body}
  </div>
</body>
</html>`;

// ─── Welcome Email ────────────────────────────────────────────────────────────
exports.welcome = ({ firstName, shopUrl = '#', couponCode = null }) => {
  return emailWrapper(`
    <div style="background:linear-gradient(135deg,#4f46e5,#2563eb);padding:40px 32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:800;">Welcome, ${firstName}! 🎉</h1>
      <p style="color:#c7d2fe;margin:10px 0 0;font-size:15px;">Your ${COMPANY} account is ready.</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;line-height:1.7;color:#374151;">We're thrilled to have you with us. Explore thousands of products, enjoy fast delivery, and get great deals every week.</p>
      ${couponCode ? `
      <div style="background:#eff6ff;border:2px dashed #93c5fd;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:1px;">Your Welcome Gift</p>
        <p style="margin:0;font-size:26px;font-weight:900;color:#1e3a8a;letter-spacing:3px;">${couponCode}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">Use this code at checkout.</p>
      </div>` : ''}
      <div style="text-align:center;margin-top:28px;">
        <a href="${shopUrl}" style="background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 36px;border-radius:8px;font-size:15px;display:inline-block;">Start Shopping →</a>
      </div>
      ${footer()}
    </div>
  `);
};

// ─── Password Reset Email ─────────────────────────────────────────────────────
exports.forgotPassword = ({ firstName, resetLink, expiryMinutes = 60 }) => {
  return emailWrapper(`
    <div style="background:#fef2f2;padding:32px;text-align:center;border-bottom:1px solid #fecaca;">
      <div style="font-size:40px;margin-bottom:8px;">🔐</div>
      <h2 style="margin:0;color:#dc2626;font-size:22px;font-weight:800;">Password Reset Request</h2>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#374151;line-height:1.7;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#374151;line-height:1.7;">We received a request to reset your password. Click the button below to set a new one. This link expires in <strong>${expiryMinutes} minutes</strong>.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${resetLink}" style="background:#dc2626;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 36px;border-radius:8px;font-size:15px;display:inline-block;">Reset My Password</a>
      </div>
      <p style="font-size:13px;color:#6b7280;word-break:break-all;">Or paste this URL: <a href="${resetLink}" style="color:#6b7280;">${resetLink}</a></p>
      <p style="font-size:13px;color:#6b7280;margin-top:20px;background:#f9fafb;padding:12px;border-radius:8px;">⚠️ If you didn't request this, you can safely ignore this email. Your password won't change.</p>
      ${footer()}
    </div>
  `);
};

// ─── Order Confirmation Email ─────────────────────────────────────────────────
exports.orderConfirmation = ({ firstName, orderNumber, orderTotal, items = [], downloadUrl = null }) => {
  const itemsHtml = items.map(it => `
    <tr>
      <td style="padding:10px 8px;font-size:13px;border-bottom:1px solid #f3f4f6;">${it.name}${it.variant ? ` <span style="color:#9ca3af;font-size:11px;">(${it.variant})</span>` : ''}</td>
      <td style="padding:10px 8px;font-size:13px;text-align:center;border-bottom:1px solid #f3f4f6;">${it.qty}</td>
      <td style="padding:10px 8px;font-size:13px;text-align:right;font-weight:700;border-bottom:1px solid #f3f4f6;">${it.total} ৳</td>
    </tr>
  `).join('');

  return emailWrapper(`
    <div style="background:#1e293b;padding:32px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">✅</div>
      <h2 style="margin:0;color:#ffffff;font-size:20px;font-weight:800;">Order Confirmed!</h2>
      <p style="margin:6px 0 0;color:#94a3b8;font-size:14px;">Order #${orderNumber}</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#374151;line-height:1.7;">Hi ${firstName}, we've received your order and are preparing it for shipment.</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <thead>
          <tr>
            <th style="padding:10px 8px;font-size:11px;text-align:left;text-transform:uppercase;color:#6b7280;background:#f9fafb;border-bottom:2px solid #e5e7eb;">Item</th>
            <th style="padding:10px 8px;font-size:11px;text-align:center;text-transform:uppercase;color:#6b7280;background:#f9fafb;border-bottom:2px solid #e5e7eb;">Qty</th>
            <th style="padding:10px 8px;font-size:11px;text-align:right;text-transform:uppercase;color:#6b7280;background:#f9fafb;border-bottom:2px solid #e5e7eb;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:14px 8px;font-size:16px;font-weight:800;text-align:right;">Total</td>
            <td style="padding:14px 8px;font-size:16px;font-weight:800;text-align:right;color:#4f46e5;">${orderTotal} ৳</td>
          </tr>
        </tfoot>
      </table>

      ${downloadUrl ? `
      <div style="text-align:center;margin:24px 0;">
        <a href="${downloadUrl}" style="background:#1e293b;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 28px;border-radius:8px;font-size:14px;display:inline-block;">⬇️ Download Invoice (PDF)</a>
      </div>` : ''}
      ${footer()}
    </div>
  `);
};

// ─── Shipping Notification Email ──────────────────────────────────────────────
exports.shippingNotification = ({ firstName, orderNumber, trackingNumber, trackingUrl, estimatedDelivery }) => {
  return emailWrapper(`
    <div style="background:linear-gradient(135deg,#059669,#10b981);padding:32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">🚚</div>
      <h2 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">Your Order is On the Way!</h2>
      <p style="margin:8px 0 0;color:#a7f3d0;font-size:14px;">Order #${orderNumber}</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#374151;line-height:1.7;">Hi ${firstName}! Great news — your order has been handed over to our courier partner and is on its way to you.</p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:1px;">Tracking Number</p>
        <p style="margin:0;font-size:20px;font-weight:900;color:#064e3b;letter-spacing:2px;">${trackingNumber || 'Updating...'}</p>
        ${estimatedDelivery ? `<p style="margin:8px 0 0;font-size:12px;color:#6b7280;">Estimated delivery: <strong>${estimatedDelivery}</strong></p>` : ''}
      </div>

      ${trackingUrl ? `
      <div style="text-align:center;">
        <a href="${trackingUrl}" style="background:#059669;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 32px;border-radius:8px;font-size:15px;display:inline-block;">Track My Package</a>
      </div>` : ''}
      ${footer()}
    </div>
  `);
};
