import OpenAI from 'openai';

// Validate API key exists
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// Log warning if missing (for debugging)
if (!GROQ_API_KEY) {
  console.warn('⚠️ Missing VITE_GROQ_API_KEY in .env file. AI features will use mock responses.');
}

// Initialize Groq client (OpenAI-compatible)
const client = GROQ_API_KEY ? new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  dangerouslyAllowBrowser: true, // Required for browser usage
}) : null;

// Valid Groq models (use these exact names)
const GROQ_MODELS = {
  FAST: "llama-3.1-8b-instant",      // Fastest, good for simple tasks
  BALANCED: "llama-3.3-70b-versatile", // Best quality, slightly slower
  LARGE: "mixtral-8x7b-32768",        // Large context window
};

/**
 * Get AI insight from Groq or fallback to mock
 */
export async function getAIInsight(prompt, options = {}) {
  const { model = GROQ_MODELS.BALANCED, maxTokens = 500, temperature = 0.7 } = options;

  // Fallback to mock if no API key
  if (!client) {
    console.log('Using mock response (no API key)');
    return getMockInsight(prompt);
  }

  try {
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are a data analyst assistant. Analyze the provided data and give concise, actionable insights in 3-4 bullet points. 
          Use **bold** for key metrics. Be specific, data-driven, and professional. Keep responses under 500 words.`
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature: temperature,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('Empty response from Groq API');
    }

    return response;

  } catch (error) {
    console.error('Groq API Error:', error);

    // Provide helpful error messages
    if (error.status === 401) {
      throw new Error('Invalid API key. Please check your Groq API key in .env file.');
    }
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a few moments.');
    }
    if (error.message.includes('model')) {
      throw new Error(`Model error: ${error.message}. Using fallback response.`);
    }

    throw new Error(`Groq API error: ${error.message}`);
  }
}

/**
 * Mock AI response for development (no API key needed)
 */
function getMockInsight(prompt) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate context-aware mock responses
      if (prompt.toLowerCase().includes('revenue') || prompt.toLowerCase().includes('q1')) {
        resolve(`• **Revenue Growth**: Your data shows a **+37% increase** from Q1 ($42k) to Q4 ($67k), with a slight dip in Q2 ($38k) followed by strong recovery.

• **Seasonal Pattern**: Q2 weakness suggests mid-year seasonality. Consider launching targeted promotions in Q2 to flatten the curve.

• **Actionable Insight**: Focus retention efforts on Q2 next year—your best customers are most at risk during this period.

• **Forecast**: If current momentum continues, projected Q1 next year: **$72k-$78k**.`);
      }
      else if (prompt.toLowerCase().includes('churn')) {
        resolve(`• **Churn Alert**: Churn increased from **5% to 8%** month-over-month, representing a **60% increase** in customer loss.

• **Likely Causes**: Recent pricing changes, onboarding gaps, or competitor activity. Recommend immediate customer interviews.

• **High-Risk Segments**: Analyze usage data for users with declining activity over 14+ days.

• **Recommended Action**: Launch win-back campaign with personalized offers for at-risk segments within 48 hours.`);
      }
      else if (prompt.toLowerCase().includes('campaign')) {
        resolve(`• **Campaign Comparison**: Campaign A ($2 CPC, 2% conversion) vs Campaign B ($1.5 CPC, 1.2% conversion).

• **Cost Efficiency**: Campaign B has **25% lower CPA** despite lower conversion rate ($125 vs $100 per conversion).

• **Volume Impact**: Campaign B drove **60% more clicks** (8,000 vs 5,000) at only 25% higher total spend.

• **Recommendation**: Shift 70% budget to Campaign B, optimize Campaign A creative to improve conversion rate.`);
      }
      else {
        resolve(`• **Data Summary**: Analysis of your data shows **3 key patterns** emerging across your metrics.

• **Top Priority**: The segment contributing **42%** of your results shows signs of plateauing. New initiatives needed.

• **Quick Win**: Two underperforming areas can be improved with **minimal effort** for estimated **15-20% gain**.

• **Recommendation**: Run an A/B test on your highest-volume variable to validate these findings.`);
      }
    }, 1200);
  });
}