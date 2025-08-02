import User from "../models/user.model.js";
import mongoose from "mongoose";
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        // Only return public information (never include password)
        const user = await User.findById(id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const getMe = async (req, res) => {
    try {
        // req.user should be set by authentication middleware
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }

};

export const searchUsers = async (req, res) => {
    try {
        const { partialUserName } = req.body;
        
        // Validate input
        if (!partialUserName || typeof partialUserName !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'partialUserName is required and must be a string'
            });
        }

        // Sanitize and validate search term
        const searchTerm = partialUserName.trim();
        if (searchTerm.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search term must be at least 2 characters long'
            });
        }

        if (searchTerm.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Search term must be less than 50 characters'
            });
        }

        // Get current user ID from authentication middleware
        const currentUserId = req.user.id;

        // Search for users (case-insensitive, partial match)
        const users = await User.find({
            _id: { $ne: currentUserId }, // Exclude current user
            username: { 
                $regex: searchTerm, 
                $options: 'i' // Case-insensitive
            }
        })
        .select('username profilePic') // Only return necessary fields
        .limit(10) // Limit results to 10 users
        .lean(); // Return plain objects for better performance

        res.json({
            success: true,
            data: users,
            count: users.length
        });

    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const getUsersByIds = async (req, res) => {
    try {
        const { userIds } = req.body;

        // Basic validation
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "userIds must be a non-empty array",
            });
        }

        // Limit bulk requests
        if (userIds.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Cannot request more than 100 users at once",
            });
        }

        // Validate ObjectIds
        const validIds = userIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        
        if (validIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid user IDs provided",
            });
        }

        // Fetch users
        const users = await User.find({
            _id: { $in: validIds }
        }).select("-password");

        res.json({
            success: true,
            data: users,
        });

    } catch (error) {
        console.error("Get users bulk error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

