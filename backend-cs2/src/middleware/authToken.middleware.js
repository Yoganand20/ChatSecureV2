import User from '../models/user.model.js';
import { verifyAccessToken } from '../utils/generateJWT.js';

export async function authenticateToken(req, res, next) {
    try {
        // 1. Extract token from X-Access-Token header (matching your TokenDeliveryService)
        const token = req.headers['x-access-token'] || req.headers['X-Access-Token'];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token required",
            });
        }

        // 2. Verify token
        let decoded;
        try {
            decoded = verifyAccessToken(token);
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: error.message,
            });
        }

        // 3. Verify user still exists
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(403).json({
                success: false,
                message: "User not found",
            });
        }
        // 4. Attach user info to request
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            userDoc: user,
        };

        next();
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}
