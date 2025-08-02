import express from "express";
import { authenticateToken } from "../middleware/authToken.middleware.js";
import {
    getPendingMessages,
    markMessageDelivered,
} from "../controllers/message.controller.js";

const messageRouter = express.Router();

// GET /messages - Get all pending messages for authenticated user
messageRouter.get("/", authenticateToken, getPendingMessages);
messageRouter.get(
    "/:messageId/delivered",
    authenticateToken,
    markMessageDelivered
);

export default messageRouter;
