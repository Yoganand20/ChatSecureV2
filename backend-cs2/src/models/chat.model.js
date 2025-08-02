import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
    {
        chatName: {
            type: String,
            required: function () {
                return this.isGroup; // Required only for group chats
            },
            trim: true,
            maxlength: 100,
        },
        profilePic: {
            type: String,
            required: function () {
                return this.isGroup;
            },
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: function () {
                return this.isGroup; // Required only for group chats
            },
        },
        isGroup: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    { timestamps: true }
);

// Indexes for efficient queries
chatSchema.index({ members: 1 });
chatSchema.index({ isGroup: 1 });
chatSchema.index({ lastActivity: -1 });

// Static method to create direct message chat
chatSchema.statics.createDirectMessageRoom = async function (user1Id, user2Id) {
    const sortedIds = [user1Id, user2Id].sort();

    // Check if chat already exists
    const existingChat = await this.findOne({
        members: { $all: sortedIds },
        isGroup: false,
    });

    if (existingChat) {
        return existingChat;
    }

    return await this.create({
        members: sortedIds,
        isGroup: false,
    });
};

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
