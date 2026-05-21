const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../helpers/responseHandler');
const { exec } = require('child_process');
const path = require('path');

// Get all predefined attributes
const getAttributes = async (req, res) => {
  try {
    const attributes = await prisma.attribute.findMany({
      orderBy: { label: 'asc' }
    });
    return successResponse(res, {
      statusCode: 200,
      message: 'Attributes retrieved successfully',
      data: attributes
    });
  } catch (error) {
    console.error('Error fetching attributes:', error);
    return errorResponse(res, {
      statusCode: 500,
      message: 'Failed to fetch attributes'
    });
  }
};

// Create or update a predefined attribute
const upsertAttribute = async (req, res) => {
  const { name, label, values } = req.body;

  if (!name || !label || !Array.isArray(values)) {
    return errorResponse(res, {
      statusCode: 400,
      message: 'Name, label, and values (array) are required'
    });
  }

  try {
    const normalizedName = name.toLowerCase().trim();
    const attribute = await prisma.attribute.upsert({
      where: { name: normalizedName },
      update: {
        label: label.trim(),
        values: values.map(v => v.trim())
      },
      create: {
        name: normalizedName,
        label: label.trim(),
        values: values.map(v => v.trim())
      }
    });

    return successResponse(res, {
      statusCode: 200,
      message: 'Attribute saved successfully',
      data: attribute
    });
  } catch (error) {
    console.error('Error saving attribute:', error);
    return errorResponse(res, {
      statusCode: 500,
      message: 'Failed to save attribute'
    });
  }
};

// Delete a predefined attribute
const deleteAttribute = async (req, res) => {
  const { id } = req.params;

  try {
    const attribute = await prisma.attribute.delete({
      where: { id }
    });

    return successResponse(res, {
      statusCode: 200,
      message: 'Attribute deleted successfully',
      data: attribute
    });
  } catch (error) {
    console.error('Error deleting attribute:', error);
    return errorResponse(res, {
      statusCode: 500,
      message: 'Failed to delete attribute'
    });
  }
};

// Temporary setup endpoint to push schema & run seeds using the server's Node execution environment
const runSetup = (req, res) => {
  console.log('🔄 Running database schema push and seed via Express child_process...');
  
  // Navigate to server project root
  const serverPath = path.resolve(__dirname, '../../');
  
  // Execute prisma generate, db push and seed using npx under the server's node environment
  exec('npx prisma db push && node prisma/seeds/attributes.seed.js', { cwd: serverPath }, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Database push/seed execution error:', error);
      return res.status(500).json({
        success: false,
        message: 'Database setup failed',
        error: error.message,
        stderr: stderr
      });
    }

    console.log('✅ Database schema pushed and predefined attributes seeded successfully!');
    console.log(stdout);

    return res.status(200).json({
      success: true,
      message: 'Database push and seeding completed successfully!',
      stdout: stdout
    });
  });
};

module.exports = {
  getAttributes,
  upsertAttribute,
  deleteAttribute,
  runSetup
};
