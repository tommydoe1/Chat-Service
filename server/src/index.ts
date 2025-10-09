// import dotenv from "dotenv";
// dotenv.config();

import express from "express";
import cors from "cors";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import rateLimit from "express-rate-limit";
import googleRoutes from "./auth/google.routes.js";
import localRoutes from "./auth/local.routes.js";
import { authenticateJWT } from "./middleware/auth.middleware.js";
import { configureGoogleStrategy } from "./auth/google.strategy.js";
import passport from "passport";

const app = express();
app.use(express.json());
// configureGoogleStrategy();
// app.use(passport.initialize());

const allowedOrigins = ["http://localhost:4200", "https://chat-service-murex.vercel.app"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use("/api/auth", localRoutes);
// app.use("/api", googleRoutes);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

const systemPrompt: ChatCompletionMessageParam  = {
    role: "system",
    content: "You are a helpful AI assistant. Eliminate filler and emojis from answers. Prioritise directive phrasing. Always be friendly."
  };
  
let conversationHistory: ChatCompletionMessageParam[] = [];

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Too many requests, please slow down." }
});

app.use(limiter);

app.get("/", (req, res) => {
  res.send("Server is running successfully");
});

app.post("/chat", async (req, res) => {
    try {
      const { message } = req.body;
  
      if (!message) {
        return res.status(400).json({ error: "Error: Text box cannot be empty" });
      }

      conversationHistory.push({ role: "user", content: message });
  
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            systemPrompt,
            ...conversationHistory,
            { role: "user", content: message }
        ],
      });
  
      const reply = response.choices[0]?.message?.content || "No response";

      conversationHistory.push({ role: "assistant", content: reply });
  
      res.json({ reply });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Unknown error occured" });
    }
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;