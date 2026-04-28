export default async function handler(req, res) {
  try {
    // ✅ Check API key
    if (!process.env.GROQ_API_KEY) {
      console.log("Missing GROQ_API_KEY ❌");
      return res.status(500).json({
        error: "Server configuration error",
      });
    }

    // ✅ Method check
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    // ✅ Parse body
    const { message } = req.body;
    console.log("Message:", message);

    // ✅ Dynamic import (fix)
    const Groq = (await import("groq-sdk")).default;

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    console.log("Calling Groq API...");

    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: message }],
      model: "llama3-8b-8192",
    });

    console.log("Groq success ✅");

    return res.status(200).json({
      reply: response.choices[0].message.content,
    });

  } catch (error) {
    console.error("FULL ERROR:", error);

    return res.status(500).json({
      error: error.message, // 👈 show real error
    });
  }
}