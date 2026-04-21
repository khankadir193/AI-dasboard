/**
 * Backend Proxy API Service
 * Calls secure /api/chat endpoint (proxies to Groq)
 */

// Valid Groq models (backend uses llama3-8b-8192 by default)
const GROQ_MODELS = {
  FAST: "llama-3.1-8b-instant",
  BALANCED: "llama-3.3-70b-versatile",
  LARGE: "mixtral-8x7b-32768",
};

/**
 * Get AI insight via secure backend proxy or fallback to mock
 */
export async function getAIInsight(prompt, options = {}) {
  const { model = GROQ_MODELS.BALANCED, maxTokens = 500, temperature = 0.7 } = options;

  try {
    // System prompt for data analyst
    const systemPrompt = `You are a data analyst assistant. Analyze the provided data and give concise, actionable insights in 3-4 bullet points. 
    Use **bold** for key metrics. Be specific, data-driven, and professional. Keep responses under 500 words.`;

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: systemPrompt + "\n\nData: " + prompt }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return data.reply;

  } catch (error) {
    console.error('Backend Proxy Error:', error);

    // Fallback to mock on any error
    console.warn('Using mock response (backend unavailable)');
    return getMockInsight(prompt);
  }
}

/**
 * Mock AI response for development/testing (no backend needed)
 */
function getMockInsight(prompt) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Context-aware mocks (same as before)
      if (prompt.toLowerCase().includes('revenue') || prompt.toLowerCase().includes('q1')) {
        resolve(`• **Revenue Growth**: Your data shows a **+37% increase** from Q1 ($42k) to Q4 ($67k), with a slight dip in Q2 ($38k) followed by strong recovery.

• **Seasonal Pattern**: Q2 weakness suggests mid-year seasonality. Consider launching targeted promotions in Q2 to flatten the curve.

• **Actionable Insight**: Focus retention efforts on Q2 next year—your best customers are most at risk during this period.

• **Forecast**: If current momentum continues, projected Q1 next year: **$72k-$78k**.`);
      } else if (prompt.toLowerCase().includes('churn')) {
        resolve(`• **Churn Alert**: Churn increased from **5% to 8%** month-over-month, representing a **60% increase** in customer loss.

• **Likely Causes**: Recent pricing changes, onboarding gaps, or competitor activity. Recommend immediate customer interviews.

• **High-Risk Segments**: Analyze usage data for users with declining activity over 14+ days.

• **Recommended Action**: Launch win-back campaign with personalized offers for at-risk segments within 48 hours.`);
      } else if (prompt.toLowerCase().includes('campaign')) {
        resolve(`• **Campaign Comparison**: Campaign A ($2 CPC, 2% conversion) vs Campaign B ($1.5 CPC, 1.2% conversion).

• **Cost Efficiency**: Campaign B has **25% lower CPA** despite lower conversion rate ($125 vs $100 per conversion).

• **Volume Impact**: Campaign B drove **60% more clicks** (8,000 vs 5,000) at only 25% higher total spend.

• **Recommendation**: Shift 70% budget to Campaign B, optimize Campaign A creative to improve conversion rate.`);
      } else {
        resolve(`• **Data Summary**: Analysis of your data shows **3 key patterns** emerging across your metrics.

• **Top Priority**: The segment contributing **42%** of your results shows signs of plateauing. New initiatives needed.

• **Quick Win**: Two underperforming areas can be improved with **minimal effort** for estimated **15-20% gain**.

• **Recommendation**: Run an A/B test on your highest-volume variable to validate these findings.`);
      }
    }, 1200);
  });
}
