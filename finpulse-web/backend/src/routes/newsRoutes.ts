import express from "express";
import { fetchNewsSentiment } from "../controllers/newsController.js";

const router = express.Router();

router.get("/sentiment", fetchNewsSentiment);

export default router;