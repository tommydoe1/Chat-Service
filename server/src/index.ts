import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

app.get("/", (req, res) => {
  res.send("Server is running successfully");
});

app.post("/chat", async (req, res) => {
    try {
      const { message } = req.body;
  
      if (!message) {
        return res.status(400).json({ error: "Error: Text box cannot be empty" });
      }
  
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }],
      });
  
      const reply = response.choices[0]?.message?.content || "No response";
  
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
