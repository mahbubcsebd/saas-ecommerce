const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const emailService = require('../services/emailService');

// ─── VARIABLE REPLACEMENT HELPER ────────────────────────────────────────────
const replaceVariables = (template, data) => {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const parts = key.trim().split('.');
    let val = data;
    for (const part of parts) val = val?.[part];
    return val !== undefined && val !== null ? String(val) : match;
  });
};

exports.createCampaign = async (req, res) => {
  try {
    const { name, subject, type, content, targetType, targetGroupIds, targetUserIds, scheduledAt } =
      req.body;

    if (!name || !content) {
      return res.status(400).json({ success: false, message: 'Name and content are required' });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        subject,
        type: type || 'EMAIL',
        content,
        targetType: targetType || 'ALL',
        targetGroupIds: targetGroupIds || [],
        targetUserIds: targetUserIds || [],
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    console.error('Create Campaign Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET ALL CAMPAIGNS ──────────────────────────────────────────────────────
exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { recipients: true } },
      },
    });
    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET SINGLE CAMPAIGN ────────────────────────────────────────────────────
exports.getCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        recipients: {
          take: 50, // Limit for performance, can add pagination later
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── UPDATE CAMPAIGN ────────────────────────────────────────────────────────
exports.updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      subject,
      type,
      content,
      targetType,
      targetGroupIds,
      targetUserIds,
      scheduledAt,
      status,
    } = req.body;

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Campaign not found' });

    if (existing.status === 'SENT' || existing.status === 'SENDING') {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Cannot update a campaign that is already sending or sent',
        });
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(subject !== undefined && { subject }),
        ...(type && { type }),
        ...(content !== undefined && { content }),
        ...(targetType && { targetType }),
        ...(targetGroupIds && { targetGroupIds }),
        ...(targetUserIds && { targetUserIds }),
        ...(scheduledAt !== undefined && {
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        }),
        ...(status && { status }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE CAMPAIGN ────────────────────────────────────────────────────────
exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Campaign not found' });

    if (existing.status === 'SENDING') {
      return res
        .status(400)
        .json({ success: false, message: 'Cannot delete a campaign while it is sending' });
    }

    await prisma.campaign.delete({ where: { id } });
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── SEND CAMPAIGN (RESOLVE AUDIENCE + SEND) ────────────────────────────────
exports.sendCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.campaign.findUnique({ where: { id } });

    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    if (campaign.status === 'SENT' || campaign.status === 'SENDING') {
      return res
        .status(400)
        .json({ success: false, message: 'Campaign already processing or finished' });
    }

    // 1. Resolve Recipients
    let userEmails = [];
    if (campaign.targetType === 'ALL') {
      const users = await prisma.user.findMany({ select: { id: true, email: true } });
      userEmails = users;
    } else if (campaign.targetType === 'GROUP') {
      // Need to join CustomerGroups. This assumes Group model and User relation exists.
      // Simplified: Fetch users belonging to targetGroupIds
      const groups = await prisma.customerGroup.findMany({
        where: { id: { in: campaign.targetGroupIds } },
        include: { customers: { select: { id: true, email: true } } },
      });
      const uniqueUsers = new Map();
      groups.forEach((g) => g.customers.forEach((u) => uniqueUsers.set(u.id, u)));
      userEmails = Array.from(uniqueUsers.values());
    } else if (campaign.targetType === 'CUSTOM') {
      const users = await prisma.user.findMany({
        where: { id: { in: campaign.targetUserIds } },
        select: { id: true, email: true },
      });
      userEmails = users;
    }

    if (userEmails.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'No recipients found for this campaign' });
    }

    // 2. Clear previous recipients and create new ones
    await prisma.campaignRecipient.deleteMany({ where: { campaignId: id } });
    await prisma.campaignRecipient.createMany({
      data: userEmails.map((u) => ({
        campaignId: id,
        userId: u.id,
        email: u.email,
        status: 'PENDING',
      })),
    });

    // 3. Mark as SENDING
    await prisma.campaign.update({
      where: { id },
      data: { status: 'SENDING', totalRecipients: userEmails.length },
    });

    // Respond immediately to the request
    res.json({ success: true, message: `Campaign started for ${userEmails.length} recipients` });

    // 4. Background Send (Simplified Loop)
    const recipients = await prisma.campaignRecipient.findMany({ where: { campaignId: id } });

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      try {
        // Injected tracking pixel
        const trackingPixel = `<img src="${process.env.BACKEND_URL || 'http://localhost:8000'}/api/v1/campaigns/track/open/${recipient.id}" width="1" height="1" style="display:none;" />`;
        const finalHtml = campaign.content + trackingPixel;

        await emailService.sendCustomEmail({
          to: recipient.email,
          subject: campaign.subject || campaign.name,
          html: finalHtml,
        });

        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send campaign email to ${recipient.email}:`, err);
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'FAILED' },
        });
        failedCount++;
      }

      // Periodic update of stats
      if (sentCount % 10 === 0) {
        await prisma.campaign.update({
          where: { id },
          data: { sentCount, failedCount },
        });
      }
    }

    // Final update
    await prisma.campaign.update({
      where: { id },
      data: { status: 'SENT', sentCount, failedCount, sentAt: new Date() },
    });
  } catch (error) {
    console.error('Send Campaign Error:', error);
    // We don't have res here if it already sent response
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// ─── TRACK OPEN (PIXEL) ─────────────────────────────────────────────────────
exports.trackOpen = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const recipient = await prisma.campaignRecipient.findUnique({
      where: { id: recipientId },
      include: { campaign: true },
    });

    if (recipient && recipient.status !== 'OPENED') {
      await prisma.campaignRecipient.update({
        where: { id: recipientId },
        data: { status: 'OPENED', openedAt: new Date() },
      });

      await prisma.campaign.update({
        where: { id: recipient.campaignId },
        data: { openCount: { increment: 1 } },
      });
    }

    // Return a 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(pixel);
  } catch (error) {
    // Pixel should not reveal errors, just return pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.end(pixel);
  }
};
// ─── SEND QUICK CAMPAIGN EMAIL (with variable substitution + attachments) ────
/**
 * POST /api/campaigns/send-quick
 * Body:
 *   - subject: string (may include {{user.firstName}} etc.)
 *   - templateHtml: string (Tailwind HTML with {{variable}} placeholders)
 *   - recipientType: 'specific' | 'all' | 'segment'
 *   - recipientIds: string[] (used when recipientType='specific')
 *   - segment: 'CUSTOMER' | 'ADMIN' | 'STAFF' etc.
 *   - extraData: object (custom variables: { coupon: { code: 'XYZ' } })
 *   - attachments: [{ filename, url, contentType }]
 */
exports.sendQuickEmail = async (req, res) => {
  try {
    const {
      subject,
      templateHtml,
      recipientType = 'specific',
      recipientIds = [],
      segment,
      extraData = {},
      attachments = [],
    } = req.body;

    if (!subject || !templateHtml) {
      return res
        .status(400)
        .json({ success: false, message: 'subject and templateHtml are required' });
    }

    // Resolve recipients
    let recipients = [];
    if (recipientType === 'all') {
      recipients = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true },
      });
    } else if (recipientType === 'segment' && segment) {
      recipients = await prisma.user.findMany({
        where: { status: 'ACTIVE', role: segment },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true },
      });
    } else if (recipientType === 'group' && req.body.groupId) {
      recipients = await prisma.user.findMany({
        where: { groupId: req.body.groupId },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true },
      });
    } else if (recipientIds.length > 0) {
      recipients = await prisma.user.findMany({
        where: { id: { in: recipientIds } },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true },
      });
    }

    if (recipients.length === 0) {
      return res.status(400).json({ success: false, message: 'No recipients found' });
    }

    // Resolve attachments (download buffers from URLs)
    const resolvedAttachments = await Promise.all(
      attachments.map(async (att) => {
        try {
          const response = await fetch(att.url);
          const buffer = Buffer.from(await response.arrayBuffer());
          return {
            filename: att.filename,
            content: buffer,
            contentType: att.contentType || 'application/octet-stream',
          };
        } catch (e) {
          console.warn(`Could not fetch attachment ${att.url}:`, e.message);
          return null;
        }
      })
    ).then((r) => r.filter(Boolean));

    // Send per-user with variable substitution
    const results = [];
    for (const user of recipients) {
      const varData = {
        user: {
          firstName: user.firstName || 'Customer',
          lastName: user.lastName || '',
          email: user.email,
          phone: user.phone || '',
          name: `${user.firstName || 'Customer'} ${user.lastName || ''}`.trim(),
        },
        ...extraData,
      };

      const personalizedSubject = replaceVariables(subject, varData);
      const personalizedHtml = replaceVariables(templateHtml, varData);

      try {
        await emailService.sendCampaignEmail({
          to: user.email,
          subject: personalizedSubject,
          html: personalizedHtml,
          attachments: resolvedAttachments,
        });
        results.push({ email: user.email, status: 'sent' });
      } catch (err) {
        console.error(`Failed to send to ${user.email}:`, err.message);
        results.push({ email: user.email, status: 'failed', error: err.message });
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    res.json({
      success: true,
      message: `${sent} sent, ${failed} failed`,
      data: { total: recipients.length, sent, failed, results },
    });
  } catch (error) {
    console.error('sendQuickEmail error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET RECIPIENTS (for campaign composer picker) ───────────────────────────
exports.getRecipients = async (req, res) => {
  try {
    const { search, role, limit = '200' } = req.query;
    const filter = {};
    if (role && role !== 'ALL') filter.role = role;
    if (search) {
      filter.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }
    const users = await prisma.user.findMany({
      where: filter,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        groupId: true,
      },
      take: Math.min(parseInt(limit) || 200, 500),
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
