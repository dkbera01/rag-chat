import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();
const router = express.Router();
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    const { systemPrompt, userPrompt } = req.body;

    console.log('systemPrompt', systemPrompt);
    console.log('userPrompt', userPrompt);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    console.log('response',response);
    

    res.json({
      text: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
