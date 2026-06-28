import { memo, useState, useCallback, useMemo } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { useDebounce } from '../../../hooks/useDebounce';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { groupConversations } from '../utils/conversationUtils';
import ConversationSearch from './ConversationSearch';
import ConversationGroup from './ConversationGroup';

function LoadingSkeleton() {
    return (
        <div className="px-2 space-y-2 pt-2">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
            ))}
        </div>
    );
}

function EmptySidebarState() {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <MessageSquarePlus
                    size={24}
                    className="text-gray-400 dark:text-gray-500"
                />
            </div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                No conversations yet
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed max-w-[180px]">
                Start a new chat to begin analyzing your data
            </p>
        </div>
    );
}

function ConversationSidebar({
    conversations,
    activeConversationId,
    onSelectConversation,
    conversationsLoading = false,
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 200);

    const [pinnedIds, setPinnedIds] = useLocalStorage('pinned-conversations', []);

    const filtered = useMemo(
        () =>
            debouncedQuery
                ? conversations.filter((c) =>
                      (c.title || '')
                          .toLowerCase()
                          .includes(debouncedQuery.toLowerCase())
                  )
                : conversations,
        [conversations, debouncedQuery]
    );

    const { pinned, unpinned } = useMemo(
        () => ({
            pinned: filtered.filter((c) => pinnedIds.includes(c.id)),
            unpinned: filtered.filter((c) => !pinnedIds.includes(c.id)),
        }),
        [filtered, pinnedIds]
    );

    const grouped = useMemo(() => groupConversations(unpinned), [unpinned]);

    const togglePin = useCallback(
        (id) => {
            setPinnedIds((prev) =>
                prev.includes(id)
                    ? prev.filter((p) => p !== id)
                    : [...prev, id]
            );
        },
        [setPinnedIds]
    );

    const groups = [
        { key: 'today', label: 'Today', count: grouped.today.length, staggerClass: 'stagger-1', items: grouped.today },
        { key: 'yesterday', label: 'Yesterday', count: grouped.yesterday.length, staggerClass: 'stagger-2', items: grouped.yesterday },
        { key: 'last7Days', label: 'Last 7 days', count: grouped.last7Days.length, staggerClass: 'stagger-3', items: grouped.last7Days },
        { key: 'last30Days', label: 'Last 30 days', count: grouped.last30Days.length, staggerClass: 'stagger-4', items: grouped.last30Days },
        { key: 'older', label: 'Older', count: grouped.older.length, staggerClass: 'stagger-5', items: grouped.older },
    ];

    return (
        <div className="bg-white dark:bg-gray-900 overflow-hidden flex flex-col flex-1">
            <ConversationSearch value={searchQuery} onChange={setSearchQuery} />
            <div className="flex-1 overflow-y-auto px-2 pb-2">
                {conversationsLoading ? (
                    <LoadingSkeleton />
                ) : filtered.length === 0 && debouncedQuery ? (
                    <div className="px-3 py-8 text-center">
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            No conversations match &quot;{debouncedQuery}&quot;
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptySidebarState />
                ) : (
                    <div>
                        {pinned.length > 0 && (
                            <ConversationGroup
                                label="Pinned"
                                count={pinned.length}
                                wrapperClassName="mb-2"
                                conversations={pinned}
                                activeConversationId={activeConversationId}
                                onSelectConversation={onSelectConversation}
                                onTogglePin={togglePin}
                                isPinned={true}
                            />
                        )}
                        {groups.map(({ key, label, count, staggerClass, items }) =>
                            items.length > 0 ? (
                                <ConversationGroup
                                    key={key}
                                    label={label}
                                    count={count}
                                    wrapperClassName={`mb-2 animate-fade-in-up ${staggerClass}`}
                                    conversations={items}
                                    activeConversationId={activeConversationId}
                                    onSelectConversation={onSelectConversation}
                                    onTogglePin={togglePin}
                                />
                            ) : null
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(ConversationSidebar);
