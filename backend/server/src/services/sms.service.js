const prisma = require('../config/prisma');
const twilio = require('twilio');

/**
 * Get SMS Settings from DB
 */
const getSmsSettings = async () => {
  return await prisma.smsSetting.findFirst();
};

/**
 * Send SMS via Twilio
 */
const sendTwilioSms = async (to, message, settings) => {
  try {
    if (!settings.apiSid || !settings.apiToken || !settings.fromNumber) {
      throw new Error('Twilio configuration incomplete');
    }

    const client = twilio(settings.apiSid, settings.apiToken);
    await client.messages.create({
      body: message,
      from: settings.fromNumber,
      to: to,
    });

    return { success: true };
  } catch (error) {
    console.error('Twilio SMS Error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Main sendSMS function
 */
exports.sendSMS = async (to, message) => {
  try {
    const settings = await getSmsSettings();
    if (!settings) {
      console.warn('SMS settings not found in database');
      return { success: false, message: 'SMS settings not configured' };
    }

    // Logic based on gateway
    switch (settings.gateway) {
      case 'TWILIO':
        return await sendTwilioSms(to, message, settings);
      default:
        return { success: false, message: 'Unsupported SMS gateway' };
    }
  } catch (error) {
    console.error('sendSMS Main Error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Test SMS Connection (Diagnostic)
 */
exports.testSmsConnection = async (to, settings) => {
  try {
    const testMessage = `Mahbub Shop - SMS Diagnostic Test successful! Time: ${new Date().toLocaleString()}`;

    switch (settings.gateway) {
      case 'TWILIO':
        return await sendTwilioSms(to, testMessage, settings);
      default:
        return { success: false, message: 'Unsupported SMS gateway' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};
