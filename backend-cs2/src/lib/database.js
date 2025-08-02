// lib/database.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Database utility library providing MongoDB connection and management functions
 */
export class Database {
    static connection = null;
    static isConnected = false;

    static async connect() {
        try {
            if (this.isConnected) {
                console.log("Already connected to MongoDB");
                return this.connection;
            }

            console.log("Connecting to MongoDB");
            const conn = await mongoose.connect(process.env.MONGODB_URI);

            this.connection = conn.connection;
            this.isConnected = true;

            console.log(`MongoDB connected: ${conn.connection.host}`);

            // Set up connection event listeners
            this.setupEventListeners();

            return conn.connection;
        } catch (error) {
            console.error("MongoDB connection error:", error);
            this.isConnected = false;
            throw error;
        }
    }

    static async disconnect() {
        try {
            if (this.isConnected) {
                await mongoose.disconnect();
                this.isConnected = false;
                this.connection = null;
                console.log("MongoDB disconnected successfully");
            }
        } catch (error) {
            console.error("MongoDB disconnection error:", error);
            throw error;
        }
    }

    static getConnectionStatus() {
        return this.isConnected && mongoose.connection.readyState === 1;
    }

    static getDatabaseName() {
        return this.connection ? this.connection.name : null;
    }

    static getConnectionInfo() {
        if (!this.connection) {
            return { connected: false, host: null, database: null };
        }

        return {
            connected: this.isConnected,
            host: this.connection.host,
            database: this.connection.name,
            readyState: mongoose.connection.readyState,
            readyStateText: this.getReadyStateText(
                mongoose.connection.readyState
            ),
        };
    }

    static setupEventListeners() {
        mongoose.connection.on("connected", () => {
            console.log("Mongoose connected to MongoDB");
        });

        mongoose.connection.on("error", (err) => {
            console.error("Mongoose connection error:", err);
            this.isConnected = false;
        });

        mongoose.connection.on("disconnected", () => {
            console.log("Mongoose disconnected from MongoDB");
            this.isConnected = false;
        });

        // Handle application termination
        process.on("SIGINT", async () => {
            await this.disconnect();
            process.exit(0);
        });
    }

    static getReadyStateText(state) {
        const states = {
            0: "disconnected",
            1: "connected",
            2: "connecting",
            3: "disconnecting",
        };
        return states[state] || "unknown";
    }

    static async testConnection() {
        try {
            await mongoose.connection.db.admin().ping();
            return true;
        } catch (error) {
            console.error("Database ping failed:", error);
            return false;
        }
    }

    static async dropDatabase() {
        try {
            if (!this.isConnected) {
                throw new Error("Not connected to database");
            }

            await mongoose.connection.db.dropDatabase();
            console.log("Database dropped successfully");
        } catch (error) {
            console.error("Error dropping database:", error);
            throw error;
        }
    }

    static async getCollections() {
        try {
            if (!this.isConnected) {
                throw new Error("Not connected to database");
            }

            const collections = await mongoose.connection.db
                .listCollections()
                .toArray();
            return collections.map((col) => col.name);
        } catch (error) {
            console.error("Error getting collections:", error);
            throw error;
        }
    }

    static async clearCollection(collectionName) {
        try {
            if (!this.isConnected) {
                throw new Error("Not connected to database");
            }

            await mongoose.connection.db
                .collection(collectionName)
                .deleteMany({});
            console.log(`Collection '${collectionName}' cleared successfully`);
        } catch (error) {
            console.error(
                `Error clearing collection '${collectionName}':`,
                error
            );
            throw error;
        }
    }

    static async deleteAllCollections() {
        try {
            if (!this.isConnected) {
                throw new Error("Not connected to database");
            }

            // Get list of all collections
            const collections = await this.getCollections();

            if (collections.length === 0) {
                return {
                    success: true,
                    message: "No collections found to delete",
                    deletedCollections: [],
                };
            }

            const deletedCollections = [];

            // Delete each collection
            for (const collectionName of collections) {
                try {
                    await mongoose.connection.db
                        .collection(collectionName)
                        .drop();
                    deletedCollections.push(collectionName);
                    console.log(
                        `Collection '${collectionName}' deleted successfully`
                    );
                } catch (error) {
                    console.error(
                        `Error deleting collection '${collectionName}':`,
                        error
                    );
                    // Continue with other collections even if one fails
                }
            }

            return {
                success: true,
                message: `Successfully deleted ${deletedCollections.length} collections`,
                deletedCollections,
                totalCollections: collections.length,
            };
        } catch (error) {
            console.error("Error deleting all collections:", error);
            throw error;
        }
    }

    static async resetDatabase(recreateIndexes = false) {
        try {
            const result = await this.deleteAllCollections();

            if (recreateIndexes) {
                // You can add logic here to recreate essential indexes
                console.log("Recreating indexes...");
                // Example: await this.createEssentialIndexes();
            }

            return {
                ...result,
                message: "Database reset completed successfully",
                indexesRecreated: recreateIndexes,
            };
        } catch (error) {
            console.error("Error resetting database:", error);
            throw error;
        }
    }
}

// Export individual methods for convenience
export const {
    connect,
    disconnect,
    getConnectionStatus,
    getDatabaseName,
    getConnectionInfo,
    testConnection,
    dropDatabase,
    getCollections,
    clearCollection,
} = Database;

// Default export
export default Database;
