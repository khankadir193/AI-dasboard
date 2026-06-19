import ChatLayout from '../components/ChatLayout';
import ConversationSidebar from '../components/ConversationSidebar';
import MessageInput from '../components/MessageInput';
import EmptyState from '../components/EmptyState';
import MessageList from '../components/MessageList';
import useAIChat from '../hooks/useAIChat';
import useConversations from '../hooks/useConversations';
import useMessages from '../hooks/useMessages';
import { ANALYSIS_TYPES } from '../utils/analysisTypes';
import { useMemo } from 'react';

export default function AIInsightsPage() {
    const {
        conversations,
        activeConversationId,
        selectConversation,
        createConversation,
        loading: conversationsLoading,
        updateConversationTimestamp,
        refreshConversationList,
        resetActiveConversationId,
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

    return (
        <ChatLayout
            headerTitle="AI Insights"
            headerSubtitle="Analyze projects, teams, activity logs, and workspace performance using AI."
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
                messages.length === 0 ? (
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
