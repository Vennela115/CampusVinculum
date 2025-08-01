import mongoose from 'mongoose';

const clubMembershipSchema = new mongoose.Schema({
  clubID: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
  userID: String,
  role: { type: String, enum: ['Member', 'StudentCoordinator','FacultyCoordinator'] },
  joinDate: Date
});

export default mongoose.model('ClubMembership', clubMembershipSchema);
