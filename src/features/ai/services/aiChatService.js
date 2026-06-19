import { getAIInsight } from '../../../lib/apiClient';

/**
 * Only this module is responsible for invoking the AI backend.
 * It preserves existing /api/chat behavior via getAIInsight.
 */
export async function sendPromptToAI(prompt, options = {}) {
    return getAIInsight(prompt, options);
}
