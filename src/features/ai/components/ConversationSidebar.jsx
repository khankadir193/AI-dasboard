import { memo } from 'react';
import { Search } from 'lucide-react';

function ConversationSidebar({
    conversations,
    activeConversationId,
    onSelectConversation,
    conversationsLoading = false,
}) {
    const groupedConversations = {
        today: [],
        yesterday: [],
        last7Days: [],
        last30Days: [],
        older: [],
    };

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const yesterdayStart = new Date(todayStart - 86400000);
    const sevenDaysStart = new Date(now - 7 * 86400000);
    const thirtyDaysStart = new Date(now - 30 * 86400000);

    conversations.forEach((conv) => {
        const updatedAt = conv.updated_at ? new Date(conv.updated_at) : null;
        if (!updatedAt) {
            groupedConversations.older.push(conv);
            return;
        }

        if (updatedAt >= todayStart) {
            groupedConversations.today.push(conv);
        } else if (updatedAt >= yesterdayStart) {
            groupedConversations.yesterday.push(conv);
        } else if (updatedAt >= sevenDaysStart) {
            groupedConversations.last7Days.push(conv);
        } else if (updatedAt >= thirtyDaysStart) {
            groupedConversations.last30Days.push(conv);
        } else {
            groupedConversations.older.push(conv);
        }
    });

    return (
        <div className="bg-white dark:bg-gray-900 overflow-hidden flex flex-col h-full">
            {/* Search */}
            <div className="shrink-0 px-3 pt-3 pb-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                            ⌘K
                        </span>
                    </div>
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full pl-9 pr-12 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 pb-2">
                {conversationsLoading ? (
                    <div className="px-2 py-6 text-sm text-gray-500 dark:text-gray-400">Loading conversations...</div>
                ) : conversations.length === 0 ? (
                    <div className="px-2 py-6 text-sm text-gray-500 dark:text-gray-400">No conversations yet.</div>
                ) : (
                    <div>
                        {groupedConversations.today.length > 0 && (
                            <div className="mb-1">
                                <div className="px-2 py-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Today</div>
                                {groupedConversations.today.map((conv) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        activeConversationId={activeConversationId}
                                        onSelectConversation={onSelectConversation}
                                    />
                                ))}
                            </div>
                        )}

                        {groupedConversations.yesterday.length > 0 && (
                            <div className="mb-1">
                                <div className="px-2 py-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Yesterday</div>
                                {groupedConversations.yesterday.map((conv) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        activeConversationId={activeConversationId}
                                        onSelectConversation={onSelectConversation}
                                    />
                                ))}
                            </div>
                        )}

                        {groupedConversations.last7Days.length > 0 && (
                            <div className="mb-1">
                                <div className="px-2 py-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Last 7 days</div>
                                {groupedConversations.last7Days.map((conv) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        activeConversationId={activeConversationId}
                                        onSelectConversation={onSelectConversation}
                                    />
                                ))}
                            </div>
                        )}

                        {groupedConversations.last30Days.length > 0 && (
                            <div className="mb-1">
                                <div className="px-2 py-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Last 30 days</div>
                                {groupedConversations.last30Days.map((conv) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        activeConversationId={activeConversationId}
                                        onSelectConversation={onSelectConversation}
                                    />
                                ))}
                            </div>
                        )}

                        {groupedConversations.older.length > 0 && (
                            <div className="mb-1">
                                <div className="px-2 py-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Older</div>
                                {groupedConversations.older.map((conv) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        activeConversationId={activeConversationId}
                                        onSelectConversation={onSelectConversation}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function ConversationItem({ conversation, activeConversationId, onSelectConversation }) {
    const active = conversation.id === activeConversationId;
    const updatedAt = conversation.updated_at ? new Date(conversation.updated_at) : null;
    const timeLabel = updatedAt ? updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return (
        <button
            onClick={() => onSelectConversation(conversation.id)}
            className={[
                'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 group',
                active
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50',
            ].join(' ')}
        >
            <div className="flex items-center gap-2 min-w-0 flex-1">
                {active && (
                    <div className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0" />
                )}
                <span className="truncate text-sm">{conversation.title || 'New Conversation'}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                {timeLabel && (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">{timeLabel}</span>
                )}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
                    </svg>
                </div>
            </div>
        </button>
    );
}

export default memo(ConversationSidebar);
