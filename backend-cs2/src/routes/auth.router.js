import express from "express";
import { body } from "express-validator";
import {
    signup,
    login,
    logout,
    regenAccessToken,
    regenRefreshToken,
    getProfile,
    checkAuth,
} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/authToken.middleware.js";
const authRouter = express.Router();

// Validation middleware
const validateSignup = [
    body("username")
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage("Username must be between 3 and 30 characters")
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage(
            "Username can only contain letters, numbers, and underscores"
        ),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
];

const validateLogin = [
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
];

// Routes
authRouter.post("/signup", validateSignup, signup);
authRouter.post("/login", validateLogin, login);
authRouter.post("/logout", logout);
authRouter.post("/regen-r-token", regenRefreshToken);
authRouter.post("/regen-a-token", regenAccessToken);
authRouter.get("/profile", authenticateToken, getProfile);
authRouter.get("/checkAuth", authenticateToken, checkAuth);
export default authRouter;
