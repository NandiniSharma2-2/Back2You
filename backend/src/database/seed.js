require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'back2you_user',
    password: process.env.DB_PASSWORD || 'back2you_pass',
    database: process.env.DB_NAME || 'back2you',
  });

  try {
    logger.info('🌱 Starting database seeding...');

    // Roles
    await connection.execute(`
      INSERT IGNORE INTO roles (id, name, description) VALUES
      (1, 'guest', 'Unauthenticated user with read-only access'),
      (2, 'user', 'Registered user with full access to reports and claims'),
      (3, 'moderator', 'Can review claims and flag content'),
      (4, 'admin', 'Full admin access to platform management'),
      (5, 'super_admin', 'Super administrator with unrestricted access')
    `);

    // Permissions
    const permissions = [
      ['read:items', 'View lost and found items', 'items'],
      ['create:items', 'Create lost and found reports', 'items'],
      ['edit:own_items', 'Edit own items', 'items'],
      ['delete:own_items', 'Delete own items', 'items'],
      ['edit:any_items', 'Edit any item', 'items'],
      ['delete:any_items', 'Delete any item', 'items'],
      ['create:claims', 'Submit ownership claims', 'claims'],
      ['view:own_claims', 'View own claims', 'claims'],
      ['view:all_claims', 'View all claims', 'claims'],
      ['review:claims', 'Review and approve/reject claims', 'claims'],
      ['use:chat', 'Use real-time chat', 'chat'],
      ['moderate:content', 'Flag and moderate content', 'moderation'],
      ['manage:users', 'Manage user accounts', 'admin'],
      ['manage:categories', 'Manage item categories', 'admin'],
      ['view:analytics', 'View platform analytics', 'admin'],
      ['manage:settings', 'Manage system settings', 'admin'],
      ['view:audit_logs', 'View audit logs', 'admin'],
      ['super:access', 'Unrestricted access to all features', 'super'],
    ];

    for (const [name, description, module] of permissions) {
      await connection.execute(
        'INSERT IGNORE INTO permissions (name, description, module) VALUES (?, ?, ?)',
        [name, description, module]
      );
    }

    // Categories
    const categories = [
      ['Electronics', 'electronics', 'Phones, laptops, gadgets', '📱', '#00F0FF'],
      ['Jewelry & Accessories', 'jewelry-accessories', 'Rings, watches, necklaces', '💍', '#FF007F'],
      ['Bags & Luggage', 'bags-luggage', 'Backpacks, suitcases, purses', '👜', '#39FF14'],
      ['Clothing', 'clothing', 'Clothes, shoes, hats', '👕', '#00F0FF'],
      ['Documents & Cards', 'documents-cards', 'IDs, passports, credit cards', '📄', '#FF007F'],
      ['Keys', 'keys', 'House keys, car keys', '🔑', '#39FF14'],
      ['Pets', 'pets', 'Lost or found animals', '🐾', '#00F0FF'],
      ['Vehicles', 'vehicles', 'Bikes, scooters, cars', '🚗', '#FF007F'],
      ['Sports Equipment', 'sports-equipment', 'Gym gear, bikes, balls', '⚽', '#39FF14'],
      ['Musical Instruments', 'musical-instruments', 'Guitars, violins, etc.', '🎸', '#00F0FF'],
      ['Books & Education', 'books-education', 'Books, notebooks, school supplies', '📚', '#FF007F'],
      ['Other', 'other', 'Miscellaneous items', '📦', '#39FF14'],
    ];

    for (const [name, slug, description, icon, color] of categories) {
      await connection.execute(
        'INSERT IGNORE INTO categories (name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?)',
        [name, slug, description, icon, color]
      );
    }

    // Super Admin
    const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 12);
    await connection.execute(`
      INSERT IGNORE INTO users 
        (uuid, username, email, password, first_name, last_name, role_id, is_verified, is_active)
      VALUES (?, 'superadmin', 'superadmin@back2you.com', ?, 'Super', 'Admin', 5, 1, 1)
    `, [uuidv4(), superAdminPassword]);

    // Admin
    const adminPassword = await bcrypt.hash('Admin@123456', 12);
    await connection.execute(`
      INSERT IGNORE INTO users 
        (uuid, username, email, password, first_name, last_name, role_id, is_verified, is_active)
      VALUES (?, 'admin', 'admin@back2you.com', ?, 'Platform', 'Admin', 4, 1, 1)
    `, [uuidv4(), adminPassword]);

    // Moderator
    const modPassword = await bcrypt.hash('Moderator@123', 12);
    await connection.execute(`
      INSERT IGNORE INTO users 
        (uuid, username, email, password, first_name, last_name, role_id, is_verified, is_active)
      VALUES (?, 'moderator1', 'moderator@back2you.com', ?, 'Content', 'Moderator', 3, 1, 1)
    `, [uuidv4(), modPassword]);

    // Demo Users
    const userPassword = await bcrypt.hash('User@123456', 12);
    await connection.execute(`
      INSERT IGNORE INTO users 
        (uuid, username, email, password, first_name, last_name, role_id, is_verified, is_active, location)
      VALUES (?, 'john_doe', 'john@example.com', ?, 'John', 'Doe', 2, 1, 1, 'New York, NY')
    `, [uuidv4(), userPassword]);

    await connection.execute(`
      INSERT IGNORE INTO users 
        (uuid, username, email, password, first_name, last_name, role_id, is_verified, is_active, location)
      VALUES (?, 'jane_smith', 'jane@example.com', ?, 'Jane', 'Smith', 2, 1, 1, 'Los Angeles, CA')
    `, [uuidv4(), userPassword]);

    // System settings
    const settings = [
      ['site_name', 'Back2You', 'string', 'Platform name', true],
      ['site_description', 'AI-Powered Lost & Found Network', 'string', 'Platform description', true],
      ['max_images_per_item', '5', 'number', 'Maximum images per item report', false],
      ['match_threshold', '40', 'number', 'Minimum match score to display', false],
      ['auto_match_enabled', 'true', 'boolean', 'Enable automatic item matching', false],
      ['email_notifications', 'true', 'boolean', 'Send email notifications', false],
      ['registration_enabled', 'true', 'boolean', 'Allow new registrations', true],
      ['maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', true],
    ];

    for (const [key, value, type, desc, isPublic] of settings) {
      await connection.execute(
        'INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES (?, ?, ?, ?, ?)',
        [key, value, type, desc, isPublic]
      );
    }

    logger.info('🎉 Database seeding completed successfully!');
    logger.info('📋 Default accounts created:');
    logger.info('   Super Admin: superadmin@back2you.com / SuperAdmin@123');
    logger.info('   Admin:       admin@back2you.com / Admin@123456');
    logger.info('   Moderator:   moderator@back2you.com / Moderator@123');
    logger.info('   User:        john@example.com / User@123456');

  } catch (error) {
    logger.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

seed().catch(error => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
