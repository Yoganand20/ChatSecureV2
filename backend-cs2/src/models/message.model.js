import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
            index: true,
        },
        encryptedMessage: {
            type: String,
            required: true,
            maxlength: 1000,
        },
        messageType: {
            type: String,
            enum: ["text", "image", "file"],
            default: "text",
        },
        iv: {
            type: String,
        },
        sentTime: {
            type: Date,
            default: Date.now,
            index: true,
        },
        deliveredTime: {
            type: Date,
            default: null,
        },
        isDelivered: {
            type: Boolean,
            default: false,
            index: true,
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
            index: { expireAfterSeconds: 0 },

        },
    },
    {
        timestamps: true,
        writeConcern: { w: 1, j: false }, // Faster writes
        readConcern: { level: "local" }, // Faster reads      
    }
);

// Compound indexes for efficient queries
messageSchema.index({ chatId: 1, sentTime: -1 });
messageSchema.index({ receiverId: 1, isDelivered: 1 });
messageSchema.index({ isDelivered: 1, deliveredTime: 1 });
const Message = mongoose.model("Message", messageSchema);

export default Message;
