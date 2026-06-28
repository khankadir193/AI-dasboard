import ChatLayout from '../components/ChatLayout';
import ConversationSidebar from '../components/ConversationSidebar';
import MessageInput from '../components/MessageInput';
import EmptyState from '../components/EmptyState';
import MessageList from '../components/MessageList';
import useAIChat from '../hooks/useAIChat';
import useConversations from '../hooks/useConversations';
import useMessages from '../hooks/useMessages';
import { ANALYSIS_TYPES } from '../utils/analysisTypes';
import { useMemo, useEffect, useState, useRef } from 'react';

export default function AIInsightsPage() {
    const [pageLoading, setPageLoading] = useState(true);
    const initialLoadDone = useRef(false);
    const historyLoadStarted = useRef(false);

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

    useEffect(() => {
        if (initialLoadDone.current) return;

        if (!initialized || conversationsLoading) {
            setPageLoading(true);
            return;
        }

        if (historyLoading) {
            historyLoadStarted.current = true;
            setPageLoading(true);
            return;
        }

        if (activeConversationId && !historyLoadStarted.current) {
            setPageLoading(true);
            return;
        }

        setPageLoading(false);
        initialLoadDone.current = true;
    }, [initialized, conversationsLoading, historyLoading, activeConversationId]);

    if (pageLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-50/30 to-white dark:from-gray-950/30 dark:to-gray-900">
                <div className="flex flex-col gap-3 items-center">
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
        );
    }

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
                loading ? (
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
