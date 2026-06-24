import ChatLayout from '../components/ChatLayout';
import ConversationSidebar from '../components/ConversationSidebar';
import MessageInput from '../components/MessageInput';
import EmptyState from '../components/EmptyState';
import MessageList from '../components/MessageList';
import useAIChat from '../hooks/useAIChat';
import useConversations from '../hooks/useConversations';
import useMessages from '../hooks/useMessages';
import { ANALYSIS_TYPES } from '../utils/analysisTypes';
import { useMemo, useEffect, useState } from 'react';

export default function AIInsightsPage() {
    const [insightsLoading, setInsightsLoading] = useState(true);
    const {
        conversations,
        activeConversationId,
        selectConversation,
        createConversation,
        loading:         conversationsLoading,
        updateConversationTimestamp,
        refreshConversationList,
        resetActiveConversationId,
        initialized,
    } = useConversations();

    const {
        messages,
        historyLoading,
        appendMessage,
        loadMessages,
        clearMessages,
        setActiveConversationId,
        saveUserMessage,
        saveAssistantMessage,
    } = useMessages(activeConversationId);

    const {
        input,
        setInput,
        loading,
        error,
        handleSend,
        handleNewChat,
    } = useAIChat({
        activeConversationId,
        onSelectConversation: selectConversation,
        conversations,
        createConversation,
        messages,
        appendMessage,
        clearMessages,
        // For Phase-1: New Chat needs a real reset (sidebar clears selection)
        setActiveConversationId: resetActiveConversationId,
        loadMessages,
        saveUserMessage,
        saveAssistantMessage,
        updateConversationTimestamp,
        refreshConversationList,
    });

    const cards = useMemo(() => ANALYSIS_TYPES, []);

    // Navigation/loading guard: ensures EmptyState never renders while the page
    // is initializing or while conversation history is still loading.
    useEffect(() => {
        // Start loading on mount; also re-enter loading when conversation history is in-flight.
        setInsightsLoading(true);
    }, []);

    useEffect(() => {
        const resolved = initialized && !historyLoading && !conversationsLoading;

        setInsightsLoading(!resolved);
    }, [initialized, historyLoading, conversationsLoading]);

    return (
        <ChatLayout
            onNewChat={handleNewChat}
            sidebar={
                <ConversationSidebar
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    onSelectConversation={(id) => selectConversation(id)}
                    conversationsLoading={conversationsLoading}
                />
            }
            content={
                insightsLoading || conversationsLoading || historyLoading ? (
                    <div className="w-full flex-1 min-h-0 py-6">
                        <div className="max-w-4xl mx-auto px-0 sm:px-0 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white animate-spin inline-flex">✦</span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    Loading InsightAI...
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    Loading conversations...
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse [animation-delay:0.15s]" />
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    Loading analysis...
                                </div>
                            </div>
                        </div>
                    </div>
                ) : loading ? (
                    <MessageList
                        messages={messages}
                        historyLoading={historyLoading}
                        loading={loading}
                        error={error}
                    />
                ) : messages.length === 0 ? (
                    <EmptyState
                        analysisCards={cards}
                        onAnalyze={(text) => handleSend(text)}
                    />
                ) : (
                    <MessageList
                        messages={messages}
                        historyLoading={historyLoading}
                        loading={loading}
                        error={error}
                    />
                )
            }
            inputBar={
                <MessageInput
                    value={input}
                    onChange={setInput}
                    onSend={handleSend}
                    loading={loading}
                />
            }
        />
    );
}
