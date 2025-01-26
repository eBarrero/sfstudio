import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Define the Session schema
const SessionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sfUser: {
    type: Schema.Types.ObjectId,
    ref: 'SFUser',
    required: true,
  },
  loginTime: {
    type: Date,
    default: Date.now,
  },
  logoutTime: {
    type: Date,
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
});

export default  mongoose.model('Session', SessionSchema);
