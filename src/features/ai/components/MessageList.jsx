import { memo } from 'react';
import TypingIndicator from './TypingIndicator';
import MessageBubble from './MessageBubble';

function MessageList({ messages, historyLoading, loading, error, messagesContainerRef }) {
    return (
        <div className="max-w-3xl mx-auto px-2 sm:px-0 py-6">
            <div className="space-y-6" ref={messagesContainerRef}>
                {historyLoading ? (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white animate-spin inline-flex">
                                {/* Keep icon space similar; existing UI uses Loader2 */}
                            </span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 text-sm text-gray-500 border border-gray-100 dark:border-gray-700 shadow-sm">
                            <span className="inline-flex gap-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]" />
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:150ms]" />
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:300ms]" />
                            </span>
                            Loading conversation...
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg.id || `${msg.role}-${msg.content.slice(0, 10)}-${msg.content.length}`}
                            role={msg.role}
                            content={msg.content}
                        />
                    ))
                )}

                <TypingIndicator visible={loading && !historyLoading} text="Analyzing your data..." />

                {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
            </div>
        </div>
    );
}

export default memo(MessageList);
