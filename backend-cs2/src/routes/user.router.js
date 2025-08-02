import express from "express";
import { authenticateToken } from "../middleware/authToken.middleware.js";

import {
    getUserById,
    getUsersByIds,
    getMe,
    searchUsers,
} from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.post("/", authenticateToken, getUsersByIds);
userRouter.get("/:id", authenticateToken, getUserById);
userRouter.get("/me", authenticateToken, getMe);
userRouter.post("/search", authenticateToken, searchUsers);

export default userRouter; 
