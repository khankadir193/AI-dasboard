export async function getMessages(conversationId) {
    const { supabase } = await import('../../../lib/supabaseClient');

    const { data: rows, error: msgErr } = await supabase
        .from('ai_messages')
        .select('role, content, created_at, id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (msgErr) throw msgErr;

    return (rows || []).map((r) => ({
        id: r.id,
        role: r.role,
        content: r.content,
    }));
}

export async function createMessage(conversationId, role, content) {
    const { supabase } = await import('../../../lib/supabaseClient');

    const { error } = await supabase.from('ai_messages').insert({
        conversation_id: conversationId,
        role,
        content,
    });

    return { error };
}
