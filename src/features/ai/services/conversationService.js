import { apiService } from '../../../services/apiService';

export async function getUserConversations(userId) {
    const { supabase } = await import('../../../lib/supabaseClient');

    const { data: rows, error: convErr } = await supabase
        .from('ai_conversations')
        .select('id, user_id, title, updated_at, created_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (convErr) throw convErr;
    return rows || [];
}

export async function createConversation(userId, title) {
    const { supabase } = await import('../../../lib/supabaseClient');

    const { data: created, error: convErr } = await supabase
        .from('ai_conversations')
        .insert({ user_id: userId, title })
        .select()
        .single();

    if (convErr) throw convErr;
    if (!created?.id) throw new Error('Conversation creation returned no id.');

    return created.id;
}

export async function updateConversationTimestamp(conversationId) {
    try {
        const { supabase } = await import('../../../lib/supabaseClient');

        await supabase
            .from('ai_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);
    } catch (e) {
        // Preserve non-blocking behavior
        console.log('[AIInsights] Failed to update conversation timestamp', {
            conversationId,
            error: e?.message || e,
        });
    }
}
