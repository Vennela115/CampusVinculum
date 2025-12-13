import mongoose from 'mongoose';

const liveSessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  host: { type: String, required: true }, // Username of the teacher/admin
  scheduledAt: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['scheduled', 'live', 'ended'], 
    default: 'scheduled' 
  },
  participants: [{ type: String }], // Array of usernames who joined
}, { timestamps: true });

const LiveSession = mongoose.model('LiveSession', liveSessionSchema);

export default LiveSession;