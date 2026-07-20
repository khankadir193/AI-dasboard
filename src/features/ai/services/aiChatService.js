import { getAIInsight } from '../../../lib/apiClient';
import { fetchCompanyContext, formatContextForPrompt } from './companyContextService';

/**
 * Only this module is responsible for invoking the AI backend.
 * It preserves existing /api/chat behavior via getAIInsight.
 * When companyId is provided, a lightweight company data snapshot
 * is prepended to the prompt and also passed as raw context for
 * the backend's buildSystemPrompt().
 */
export async function sendPromptToAI(prompt, options = {}) {
    const { companyId } = options;
    let enrichedPrompt = prompt;

    if (companyId) {
        const context = await fetchCompanyContext(companyId);
        enrichedPrompt = formatContextForPrompt(context) + '\n\n[USER QUERY]\n' + prompt;
        options = { ...options, context };
    }

    return getAIInsight(enrichedPrompt, options);
}
