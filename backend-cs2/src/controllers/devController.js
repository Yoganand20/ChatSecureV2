import Database from "../lib/database.js";

export const deleteAllCollections = async (req, res) => {
    try {
        // Environment check for safety
        if (process.env.NODE_ENV === "production") {
            return res.status(403).json({
                success: false,
                message:
                    "This operation is not allowed in production environment",
            });
        }

        // Check database connection
        if (!Database.getConnectionStatus()) {
            return res.status(500).json({
                success: false,
                message: "Database not connected",
            });
        }

        // Get database info before deletion
        const dbInfo = Database.getConnectionInfo();
        const collectionsBeforeDeletion = await Database.getCollections();

        console.log(
            `Deleting all collections from database: ${dbInfo.database}`
        );

        // Perform deletion
        const result = await Database.deleteAllCollections();

        res.json({
            success: true,
            message: "All collections deleted successfully",
            data: {
                database: dbInfo.database,
                collectionsBeforeDeletion,
                ...result,
            },
        });
    } catch (error) {
        console.error("Error in deleteAllCollections controller:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete collections",
            error: error.message,
        });
    }
};

export const getDatabaseStats = async (req, res) => {
    try {
        const connectionInfo = Database.getConnectionInfo();
        const collections = await Database.getCollections();

        res.json({
            success: true,
            data: {
                ...connectionInfo,
                collections,
                totalCollections: collections.length,
                environment: process.env.NODE_ENV || "development",
            },
        });
    } catch (error) {
        console.error("Error getting database stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get database statistics",
            error: error.message,
        });
    }
};
