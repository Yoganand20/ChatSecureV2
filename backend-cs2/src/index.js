import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app, httpServer } from "./lib/socket.io.js";
import Database from "./lib/database.js";

import authRouter from "./routes/auth.router.js";
import devRouter from "./routes/dev.router.js";
import userRoutes from "./routes/user.router.js";
import messageRoutes from "./routes/message.router.js";
import chatRoutes from "./routes/chat.router.js";
// Connect to database
Database.connect();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
    cors({
        origin: ["http://localhost:5173"],
        credentials: true,
        exposedHeaders: "X-Access-Token",
    })
);

app.use("/api/auth", authRouter);
app.use("/api/user", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chat", chatRoutes);

// Development routes
if (process.env.NODE_ENV !== "production") {
    app.use("/api/dev", devRouter);
}

app.get("/health", (req, res) => {
    console.log("OK");
    res.json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
    });
});

app.all("/{*any}", (req, res) => {
    console.log()
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

app.use((error, req, res, next) => {
    console.error("Global error handler:", error);

    res.status(error.status || 500).json({
        success: false,
        message:
            process.env.NODE_ENV === "production"
                ? "Internal server error"
                : error.message,
        ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
    });
});

const PORT = process.env.PORT || 5005;

httpServer.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});
