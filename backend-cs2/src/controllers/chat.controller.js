import User from "../models/user.model.js";
import Chat from "../models/chat.model.js";
import Joi from "joi";
import { Types as MongooseTypes } from "mongoose";
import Message from "../models/message.model.js"
import ChatKey from "../models/chatKey.model.js"
export const getChatById = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.userId;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ error: "Invalid chat ID" });
        }

        const chat = await Chat.findOne({ chatId }).populate("lastMessage");

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found",
            });
        }

        // Check if user is a member of the chat
        const isMember = chat.members.some(
            (member) => member._id.toString() === userId
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied",
            });
        }

        res.json({
            success: true,
            data: chat,
        });
    } catch (error) {
        console.error("Get chat error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const getUserChat = async (req, res) => {
    try {
        const userId = req.user.userId;

        const chats = await Chat.find({
            members: userId,
        }).populate("members", "-password")
        .sort({ lastActivity: -1 });            

        res.json({
            success: true,
            data: chats,
            count: chats.length,
        });
    } catch (error) {
        console.error("Get user chats error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export async function createChat(req, res) {
    try {
        const { chatName, memberIds = [], isGroup, profilePic } = req.body;
        const userId = req.user.userId;

        const allMembers = [...new Set([userId, ...memberIds])];
        await validateUserIds(allMembers, isGroup);

        if (!isGroup) {
            const [idA, idB] = allMembers;
            const existing = await Chat.findOne({
                isGroup: false,
                members: { $all: [idA, idB] },
                $expr: { $eq: [{ $size: "$members" }, 2] },
            }).populate("members", "username profilePic");

            if (existing) {
                console.log("Returning existing");
                return res.status(200).json({
                    success: true,
                    data: existing,
                    reused: true,
                });
            }
        }
        const chatData = {
            members: allMembers,
            isGroup,
            ...(isGroup && { chatName, profilePic, owner: userId }),
        };

        const { isValid, data, errors } = validateChatData(chatData);
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                    type: err.type,
                })),
            });
        }

        console.log(" Validation passed, creating chat...");

        const chat = await Chat.create(data);

        await chat.populate("members", "username profilePic");
        console.log(" Chat Created:", chat._id);

        res.status(201).json({
            success: true,
            data: chat,
            reused: false,
        });
    } catch (error) {
        console.error("Create chat error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}
export async function sendUndelivered(req, res){
    try {
        const userId = req.user?.userId; // Adjust based on your auth system
        
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

async function validateUserIds(userIds, isGroup) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error("userIds must be a non-empty array");
    }

    if (!isGroup && userIds.length !== 2) {
        throw new Error("Direct chat requires exactly two userIds");
    }

    if (isGroup && userIds.length < 2) {
        throw new Error("Group chat must include at least two distinct users");
    }

    if (new Set(userIds).size !== userIds.length) {
        throw new Error("Duplicate userIds are not allowed");
    }

    for (const id of userIds) {
        if (!MongooseTypes.ObjectId.isValid(id)) {
            throw new Error(`Invalid Mongo ObjectId → ${id}`);
        }
    }

    const count = await User.countDocuments({ _id: { $in: userIds } });
    if (count !== userIds.length) {
        throw new Error(
            "One or more userIds do not correspond to existing users"
        );
    }
}

function validateChatData(payload) {
    const chatSchema = Joi.object({
        chatName: Joi.string()
            .trim()
            .max(100)
            .when("isGroup", {
                is: true,
                then: Joi.required(),
                otherwise: Joi.forbidden(),
            })
            .messages({
                "any.required": "chatName required for group chats",
                "string.max": "chatName cannot exceed 100 characters",
                "any.unknown": "chatName not permitted for direct chats",
            }),

        // profilePic: Joi.string()
        //     .uri()
        //     .when("isGroup", {
        //         is: true,
        //         then: Joi.required(),
        //         otherwise: Joi.optional(),
        //     })
        //     .messages({
        //         "any.required": "profilePic required for group chats",
        //         "string.uri": "profilePic must be a valid URI",
        //     }),

        members: Joi.array()
            .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
            .min(2)
            .required()
            .messages({
                "array.base": "members must be an array",
                "array.min": "members must contain at least two users",
                "any.required": "members array is required",
                "string.pattern.base":
                    "each member must be a valid Mongo ObjectId",
            }),

        isGroup: Joi.boolean().required(),

        owner: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .when("isGroup", {
                is: true,
                then: Joi.required(),
                otherwise: Joi.forbidden(),
            })
            .messages({
                "any.required": "owner required for group chats",
                "string.pattern.base": "owner must be a valid Mongo ObjectId",
            }),
    });

    const { error, value } = chatSchema.validate(payload, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
    });

    return error
        ? { isValid: false, errors: error.details }
        : { isValid: true, data: value };
}
