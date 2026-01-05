import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  timezone: {
    type: String,
    default: 'America/New_York'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Profile', profileSchema);