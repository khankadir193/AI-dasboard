import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiService } from '../../../services/apiService';
import { getMessages, createMessage } from '../services/messageService';

export default function useMessages(activeConversationId) {
    const [messages, setMessages] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const loadMessages = useCallback(
        async (convId) => {
            if (!convId) return;

            setHistoryLoading(true);
            try {
                const restored = await (async () => {
                    const rows = await getMessages(convId);
                    return rows || [];
                })();

                if (!isMountedRef.current) return;

                setMessages((prev) => {
                    // If we already have optimistic messages, merge restored history
                    // to avoid wiping/duplicating UI during in-flight sends.
                    if (!prev || prev.length === 0) return restored;

                    // Dedupe primarily by semantic identity, not optimistic/client ids.
                    // Optimistic UI messages use temporary ids that won't match persisted rows.
                    const keyFor = (m) => {
                        const role = m?.role ?? 'unknown';
                        const content = (m?.content ?? '').trim();
                        return `role:${role}::content:${content}`;
                    };

                    const existingKeys = new Set((prev || []).map(keyFor));
                    const merged = [...prev];

                    for (const m of restored || []) {
                        const k = keyFor(m);
                        if (!existingKeys.has(k)) {
                            merged.push(m);
                            existingKeys.add(k);
                        }
                    }

                    return merged;
                });
            } catch (e) {
                console.log('[AIInsights] Failed to load messages', e?.message || e);
                if (isMountedRef.current) setMessages([]);
            } finally {
                if (isMountedRef.current) setHistoryLoading(false);
            }
        },
        []
    );

    // best-effort append/persistence helpers used by useAIChat
    const appendMessage = useCallback((msg) => {
        setMessages((prev) => [...prev, msg]);
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    // used to preserve “ensure conversation created exactly once per session burst”
    const createOptimisticConversationIfNeeded = useCallback(async () => {
        // intentionally not implemented here; useAIChat owns creation exactly-once behavior.
        return null;
    }, []);

    // expose active setter for compatibility with page container
    const setActiveConversationId = useCallback(() => { }, []);

    const saveUserMessage = useCallback(async ({ conversationId, prompt }) => {
        try {
            await createMessage(conversationId, 'user', prompt);
        } catch (e) {
            console.log('[AIInsights] Failed to save user message', {
                conversationId,
                error: e?.message || e,
            });
        }
    }, []);

    const saveAssistantMessage = useCallback(async ({ conversationId, content }) => {
        try {
            await createMessage(conversationId, 'assistant', content);
        } catch (e) {
            console.log('[AIInsights] Failed to save AI response', {
                conversationId,
                error: e?.message || e,
            });
        }
    }, []);

    // auto-load when active conversation changes
    useEffect(() => {
        if (activeConversationId) {
            loadMessages(activeConversationId);
        }
    }, [activeConversationId, loadMessages]);

    return useMemo(
        () => ({
            messages,
            historyLoading,
            appendMessage,
            loadMessages,
            clearMessages,
            setActiveConversationId,
            createOptimisticConversationIfNeeded,
            saveUserMessage,
            saveAssistantMessage,
            setMessages, // internal escape hatch for optimistic updates if needed
        }),
        [messages, historyLoading, appendMessage, loadMessages, clearMessages]
    );
}
