/**
 * Admin Seeding Script
 * 
 * This script creates admin and librarian accounts directly in the database.
 * This is the ONLY way to create admin/librarian accounts for security purposes.
 * 
 * Usage:
 *   npm run seed:admin
 * 
 * Security Notes:
 * - Admin/librarian accounts cannot be created via public API endpoints
 * - Only database administrators should have access to run this script
 * - Change the default credentials after first use
 * - Store credentials securely (use environment variables in production)
 */

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/types.js';
import { addUser, getUserByEmail, initializeDatabase } from '../database/db.js';

const SALT_ROUNDS = 10;

// Default admin credentials - CHANGE THESE IN PRODUCTION
const DEFAULT_ADMINS = [
  {
    name: 'Library Administrator',
    email: 'admin@library.com',
    password: 'Admin@2026!Secure',
    role: 'admin' as const,
  },
  {
    name: 'Head Librarian',
    email: 'librarian@library.com',
    password: 'Librarian@2026!Secure',
    role: 'librarian' as const,
  },
];

async function seedAdmin() {
  console.log('🔐 Starting Admin/Librarian Seeding Process...\n');

  // Initialize database
  initializeDatabase();

  let createdCount = 0;
  let skippedCount = 0;

  for (const admin of DEFAULT_ADMINS) {
    // Check if user already exists
    const existingUser = getUserByEmail(admin.email);

    if (existingUser) {
      console.log(`⏭️  Skipped: ${admin.role.toUpperCase()} account already exists`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Existing Role: ${existingUser.role}\n`);
      skippedCount++;
      continue;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(admin.password, SALT_ROUNDS);

    // Create user object
    const user: User = {
      id: uuidv4(),
      email: admin.email,
      password: hashedPassword,
      name: admin.name,
      role: admin.role,
      createdAt: new Date().toISOString(),
      borrowHistory: [],
    };

    // Add to database
    addUser(user);

    console.log(`✅ Created: ${admin.role.toUpperCase()} account`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${admin.password}`);
    console.log(`   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!\n`);
    createdCount++;
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log(`📊 Summary:`);
  console.log(`   ✅ Created: ${createdCount} account(s)`);
  console.log(`   ⏭️  Skipped: ${skippedCount} account(s) (already exist)`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (createdCount > 0) {
    console.log('🔒 SECURITY REMINDERS:');
    console.log('   1. Change default passwords immediately');
    console.log('   2. Store credentials in a secure password manager');
    console.log('   3. Enable 2FA if available in production');
    console.log('   4. Never commit credentials to version control');
    console.log('   5. Restrict access to this seeding script\n');
  }

  console.log('✅ Admin/Librarian seeding completed!\n');
}

// Run the seeding function
seedAdmin().catch((error) => {
  console.error('❌ Error seeding admin accounts:', error);
  process.exit(1);
});
