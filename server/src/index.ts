import express from "express";
import cors from "cors";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import rateLimit from "express-rate-limit";
import googleRoutes from "./auth/google.routes.js";
import localRoutes from "./auth/local.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import { optionalAuth } from "./middleware/auth.middleware.js";
import { configureGoogleStrategy } from "./auth/google.strategy.js";
import passport from "passport";
import getPrisma from "./lib/prisma.js";

const app = express();
app.use(express.json());
configureGoogleStrategy();
app.use(passport.initialize());

const prisma = getPrisma();

const allowedOrigins = ["http://localhost:4200", "https://chat-service-murex.vercel.app"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use("/api/auth", localRoutes);
app.use("/api", googleRoutes);
app.use("/api", conversationRoutes);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt: ChatCompletionMessageParam = {
  role: "system",
  content: "You are a helpful AI assistant. Eliminate filler and emojis from answers. Prioritise directive phrasing. Always be friendly."
};

const guestConversations: Map<string, ChatCompletionMessageParam[]> = new Map();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests, please slow down." }
});

app.use(limiter);

app.get("/", (req, res) => {
  res.send("Server is running successfully");
});

async function generateTitle(firstMessage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Generate a short, concise title (max 6 words) for a conversation that starts with this message. Only respond with the title, nothing else."
        },
        {
          role: "user",
          content: firstMessage
        }
      ],
      max_tokens: 20
    });

    return response.choices[0]?.message?.content?.trim() || "New Chat";
  } catch (err) {
    console.error('Error generating title:', err);
    return "New Chat";
  }
}

app.post("/api/chat", optionalAuth, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const user = (req as any).user;
    const isGuest = (req as any).isGuest;

    if (!message) {
      return res.status(400).json({ error: "Error: Text box cannot be empty" });
    }

    let conversationHistory: ChatCompletionMessageParam[] = [];
    let newConversationId: number | undefined = conversationId;

    if (isGuest) {
      if (!guestConversations.has('guest')) {
        guestConversations.set('guest', []);
      }
      conversationHistory = guestConversations.get('guest')!;
    } else {
      if (conversationId) {
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            userId: user.id
          },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' }
            }
          }
        });

        if (conversation) {
          interface MessageType {
            role: string;
            content: string;
          }
          conversationHistory = conversation.messages.map((msg: MessageType) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          }));
        }
      } else {
        const title = await generateTitle(message);
        const newConversation = await prisma.conversation.create({
          data: {
            userId: user.id,
            title
          }
        });
        newConversationId = newConversation.id;
      }
    }

    conversationHistory.push({ role: "user", content: message });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        systemPrompt,
        ...conversationHistory,
      ],
    });

    const reply = response.choices[0]?.message?.content || "No response";

    conversationHistory.push({ role: "assistant", content: reply });

    if (!isGuest && newConversationId) {
      await prisma.message.createMany({
        data: [
          {
            conversationId: newConversationId,
            role: 'user',
            content: message
          },
          {
            conversationId: newConversationId,
            role: 'assistant',
            content: reply
          }
        ]
      });

      await prisma.conversation.update({
        where: { id: newConversationId },
        data: { updatedAt: new Date() }
      });
    }

    res.json({
      reply,
      conversationId: newConversationId,
      isGuest,
      message: isGuest ? "Conversations are not saved for guest users. Log in to save your chats!" : undefined
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unknown error occurred" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;