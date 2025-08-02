import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";
import Message from "../models/message.model.js";
import ChatKey from "../models/chatKey.model.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173"],
        credentials: true,
    },
});

const userSocketMap = {}; // userId:socketId

io.on("connection", async (socket) => {
    const { userId } = socket.handshake.auth;

    if (userId) {
        socket.join(userId);
        const existingSocket = userSocketMap[userId];
        if (existingSocket && existingSocket !== socket.id) {
            console.log(
                `User ${userId} had existing socket ${existingSocket}, replacing with ${socket.id}`
            );
        }
        userSocketMap[userId] = socket.id;
        console.log("A user connected: ", userId);
    } else {
        socket.disconnect();
        return;
    }

    socket.on("send-public-key", async ({ to, publicKey }, cb) => {
        try {
            const existing = await ChatKey.findOne({
                senderId: userId,
                receiverId: to,
            });

            if (existing) {
                // Compare existing publicKey array with new publicKey array
                const existingKey = existing.publicKey; // assume stored as array of numbers
                const newKey = publicKey;

                // Simple byte-wise comparison assuming both are arrays of numbers
                const isSameKey =
                    existingKey.length === newKey.length &&
                    existingKey.every((byte, idx) => byte === newKey[idx]);

                if (isSameKey) {
                    console.log(
                        `Duplicate public key from ${userId} to ${to} detected.`
                    );
                    return cb?.("duplicate");
                } else {
                    existing.publicKey = publicKey;
                    existing.updatedAt = new Date();
                    await existing.save();
                    console.warn(
                        `Conflicting public key from ${userId} to ${to}; existing key differs.`
                    );
                    return cb?.("error: conflicting public key already stored");
                }
            }

            const ack = await emitWithAck(to, "receive-public-key", {
                from: userId,
                publicKey,
            });
            console.log("ack", ack);
            if (ack !== "received") {
                const keyDoc = await ChatKey.create({
                    senderId: userId,
                    receiverId: to,
                    publicKey,
                });
                cb?.("stored");
            }
            cb?.(ack);
        } catch (e) {
            console.error("Send public key error:", e);
            cb?.(e.message || "Failed to send key");
        }
    });

    // Encrypted message sending
    socket.on("send-encrypted", async (payload, cb) => {
        try {
            const messageData = {
                senderId: userId,
                receiverId: payload.receiverId,
                chatId: payload.chatId,
                encryptedMessage: payload.encryptedMessage,
                messageType: payload.messageType || "text",
                iv: payload.iv || "",
            };
            const msgDoc = await Message.create(messageData);

            const responseMessage = {
                _id: msgDoc._id,
                senderId: msgDoc.senderId,
                receiverId: msgDoc.receiverId,
                chatId: msgDoc.chatId,
                encryptedMessage: msgDoc.encryptedMessage,
                messageType: msgDoc.messageType,
                iv: msgDoc.iv,
                sentTime: msgDoc.sentTime,
                isDelivered: false,
            };

            // Acknowledge to sender first
            cb(responseMessage);

            // Attempt immediate delivery to receiver using the helper function
            const delivered = await emitWithAck(
                payload.receiverId,
                "receive-encrypted",
                responseMessage
            );

            if (delivered) {
                // Mark as delivered and reduce TTL
                await Message.updateOne(
                    { _id: msgDoc._id },
                    {
                        isDelivered: true,
                        deliveredTime: new Date(),
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
                    }
                );
                console.log(`Message ${msgDoc._id} delivered immediately`);
            } else {
                console.log(
                    `Message ${msgDoc._id} delivery failed or receiver offline, will be queued`
                );
            }
        } catch (error) {
            console.error("Send encrypted error:", error);
            cb(error.message || "Failed to send message");
        }
    });
    socket.on("message-received", async (data) => {
        try {
            const { messageId, receivedAt } = data;

            const result = await Message.updateOne(
                { _id: messageId, isDelivered: false },
                {
                    isDelivered: true,
                    deliveredTime: receivedAt || new Date(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
                }
            );

            console.log(
                `Message ${messageId} marked as delivered:`,
                result.modifiedCount > 0
            );
        } catch (error) {
            console.error("Error handling message receipt:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected: ", socket.id);
        if (userId) delete userSocketMap[userId];
    });
});

async function emitWithAck(receiverId, event, data) {
    const targetSocket = userSocketMap[receiverId];
    if (!targetSocket) return false; // User offline

    try {
        const result = await io
            .timeout(5000)
            .to(targetSocket)
            .emitWithAck(event, data);
        return true; // Successfully delivered
    } catch (error) {
        if (error.message.includes("timeout")) {
            console.log(
                `Timeout emitting ${event} to ${receiverId} after ${timeoutMs}ms`
            );
        } else {
            console.log(
                `Failed to emit ${event} to ${receiverId}:`,
                error.message
            );
        }
        return false;
    }
}
export function getSocketId(userId) {
    return userSocketMap[userId];
}
export { io, app, httpServer };
