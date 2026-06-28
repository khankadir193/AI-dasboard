import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../../../services/apiService';

export default function useConversations() {
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const didLoadHistoryRef = useRef(false);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const refreshConversationList = useCallback(async (keepActiveId) => {
        try {
            setLoading(true);
            const user = await apiService.getSupabaseUser();
            if (!user?.id) throw new Error('Authenticated user not found.');

            const { supabase } = await import('../../../lib/supabaseClient');

            const { data: rows, error: convErr } = await supabase
                .from('ai_conversations')
                .select('id, user_id, title, updated_at, created_at')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (convErr) throw convErr;
            if (!isMountedRef.current) return;

            const list = rows || [];
            setConversations(list);

            const latest = list[0];
            // Use explicit ID when provided (e.g. freshly created conversation)
            // to avoid stale closure issues while React state is still queued.
            const effectiveActiveId = keepActiveId ?? activeConversationId;
            const activeStillExists = !!(effectiveActiveId && list.some((c) => c.id === effectiveActiveId));
            if (!activeStillExists) {
                setActiveConversationId(latest?.id || null);
            }
        } catch (e) {
            console.log('[AIInsights] Failed to refresh conversation list', e?.message || e);
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
    }, [activeConversationId]);

    const resetActiveConversationId = useCallback(() => {
        setActiveConversationId(null);
    }, []);

    // Load previous chats on mount (latest selected silently)
    useEffect(() => {
        if (didLoadHistoryRef.current) return;
        didLoadHistoryRef.current = true;

        const loadHistory = async () => {
            try {
                const user = await apiService.getSupabaseUser();
                if (!user?.id) throw new Error('Authenticated user not found.');

                const { supabase } = await import('../../../lib/supabaseClient');

                const { data: rows, error: convErr } = await supabase
                    .from('ai_conversations')
                    .select('id, user_id, title, updated_at, created_at')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false });

                if (convErr) throw convErr;

                const list = rows || [];
                if (!isMountedRef.current) return;

                setConversations(list);

                const latest = list[0];
                if (latest?.id) {
                    setActiveConversationId(latest.id);
                }
            } catch (e) {
                console.log('[AIInsights] Failed to load previous chats', e?.message || e);
            } finally {
                if (isMountedRef.current) setInitialized(true);
            }
        };

        loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const createConversation = useCallback(async ({ userId, title }) => {
        const { supabase } = await import('../../../lib/supabaseClient');

        const { data: created, error: convErr } = await supabase
            .from('ai_conversations')
            .insert({ user_id: userId, title })
            .select()
            .single();

        if (convErr) throw convErr;
        if (!created?.id) throw new Error('Conversation creation returned no id.');

        if (isMountedRef.current) {
            setActiveConversationId(created.id);
            await refreshConversationList(created.id);
        }
        return created.id;
    }, [refreshConversationList]);

    const selectConversation = useCallback(async (convId) => {
        if (!convId) return;
        if (convId === activeConversationId) return;
        setActiveConversationId(convId);
    }, [activeConversationId]);

    const updateConversationTimestamp = useCallback(async (conversationId) => {
        try {
            const { supabase } = await import('../../../lib/supabaseClient');
            await supabase
                .from('ai_conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', conversationId);
        } catch (e) {
            console.log('[AIInsights] Failed to update conversation timestamp', {
                conversationId,
                error: e?.message || e,
            });
        }
    }, []);

    return {
        conversations,
        activeConversationId,
        createConversation,
        selectConversation,
        updateConversationTimestamp,
        refreshConversationList,
        resetActiveConversationId,
        loading,
        initialized,
    };
}
