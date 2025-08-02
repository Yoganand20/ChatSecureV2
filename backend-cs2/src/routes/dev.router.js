import express from "express";
import {
    deleteAllCollections,
    getDatabaseStats,
} from "../controllers/devController.js";

const devRouter = express.Router();

devRouter.get("/database/stats", getDatabaseStats);
devRouter.delete("/database/all-collections", deleteAllCollections);

export default devRouter;
