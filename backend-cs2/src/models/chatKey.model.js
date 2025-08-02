import mongoose from "mongoose";

const chatKeySchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  publicKey: {
    type: [Number],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
    index: { expireAfterSeconds: 0 },

},
});



const ChatKey = mongoose.model('ChatKey', chatKeySchema);

export default ChatKey;