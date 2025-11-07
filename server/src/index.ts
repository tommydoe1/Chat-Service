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

interface GuestConversation {
  messages: ChatCompletionMessageParam[];
  model: string;
}

const guestConversations: Map<string, GuestConversation> = new Map();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests, please slow down." }
});

app.use(limiter);

app.get("/", (req, res) => {
  res.send("Server is running successfully");
});

const SUPPORTED_MODELS = {
  'gpt-4o-mini': 'GPT-4o Mini',
  'llama3': 'Llama 3',
  'gemini': 'Gemini 2.0 Flash'
};

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

async function runGPT(messages: ChatCompletionMessageParam[], modelName: string = 'gpt-4o-mini'): Promise<string> {
  try {
    console.log(`Calling OpenAI GPT with model: ${modelName}`);
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: messages,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in GPT response');
    }
    
    return content;
  } catch (error) {
    console.error('GPT API Error:', error);
    throw new Error(`GPT API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function runLlama3(messages: ChatCompletionMessageParam[]): Promise<string> {
  try {
    console.log('Calling Groq Llama3 API');
    
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured');
    }
    
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: messages,
      }),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Groq API returned ${res.status}: ${errorText}`);
    }
    
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in Llama3 response');
    }
    
    return content;
  } catch (error) {
    console.error('Llama3 API Error:', error);
    throw new Error(`Llama3 API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function runGemini(messages: ChatCompletionMessageParam[]): Promise<string> {
  try {
    console.log('Calling Google Gemini API');
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    
    const systemMessage = messages.find(msg => msg.role === 'system');
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    
    const geminiMessages = conversationMessages.map(msg => ({
      parts: [{ text: msg.content }],
      role: msg.role === 'assistant' ? 'model' : 'user'
    }));

    const requestBody: any = {
      contents: geminiMessages
    };

    if (systemMessage) {
      requestBody.systemInstruction = {
        parts: [{ text: systemMessage.content }]
      };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini API returned ${res.status}: ${errorText}`);
    }
    
    const data = await res.json();
    
    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      console.error('Unexpected Gemini response structure:', JSON.stringify(data, null, 2));
      throw new Error('No content in Gemini response');
    }
    
    return content;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(`Gemini API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function getModelResponse(model: string, messages: ChatCompletionMessageParam[]): Promise<string> {
  console.log(`Getting response from model: ${model}`);
  
  switch (model) {
    case 'llama3':
      return await runLlama3(messages);
    
    case 'gemini':
      return await runGemini(messages);
    
    case 'gpt-4o-mini':
    default:
      return await runGPT(messages, 'gpt-4o-mini');
  }
}

app.post("/api/chat", optionalAuth, async (req, res) => {
  try {
    const { message, conversationId, model = "gpt-4o-mini" } = req.body;
    const user = (req as any).user;
    const isGuest = (req as any).isGuest;

    if (!message) {
      return res.status(400).json({ error: "Error: Text box cannot be empty" });
    }

    if (!Object.keys(SUPPORTED_MODELS).includes(model)) {
      return res.status(400).json({ error: "Invalid model selected" });
    }

    let conversationHistory: ChatCompletionMessageParam[] = [];
    let newConversationId: number | undefined = conversationId;
    let conversationModel = model;

    if (isGuest) {
      if (!guestConversations.has('guest')) {
        guestConversations.set('guest', {
          messages: [],
          model: model
        });
      }
      const guestConv = guestConversations.get('guest')!;
      conversationHistory = guestConv.messages;
      if (conversationHistory.length > 0 && !req.body.model) {
        conversationModel = guestConv.model;
      } else {
        guestConv.model = model;
      }
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
          conversationModel = conversation.model;
        }
      } else {
        const title = await generateTitle(message);
        const newConversation = await prisma.conversation.create({
          data: {
            userId: user.id,
            title,
            model: model
          }
        });
        newConversationId = newConversation.id;
        conversationModel = model;
      }
    }

    conversationHistory.push({ role: "user", content: message });

    const messagesToSend: ChatCompletionMessageParam[] = [
      systemPrompt,
      ...conversationHistory,
    ];

    console.log(`Using model: ${conversationModel}`);
    let reply: string;
    
    try {
      reply = await getModelResponse(conversationModel, messagesToSend);
      console.log(`Response received from ${conversationModel}`);
    } catch (modelError) {
      console.error(`Error calling ${conversationModel}:`, modelError);
      return res.status(500).json({ 
        error: `Failed to get response from ${SUPPORTED_MODELS[conversationModel as keyof typeof SUPPORTED_MODELS]}`,
        details: modelError instanceof Error ? modelError.message : 'Unknown error'
      });
    }

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
      model: conversationModel,
      isGuest,
      message: isGuest ? "Conversations are not saved for guest users. Log in to save your chats!" : undefined
    });
  } catch (err) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ 
      error: "Unknown error occurred",
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;