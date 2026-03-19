const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultTemplates = [
  // --- WELCOME EMAILS ---
  {
    name: 'Modern Welcome with Coupon',
    type: 'WELCOME_EMAIL',
    subject: 'Welcome to Mahbub Shop! Unlock your 10% discount.',
    variables: [
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'coupon_code', label: 'Coupon Code' },
      { key: 'shop_link', label: 'Shop Link' },
    ],
    body: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 16px;">
        <h1 style="color: #4f46e5; text-align: center; font-size: 32px;">Welcome, {{customer_name}}!</h1>
        <p style="text-align: center; color: #64748b; line-height: 1.6;">We're so glad you're here. As a token of our appreciation, here's a special gift just for you:</p>
        <div style="background: #f5f3ff; border: 2px dashed #c084fc; padding: 20px; text-align: center; margin: 30px 0; border-radius: 12px;">
          <span style="font-size: 14px; color: #7c3aed; font-weight: bold; display: block; margin-bottom: 5px;">YOUR CODE</span>
          <span style="font-size: 24px; color: #1e1b4b; font-weight: 900; letter-spacing: 2px;">{{coupon_code}}</span>
        </div>
        <div style="text-align: center;">
          <a href="{{shop_link}}" style="background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Start Exploring</a>
        </div>
      </div>
    `,
    design: {},
  },
  {
    name: 'Minimalist Welcome',
    type: 'WELCOME_EMAIL',
    subject: "G'day from Mahbub Shop!",
    variables: [{ key: 'customer_name', label: 'Customer Name' }],
    body: `
      <div style="font-family: serif; max-width: 600px; margin: auto; padding: 40px; color: #334155;">
        <p>Dear {{customer_name}},</p>
        <p>Welcome to the family. We hope you find exactly what you're looking for.</p>
        <p>Best,<br>The Team</p>
      </div>
    `,
    design: {},
  },

  // --- ORDER EMAILS ---
  {
    name: 'Visual Order Confirmation',
    type: 'ORDER_CONFIRMATION',
    subject: 'Order Confirmed: #{{order_number}}',
    variables: [
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'order_number', label: 'Order Number' },
      { key: 'order_items', label: 'Order Items (HTML)' },
      { key: 'order_total', label: 'Order Total' },
    ],
    body: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #1e293b; color: white; padding: 30px; text-align: center;">
          <h2 style="margin: 0;">Thanks for your order!</h2>
          <p style="opacity: 0.8; font-size: 14px; margin-top: 5px;">#{{order_number}}</p>
        </div>
        <div style="padding: 30px;">
          <p>Hi {{customer_name}}, we've received your order and are getting it ready.</p>
          <div style="margin: 20px 0;">{{order_items}}</div>
          <div style="border-top: 2px solid #f8fafc; padding-top: 20px; text-align: right;">
            <p style="font-size: 20px; font-weight: bold;">Total: {{order_total}} BDT</p>
          </div>
        </div>
      </div>
    `,
    design: {},
  },

  // --- PROMOTIONAL ---
  {
    name: 'Flash Sale Alert',
    type: 'PROMOTION',
    subject: '🔥 FLASH SALE IS LIVE!',
    variables: [
      { key: 'sale_title', label: 'Sale Title' },
      { key: 'discount_percentage', label: 'Discount %' },
      { key: 'shop_link', label: 'Shop Link' },
    ],
    body: `
      <div style="font-family: 'Arial Black', sans-serif; max-width: 600px; margin: auto; text-align: center; background: #000; color: #fff; padding: 50px 20px;">
        <h1 style="font-size: 48px; color: #ffeb3b; margin: 0;">{{discount_percentage}}% OFF</h1>
        <h2 style="font-size: 24px; margin-top: 10px;">{{sale_title}}</h2>
        <p style="font-family: sans-serif; opacity: 0.8; margin: 30px 0;">Limited time only. Don't miss out on these incredible deals.</p>
        <a href="{{shop_link}}" style="background: #ffffff; color: #000; padding: 15px 40px; border-radius: 4px; text-decoration: none; font-weight: bold; text-transform: uppercase;">Shop Now</a>
      </div>
    `,
    design: {},
  },

  // --- USER SPECIFIC (DIRECT COMMUNICATION) ---
  {
    name: 'Direct Message from Support',
    type: 'USER_DIRECT',
    subject: 'Regarding your recent query',
    variables: [
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'support_message', label: 'Support Message Content' },
      { key: 'ticket_id', label: 'Ticket ID' },
    ],
    body: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 30px; border-left: 4px solid #3b82f6; background: #f8fafc;">
        <h3 style="color: #1e293b; margin-top: 0;">Hello {{customer_name}},</h3>
        <p style="color: #475569; line-height: 1.7; white-space: pre-line;">{{support_message}}</p>
        <p style="font-size: 11px; color: #94a3b8; margin-top: 40px;">Reference Ticket: #{{ticket_id}}</p>
      </div>
    `,
    design: {},
  },
  {
    name: 'Account Status Update',
    type: 'USER_DIRECT',
    subject: 'Important update about your account',
    variables: [
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'status_message', label: 'Status Update Description' },
    ],
    body: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 30px; text-align: center;">
        <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 20px; border-radius: 12px;">
          <h2 style="color: #92400e; margin-top: 0;">Account Update</h2>
          <p style="color: #78350f;">Hi {{customer_name}}, we wanted to let you know that: {{status_message}}</p>
        </div>
      </div>
    `,
    design: {},
  },

  // --- PASSWORD RESET ---
  {
    name: 'Secure Password Reset',
    type: 'PASSWORD_RESET',
    subject: 'Reset your password',
    variables: [
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'reset_link', label: 'Reset Link' },
    ],
    body: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h3>Hello {{customer_name}},</h3>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="{{reset_link}}" style="display: inline-block; background: #ef4444; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none;">Reset Password</a>
        <p style="margin-top: 20px; font-size: 12px; color: #999;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
    design: {},
  },
];

async function seed() {
  console.log('Seeding email templates...');
  for (const template of defaultTemplates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template,
    });
  }
  console.log('Done!');
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
