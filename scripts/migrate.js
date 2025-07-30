#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const MigrationRunner = require('../migrations');
const logger = require('../utils/logger');

// Import all migrations
const migration001 = require('../migrations/001_add_indexes');
const migration002 = require('../migrations/002_standardize_timestamps');

async function runMigrations() {
  try {
    // Connect to database
    await require('../database/mongoose');
    
    // Create migration runner
    const runner = new MigrationRunner();
    
    // Add all migrations
    runner.addMigration(  );
    runner.addMigration(migration002);
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (command === 'rollback') {
      const targetVersion = parseInt(args[1]);
      if (isNaN(targetVersion)) {
        console.error('Please provide a target version for rollback');
        process.exit(1);
      }
      await runner.rollback(targetVersion);
    } else {
      // Run migrations
      await runner.run();
    }
    
    logger.info('Migration script completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration script failed:', error);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };