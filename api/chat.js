import { buildSystemPrompt } from "../backend/lib/systemPrompt.js";

export default async function handler(req, res) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "Server configuration error",
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const { message, context } = req.body;

    const Groq = (await import("groq-sdk")).default;

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(context),
        },
        {
          role: "user",
          content: message,
        },
      ],

      // ✅ FIXED MODEL
      model: "llama-3.1-8b-instant",
    });

    return res.status(200).json({
      reply: response.choices[0].message.content,
    });

  } catch (error) {
    console.error("FULL ERROR:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
}
