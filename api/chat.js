import Groq from "groq-sdk";

export default async function handler(req, res) {
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      error: "Server configuration error",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: message }],
      model: "llama3-8b-8192",
    });

    return res.status(200).json({
      reply: response.choices[0].message.content,
    });

  } catch (error) {
    console.error("Groq Error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}