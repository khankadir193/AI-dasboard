import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import TypingIndicator from './TypingIndicator';
import MessageBubble from './MessageBubble';

function MessageList({ messages, historyLoading, loading, error, messagesContainerRef }) {
    const scrollRef = useRef(null);
    const bottomRef = useRef(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const isScrolledUp = el.scrollHeight - el.scrollTop - el.clientHeight > 200;
        setShowScrollBtn(isScrolledUp);
    }, []);

    const scrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Auto-scroll on new messages
    useEffect(() => {
        if (!loading) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading]);

    return (
        <div className="w-full flex-1 min-h-0 py-4 relative flex flex-col">
            <div
                ref={scrollRef}
                className="flex-1 min-h-0 overflow-y-auto space-y-5"
                onScroll={handleScroll}
            >
                {historyLoading ? (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white animate-spin inline-flex" />
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 text-sm text-gray-500 border border-gray-100 dark:border-gray-700 shadow-sm">
                            <span className="inline-flex gap-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse-dot" />
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse-dot [animation-delay:0.2s]" />
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse-dot [animation-delay:0.4s]" />
                            </span>
                            Loading conversation...
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg.id || `${msg.role}-${msg.content.slice(0, 20)}-${msg.content.length}`}
                            role={msg.role}
                            content={msg.content}
                        />
                    ))
                )}

                <TypingIndicator visible={loading && !historyLoading} text="Analyzing your data..." />

                {error && (
                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 border border-red-100 dark:border-red-800/30">
                        {error}
                    </div>
                )}

                {/* Bottom sentinel for auto-scroll */}
                <div ref={bottomRef} />
            </div>

            {/* Scroll-to-bottom button */}
            {showScrollBtn && (
                <button
                    onClick={scrollToBottom}
                    className="fixed bottom-28 right-8 w-9 h-9 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-10 animate-fade-in-up"
                    aria-label="Scroll to bottom"
                >
                    <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
                </button>
            )}
        </div>
    );
}

export default memo(MessageList);
