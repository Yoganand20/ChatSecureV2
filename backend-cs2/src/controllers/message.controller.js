
export const getPendingMessages =  async (req, res) => {
    try {
        const userId = req.session.user.id; // Adjust based on your auth system
        
        // Fetch undelivered messages
        const undeliveredMessages = await Message.find({
            receiverId: userId,
            isDelivered: false
        }).sort({ sentTime: 1 }).lean(); // Chronological order

        // Fetch undelivered keys
        const undeliveredKeys = await ChatKey.find({
            receiverId: userId
        }).lean();

        // Mark messages as delivered and update TTL
        if (undeliveredMessages.length > 0) {
            const messageIds = undeliveredMessages.map(msg => msg._id);
            await Message.updateMany(
                { _id: { $in: messageIds } },
                { 
                    isDelivered: true,
                    deliveredTime: new Date(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day TTL
                }
            );
        }

        // Delete delivered keys
        if (undeliveredKeys.length > 0) {
            const keyIds = undeliveredKeys.map(key => key._id);
            await ChatKey.deleteMany({ _id: { $in: keyIds } });
        }

        res.json({
            success: true,
            data: {
                messages: undeliveredMessages,
                keys: undeliveredKeys
            },
            meta: {
                messageCount: undeliveredMessages.length,
                keyCount: undeliveredKeys.length
            }
        });

    } catch (error) {
        console.error('Error fetching undelivered messages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch undelivered messages'
        });
    }
}


// PATCH /messages/:messageId/delivered
export const markMessageDelivered = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;
        
        const message = await Message.findOneAndUpdate(
            { 
                _id: messageId, 
                receiverId: userId,
                isDelivered: false 
            },
            { 
                isDelivered: true,
                deliveredTime: new Date(),
                expiresAt: new Date(Date.now() + 30000) // Delete after 30 seconds
            },
            { new: true }
        );
        
        if (!message) {
            return res.status(404).json({ error: 'Message not found or already delivered' });
        }
        
        res.json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};



