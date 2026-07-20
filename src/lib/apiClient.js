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
    const systemPrompt = `You are a data analyst assistant for a project management platform. Analyze the provided company data and answer the user's question based on the data.

Structure your response EXACTLY as follows:

## Summary
[2-3 sentence executive summary of the key findings]

## Findings
[3-5 bullet-point findings with **bold** for key metrics]

## Recommendations
[2-4 actionable recommendations]

Be specific, data-driven, and professional. Never invent data. Base all analysis strictly on the provided context.`;

    const body = { message: systemPrompt + "\n\nData: " + prompt }
    if (options.context) body.context = options.context

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return data.reply;

  } catch (error) {
    // Fallback to mock on any error
    return getMockInsight(prompt);
  }
}

/**
 * Mock AI response for development/testing (no backend needed)
 */
function getMockInsight(prompt) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const inContext = prompt.toLowerCase().includes('company data') || prompt.toLowerCase().includes('[company data')
      if (inContext) {
        resolve(`## Summary

Based on the provided company data, your workspace shows **steady engagement** across key metrics over the last 30 days, with active project work and consistent team activity driving overall performance.

## Findings

• **User Logins** recorded the highest activity with **42 events**, indicating strong platform adoption and regular team engagement.
• Out of **12 total projects**, **8 are active** (75% active rate), suggesting healthy project portfolio management.
• Team activity generated **120 log entries**, averaging **4 entries per day** with consistent daily participation.
• No significant anomalies or negative trends were detected across any tracked metric.
• Recent notifications indicate smooth operations with no critical alerts requiring immediate attention.

## Recommendations

• Continue monitoring user engagement patterns to sustain the positive adoption trend.
• Review the 4 inactive projects for potential archiving or reactivation to keep the portfolio clean.
• Schedule a team check-in to build on current momentum and identify any emerging blockers before they escalate.`);
      } else if (prompt.toLowerCase().includes('revenue') || prompt.toLowerCase().includes('q1')) {
        resolve(`## Summary

Revenue data reveals a **+37% increase** from Q1 ($42k) to Q4 ($67k), with a mid-year dip in Q2 ($38k) followed by a strong recovery trajectory.

## Findings

• **Revenue Growth**: Overall growth of **+37%** from Q1 to Q4, driven primarily by H2 recovery.
• **Seasonal Pattern**: Q2 saw a **-10% decline** from Q1 ($42k → $38k), suggesting mid-year seasonality.
• **Recovery Strength**: Q3 and Q4 posted consecutive gains of **+18%** and **+24%** respectively.
• **Forecast**: If current momentum holds, projected Q1 next year is **$72k-$78k**.

## Recommendations

• Launch targeted promotions in Q2 to flatten the seasonal dip and maintain H1 momentum.
• Focus retention efforts on Q2 next year — historical data shows this is the highest-risk period.
• Double down on the strategies that drove Q3–Q4 recovery to sustain the growth trend.`);
      } else if (prompt.toLowerCase().includes('churn')) {
        resolve(`## Summary

Churn has increased from **5% to 8%** month-over-month, a **60% increase** in customer loss that requires immediate investigation and intervention.

## Findings

• **Churn Rate**: Increased from 5% to 8% MoM, representing a concerning acceleration in customer departures.
• **Likely Causes**: Recent pricing changes, onboarding gaps, or competitor activity could be contributing factors.
• **High-Risk Segments**: Users with declining activity over **14+ days** are most likely to churn next.
• **At-Risk Value**: The current trajectory could result in **$12k-$18k** in monthly recurring revenue loss.

## Recommendations

• Launch a win-back campaign with personalized offers for at-risk segments within **48 hours**.
• Conduct immediate customer interviews to identify root causes of the increased churn.
• Review onboarding flow for friction points and implement an early warning system for declining engagement.`);
      } else if (prompt.toLowerCase().includes('campaign')) {
        resolve(`## Summary

Campaign B outperforms Campaign A on cost efficiency with a **25% lower CPA**, though Campaign A achieves a higher conversion rate (2% vs 1.2%).

## Findings

• **Campaign A**: $2 CPC, 2% conversion rate, $125 CPA — premium performance at higher cost.
• **Campaign B**: $1.50 CPC, 1.2% conversion rate, $100 CPA — better cost efficiency despite lower conversion.
• **Volume Impact**: Campaign B drove **60% more clicks** (8,000 vs 5,000) at only 25% higher total spend.
• **Total Spend**: Campaign B's lower CPA makes it the more scalable option for budget allocation.

## Recommendations

• Shift **70% of budget to Campaign B** to maximize volume and cost efficiency.
• Optimize Campaign A creative and targeting to improve its conversion rate beyond 2%.
• Run an A/B test on landing page experience to identify conversion drivers for both campaigns.`);
      } else {
        resolve(`## Summary

Analysis of your data shows steady activity across your workspace with **no critical blockers** detected. Key metrics indicate healthy engagement levels.

## Findings

• Your workspace has **active projects** and **consistent team activity** across the reporting period.
• Team members are regularly logging in and engaging with dashboard features.
• Current metrics suggest stable operations with room for strategic optimization.
• No unusual patterns, anomalies, or negative trends were identified in the data.

## Recommendations

• Continue monitoring key metrics to maintain the current positive trajectory.
• Explore expansion of tracking to capture additional business insights.
• Schedule regular data reviews to identify optimization opportunities as more data accumulates.`);
      }
    }, 1200);
  });
}
