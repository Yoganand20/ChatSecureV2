import express from "express";
import { authenticateToken } from "../middleware/authToken.middleware.js";

import {
    createChat,
    getChatById,
    getUserChat,
    sendUndelivered,
} from "../controllers/chat.controller.js";

const chatRouter = express.Router();
chatRouter.get('/undelivered', authenticateToken,sendUndelivered)
chatRouter.get("/:chatId", authenticateToken, getChatById);
chatRouter.get("/", authenticateToken, getUserChat);
chatRouter.post("/", authenticateToken, createChat);
export default chatRouter;
