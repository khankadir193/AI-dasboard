import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../../../services/apiService';
import { sendPromptToAI } from '../services/aiChatService';
import { buildFirstPromptTitle, makeId } from '../utils/chatHelpers';

export default function useAIChat({
    activeConversationId,
    onSelectConversation,
    conversations,
    createConversation,
    messages,
    appendMessage,
    clearMessages,
    setActiveConversationId,
    loadMessages,
    saveUserMessage,
    saveAssistantMessage,
    updateConversationTimestamp,
    refreshConversationList: externalRefreshConversationList,
}) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isMountedRef = useRef(true);
    const createConversationPromiseRef = useRef(null);
    const didLoadHistoryRef = useRef(false);

    // Prevent duplicate concurrent sends (StrictMode/dev double-invokes, double UI events, etc.)
    const inFlightRef = useRef(false);

    const activeConversationIdRef = useRef(activeConversationId || null);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        activeConversationIdRef.current = activeConversationId || null;
    }, [activeConversationId]);

    const refreshConversationList = useCallback(async () => {
        // Prefer external refresh if provided (parity with the refactor stack)
        if (externalRefreshConversationList) {
            try {
                await externalRefreshConversationList();
                return;
            } catch {
                // Keep UI usable if persistence fails.
            }
        }

        // Fallback to a best-effort reload via the existing conversation list hook.
        // This keeps behavior close to the legacy component.
        try {
            if (activeConversationIdRef.current) {
                await loadMessages?.(activeConversationIdRef.current);
            }
        } catch {
            // ignore
        }
    }, [externalRefreshConversationList, loadMessages]);

    const ensureConversationCreated = useCallback(
        async ({ userId, firstPrompt }) => {
            if (activeConversationIdRef.current) return activeConversationIdRef.current;

            if (createConversationPromiseRef.current) return createConversationPromiseRef.current;

            createConversationPromiseRef.current = (async () => {
                const title = buildFirstPromptTitle(firstPrompt);
                const createdId = await createConversation({ userId, title });

                activeConversationIdRef.current = createdId;
                // active conversation state is managed by useConversations via createConversation()
                return createdId;
            })();

            try {
                const id = await createConversationPromiseRef.current;
                return id;
            } finally {
                // allow future conversations (after reset/new chat) by clearing the promise
                createConversationPromiseRef.current = null;
            }
        },
        [createConversation]
    );

    const handleSelectConversation = useCallback(
        async (convId) => {
            if (!convId) return;
            if (convId === activeConversationId) return;

            setError(null);
            if (!isMountedRef.current) return;

            // switch active conversation first to avoid stale inserts
            activeConversationIdRef.current = convId;
            onSelectConversation(convId);
            // NOTE: message loading is handled by useMessages(activeConversationId)
        },
        [activeConversationId, onSelectConversation]
    );

    const handleSend = useCallback(
        async (text) => {
            const prompt = (text || input).trim();

            // Diagnostics: track send attempts and in-flight status
            const attemptId = makeId('send-attempt');

            // eslint-disable-next-line no-console
            console.log('[AIInsights][handleSend] attempt start', {
                attemptId,
                prompt,
                textProvided: typeof text !== 'undefined',
                loadingSnapshot: loading,
                activeConversationIdSnapshot: activeConversationIdRef.current,
            });

            if (!prompt || loading || inFlightRef.current) {
                // eslint-disable-next-line no-console
                console.log('[AIInsights][handleSend] attempt early return', {
                    attemptId,
                    reason: !prompt ? 'empty-prompt' : 'loading-guard',
                    loadingSnapshot: loading,
                });
                return;
            }

            setInput('');
            setError(null);

            // Hard guard against concurrent handleSend calls before any awaited work starts.
            inFlightRef.current = true;

            // Append to UI immediately (optimistic)
            const userUiId = makeId('ui-user');
            const assistantUiId = makeId('ui-asst');

            appendMessage({ id: userUiId, role: 'user', content: prompt });

            setLoading(true);

            let activeConversationIdLocal = activeConversationIdRef.current;

            try {
                const user = await apiService.getSupabaseUser();
                if (!user?.id) throw new Error('Authenticated user not found.');

                // Ensure conversation exists exactly once per session-send burst.
                if (!activeConversationIdLocal) {
                    activeConversationIdLocal = await ensureConversationCreated({
                        userId: user.id,
                        firstPrompt: prompt,
                    });
                }

                if (!activeConversationIdLocal) throw new Error('No active conversation id available.');

                // Persist user message (must not break UI if it fails)
                try {
                    await saveUserMessage?.({
                        conversationId: activeConversationIdLocal,
                        prompt,
                    });
                } catch {
                    // ignore to preserve UI
                }

                // eslint-disable-next-line no-console
                console.log('[AIInsights][handleSend] calling AI backend', {
                    attemptId,
                    prompt,
                    conversationId: activeConversationIdLocal,
                });

                const response = await sendPromptToAI(prompt);

                // eslint-disable-next-line no-console
                console.log('[AIInsights][handleSend] AI backend resolved', {
                    attemptId,
                    prompt,
                    responseLength: response?.length,
                });

                appendMessage({ id: assistantUiId, role: 'assistant', content: response });

                // Persist assistant message (must not break UI)
                try {
                    await saveAssistantMessage?.({
                        conversationId: activeConversationIdLocal,
                        content: response,
                    });
                } catch {
                    // ignore to preserve UI
                }

                // Update conversation timestamp after exchange (best-effort)
                try {
                    await updateConversationTimestamp?.(activeConversationIdLocal);
                } catch {
                    // ignore
                }

                // Auto-refresh sidebar after each completed exchange (disabled to prevent
                // activeConversationId churn / history reload while send is in-flight).
                // await refreshConversationList();
            } catch (err) {
                const msg = err?.message || String(err);

                setError(msg);

                appendMessage({
                    id: makeId('ui-error'),
                    role: 'assistant',
                    content: `⚠️ **Error**: ${msg}\n\nBackend proxy unavailable—using mock responses.`,
                });

                // eslint-disable-next-line no-console
                console.log('[AIInsights] handleSend failed', { attemptId, error: msg });
            } finally {
                if (isMountedRef.current) setLoading(false);
                inFlightRef.current = false;

                // eslint-disable-next-line no-console
                console.log('[AIInsights][handleSend] attempt end', {
                    attemptId,
                    prompt,
                });
            }
        },
        [appendMessage, ensureConversationCreated, input, loading, refreshConversationList, setError]
    );

    const handleNewChat = useCallback(() => {
        // Do NOT delete old conversations; just reset active session.
        setError(null);
        clearMessages();

        activeConversationIdRef.current = null;

        // active conversation state is managed by useConversations
        // (AIInsightsPage wires this to resetActiveConversationId)
        setActiveConversationId?.(null);

        setInput('');
        createConversationPromiseRef.current = null;
    }, [clearMessages, setActiveConversationId]);

    return {
        input,
        setInput,
        loading,
        error,
        handleSend,
        handleNewChat,
        // keep for future wiring
        handleSelectConversation,
        didLoadHistoryRef,
    };
}
