import { memo } from 'react';

function ConversationSidebar({
    conversations,
    activeConversationId,
    onSelectConversation,
    conversationsLoading = false,
}) {
    return (
        <aside className="w-full sm:w-80 md:w-72 lg:w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-950">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Conversations</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{conversations?.length || 0}</div>
                </div>
            </div>

            <div className="p-2">
                {conversationsLoading ? (
                    <div className="px-2 py-6 text-sm text-gray-500 dark:text-gray-400">Loading…</div>
                ) : conversations?.length === 0 ? (
                    <div className="px-2 py-6 text-sm text-gray-500 dark:text-gray-400">No chats yet.</div>
                ) : (
                    <div className="space-y-1">
                        {conversations.map((c) => {
                            const active = c.id === activeConversationId;
                            const updated = c.updated_at ? new Date(c.updated_at) : null;
                            const label = updated ? updated.toLocaleString() : '';

                            return (
                                <button
                                    key={c.id}
                                    onClick={() => onSelectConversation(c.id)}
                                    className={[
                                        'w-full text-left px-3 py-2 rounded-lg border transition-all',
                                        active
                                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
                                            : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:border-gray-200/80 dark:hover:border-gray-700',
                                    ].join(' ')}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {c.title || 'Untitled'}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{label || '—'}</div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </aside>
    );
}

export default memo(ConversationSidebar);
