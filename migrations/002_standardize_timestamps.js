const mongoose = require('mongoose');

module.exports = {
  version: 2,
  description: 'Standardize timestamp fields across all collections',
  
  async up() {
    const db = mongoose.connection.db;
    
    // Update branches to use standard timestamps
    await db.collection('branches').updateMany(
      { createdAt: { $exists: true }, updatedAt: { $exists: false } },
      { 
        $set: { updatedAt: new Date() },
        $rename: { createdAt: 'createdAt' }
      }
    );
    
    // Update operators to standardize timestamps
    await db.collection('operators').updateMany(
      { updatedAt: { $exists: false } },
      { $set: { updatedAt: new Date() } }
    );
    
    // Ensure all collections have proper timestamp fields
    const collections = ['users', 'bookings', 'vehicles', 'transactions', 'cashtransfers', 'roles'];
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      
      // Add updatedAt field where missing
      await collection.updateMany(
        { updatedAt: { $exists: false } },
        { $set: { updatedAt: new Date() } }
      );
      
      // Add createdAt field where missing (use _id timestamp as fallback)
      const docs = await collection.find({ createdAt: { $exists: false } }).toArray();
      
      for (const doc of docs) {
        const createdAt = doc._id.getTimestamp();
        await collection.updateOne(
          { _id: doc._id },
          { $set: { createdAt } }
        );
      }
    }
    
    console.log('Timestamp standardization completed successfully');
  },
  
  async down() {
    // This migration doesn't need rollback as it only adds missing fields
    // and doesn't remove any existing data
    console.log('Timestamp standardization rollback - no action needed');
  }
};