const mongoose = require('mongoose');
const logger = require('../utils/logger');

class MigrationRunner {
  constructor() {
    this.migrations = [];
  }

  addMigration(migration) {
    this.migrations.push(migration);
  }

  async run() {
    // Create migrations collection if it doesn't exist
    const Migration = this.getMigrationModel();

    // Sort migrations by version
    this.migrations.sort((a, b) => a.version - b.version);

    for (const migration of this.migrations) {
      const existingMigration = await Migration.findOne({ version: migration.version });
      
      if (existingMigration) {
        logger.info(`Migration ${migration.version} already applied, skipping...`);
        continue;
      }

      try {
        logger.info(`Running migration ${migration.version}: ${migration.description}`);
        await migration.up();
        
        // Record successful migration
        await Migration.create({
          version: migration.version,
          description: migration.description,
          appliedAt: new Date()
        });
        
        logger.info(`Migration ${migration.version} completed successfully`);
      } catch (error) {
        logger.error(`Migration ${migration.version} failed:`, error);
        throw error;
      }
    }

    logger.info('All migrations completed successfully');
  }

  async rollback(targetVersion) {
    const Migration = this.getMigrationModel();
    
    // Get all applied migrations greater than target version
    const migrationsToRollback = await Migration.find({ 
      version: { $gt: targetVersion } 
    }).sort({ version: -1 });

    for (const migrationRecord of migrationsToRollback) {
      const migration = this.migrations.find(m => m.version === migrationRecord.version);
      
      if (!migration) {
        logger.warn(`Migration ${migrationRecord.version} not found in current migrations, skipping rollback`);
        continue;
      }

      if (!migration.down) {
        logger.warn(`Migration ${migrationRecord.version} has no rollback function, skipping`);
        continue;
      }

      try {
        logger.info(`Rolling back migration ${migration.version}: ${migration.description}`);
        await migration.down();
        
        // Remove migration record
        await Migration.deleteOne({ version: migration.version });
        
        logger.info(`Migration ${migration.version} rolled back successfully`);
      } catch (error) {
        logger.error(`Rollback of migration ${migration.version} failed:`, error);
        throw error;
      }
    }

    logger.info(`Rollback to version ${targetVersion} completed successfully`);
  }

  getMigrationModel() {
    const migrationSchema = new mongoose.Schema({
      version: { type: Number, required: true, unique: true },
      description: { type: String, required: true },
      appliedAt: { type: Date, required: true }
    });

    return mongoose.model('Migration', migrationSchema);
  }
}

module.exports = MigrationRunner;