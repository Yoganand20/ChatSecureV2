//import User from "../models/user.model.js";

import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import User from "../models/user.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import TokenDeliveryService from "../services/auth/TokenDelivery.Service.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from "../utils/generateJWT.js";


export async function signup(req, res) {
    console.log("Crating a new user");

    const { username, password } = req.body;
    try {
        const existing = await User.findOne({ username });

        if (existing)
            return res
                .status(400)
                .json({ success: false, message: "Username already exists" });

        const newUser = new User({
            username,
            password,
        });
        await newUser.save();

        console.log("User Created. Generating JWT tokens.");

        if (newUser) {
            const accessToken = generateAccessToken({
                userId: newUser._id,
                username: newUser.username,
            });
            const refreshToken = generateRefreshToken({
                userId: newUser._id,
            });
            await RefreshToken.deleteMany({ userId: newUser._id });
            
            await RefreshToken.create({
                userId: newUser._id,
                token: refreshToken,
            });

            TokenDeliveryService.setTokensSecurely(res,{accessToken,refreshToken});

            console.log("JWT token creted and saved successfully");

            res.status(201).json({
                success: true,
                message: "Signed up successfully",
                data: {
                    _id: newUser._id,        
                    username: newUser.username,
                    profilePic:newUser.profilePic
                },
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Invalid user data",
            });
        }
    } catch (error) {
        console.log("Error in signup controller", error.message);
        User.findOneAndDelete({ username: username });
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}

export async function login(req, res) {
    const { username, password, forcedLogin } = req.body;
    console.log("Attempting to login");
    console.log(username,password,forcedLogin);

    try {
        const user = await User.findOne({ username });
        if (!user)
            return res
                .status(401)
                .json({ success: false, message: "Invalid credentials" });

        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect)
            return res
                .status(401)
                .json({ success: false, message: "Invalid credentials" });

        const existingToken = await RefreshToken.findOne({ userId: user._id });
        if (existingToken && forcedLogin != "true") {
            return res.status(409).json({
                success: false,
                message:
                    "User is already logged in elsewhere. Logging in here will invalidate the previous session.",
            });
        }
        if (forcedLogin == "true") {
            console.log("User will be logged out of any existing session");
            await RefreshToken.deleteOne({ userId: user._id });
        }
        console.log("User authenticated. Generating JWT tokens.");
        const accessToken = generateAccessToken({
            userId: user._id,
            username: user.username,
        });
        const refreshToken = generateRefreshToken({
            userId: user._id,
        });

        // Persist new refresh token (single-token policy)
        await RefreshToken.deleteMany({ userId: user._id });
        await RefreshToken.create({ userId: user._id, token: refreshToken });

        TokenDeliveryService.setTokensSecurely(res,{accessToken,refreshToken});

        console.log("Tokens generated and saved successfully");

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            data: {
                _id: user._id,
                username: user.username,
                profilePic:user.profilePic
            },
        });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}

export async function logout(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token required",
            });
        }

        // Verify and decode refresh token
        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch (err) {
            // Token is invalid or expired — treat as already logged out
            return res.json({ success: true, message: "Logout successful" });
        }

        await RefreshToken.deleteOne({
            userId: payload.userId,
            token: refreshToken,
        });
        TokenDeliveryService.clearTokens(res);
        res.json({
            success: true,
            message: "Logout successful",
        });
    } catch (error) {
        console.error("Logout error:", error);
        //always success avoids leaking state and logout errors.
        res.json({
            success: true,
            message: "Logout successful",
        });
    }
}

export async function regenRefreshToken(req, res) {
    try {
        const oldRefreshToken = req.cookies.refreshToken;
        if (!oldRefreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token required",
            });
        }

        let payload;
        try {
            payload = verifyRefreshToken(oldRefreshToken);
        } catch (err) {
            // expired or invalid signature
            const msg =
                err.name === "TokenExpiredError"
                    ? "Refresh token expired"
                    : "Invalid refresh token";
            return res.status(403).json({ success: false, message: msg });
        }

        const userId = payload.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(403).json({
                success: false,
                message: "Invalid refresh token",
            });
        }

        const existing = await RefreshToken.findOne({
            userId,
            token: oldRefreshToken,
        });
        if (!existing) {
            return res.status(403).json({
                success: false,
                message: "Invalid refresh token",
            });
        }

        await RefreshToken.deleteOne({ userId, token: oldRefreshToken });

        const accessToken = generateAccessToken({
            userId,
            username: user.username,
        });
        const refreshToken = generateRefreshToken({ userId });

        await RefreshToken.create({ userId, token: refreshToken });

        TokenDeliveryService.setTokensSecurely(res,{accessToken,refreshToken});
        
        res.json({
            success: true,
            message: "Token refreshed successfully",
        });
    } catch (error) {
        console.error("Refresh token error:", error);
        res.status(403).json({
            success: false,
            message: "Invalid refresh token",
        });
    }
}

export async function regenAccessToken(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token required",
            });
        }

        // 1. Verify JWT signature & extract payload
        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch (err) {
            const msg =
                err.name === "TokenExpiredError"
                    ? "Refresh token expired"
                    : "Invalid refresh token";
            return res.status(403).json({ success: false, message: msg });
        }

        const userId = payload.userId;

        // 2. Confirm user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(403).json({
                success: false,
                message: "User not found",
            });
        }

        // 3. Confirm token exists in DB
        const existing = await RefreshToken.findOne({
            userId,
            token: refreshToken,
        });

        if (!existing) {
            return res.status(403).json({
                success: false,
                message: "Invalid refresh token",
            });
        }

        // 4. Generate new access token only
        const accessToken = generateAccessToken({
            userId: user._id,
            username: user.username,
        });

        TokenDeliveryService.setAccessTokenHeader(res,accessToken);

        // 5. Return new access token (refresh token remains unchanged)
        res.json({
            success: true,
            message: "Access token refreshed successfully",
        });
    } catch (error) {
        console.error("Refresh access token error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        res.json({
            success: true,
            message: "Profile retrieved successfully",
            data: {
                _id: user._id,
                username: user.username,
                profilePic: user.profilePic || "",
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const checkAuth = async (req, res) => {
    try {
        const user = req.user.userDoc;
        
        res.json({
            success: true,
            message: "User authenticated",
            data: {
                _id: user._id,
                username: user.username,
                profilePic: user.profilePic || "",
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        console.error("Check auth error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


