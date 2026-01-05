
import mongoose from 'mongoose';

const eventLogSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  changes: {
    type: Object,
    required: true
  },
  previousValues: {
    type: Object,
    required: true
  },
  newValues: {
    type: Object,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('EventLog', eventLogSchema);