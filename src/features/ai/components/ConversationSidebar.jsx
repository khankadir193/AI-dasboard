import { memo, useState, useRef, useEffect, useCallback } from 'react';
import {
    Search,
    MessageSquarePlus,
    Pin,
    PinOff,
    MoreHorizontal,
    Trash2,
    Edit3,
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday, differenceInDays } from 'date-fns';
import { useDebounce } from '../../../hooks/useDebounce';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

function ConversationSidebar({
    conversations,
    activeConversationId,
    onSelectConversation,
    conversationsLoading = false,
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 200);

    const [pinnedIds, setPinnedIds] = useLocalStorage('pinned-conversations', []);

    const filtered = debouncedQuery
        ? conversations.filter((c) =>
              (c.title || '')
                  .toLowerCase()
                  .includes(debouncedQuery.toLowerCase())
          )
        : conversations;

    const pinned = filtered.filter((c) => pinnedIds.includes(c.id));
    const unpinned = filtered.filter((c) => !pinnedIds.includes(c.id));

    const grouped = groupConversations(unpinned);

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

    return (
        <div className="bg-white dark:bg-gray-900 overflow-hidden flex flex-col flex-1">
            {/* Search */}
            <div className="shrink-0 px-3 pt-3 pb-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                            ⌘K
                        </span>
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full pl-9 pr-12 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40 transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 pb-2">
                {conversationsLoading ? (
                    <LoadingSkeleton />
                ) : filtered.length === 0 && debouncedQuery ? (
                    <div className="px-3 py-8 text-center">
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            No conversations match "{debouncedQuery}"
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptySidebarState />
                ) : (
                    <div>
                        {/* Pinned section */}
                        {pinned.length > 0 && (
                            <div className="mb-2">
                                <SectionHeader label="Pinned" count={pinned.length} />
                                {pinned.map((conv, i) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        activeConversationId={activeConversationId}
                                        onSelectConversation={onSelectConversation}
                                        isPinned={true}
                                        onTogglePin={togglePin}
                                        staggerIndex={i}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Grouped sections */}
                        {grouped.today.length > 0 && (
                            <div className="mb-2 animate-fade-in-up stagger-1">
                                <SectionHeader label="Today" count={grouped.today.length} />
                                {grouped.today.map((conv, i) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        activeConversationId={activeConversationId}
                                        onSelectConversation={onSelectConversation}
                                        isPinned={false}
                                        onTogglePin={togglePin}
                                        staggerIndex={i}
                                    />
                                ))}
                            </div>
                        )}

                        {grouped.yesterday.length > 0 && (
                            <div className="mb-2 animate-fade-in-up stagger-2">
                                <SectionHeader label="Yesterday" count={grouped.yesterday.length} />
                                {grouped.yesterday.map((conv, i) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        activeConversationId={activeConversationId}
                                        onSelectConversation={onSelectConversation}
                                        isPinned={false}
                                        onTogglePin={togglePin}
                                        staggerIndex={i}
                                    />
                                ))}
                            </div>
                        )}

                        {grouped.last7Days.length > 0 && (
                            <div className="mb-2 animate-fade-in-up stagger-3">
                                <SectionHeader label="Last 7 days" count={grouped.last7Days.length} />
                                {grouped.last7Days.map((conv, i) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        activeConversationId={activeConversationId}
                                        onSelectConversation={onSelectConversation}
                                        isPinned={false}
                                        onTogglePin={togglePin}
                                        staggerIndex={i}
                                    />
                                ))}
                            </div>
                        )}

                        {grouped.last30Days.length > 0 && (
                            <div className="mb-2 animate-fade-in-up stagger-4">
                                <SectionHeader label="Last 30 days" count={grouped.last30Days.length} />
                                {grouped.last30Days.map((conv, i) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        activeConversationId={activeConversationId}
                                        onSelectConversation={onSelectConversation}
                                        isPinned={false}
                                        onTogglePin={togglePin}
                                        staggerIndex={i}
                                    />
                                ))}
                            </div>
                        )}

                        {grouped.older.length > 0 && (
                            <div className="mb-2 animate-fade-in-up stagger-5">
                                <SectionHeader label="Older" count={grouped.older.length} />
                                {grouped.older.map((conv, i) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        activeConversationId={activeConversationId}
                                        onSelectConversation={onSelectConversation}
                                        isPinned={false}
                                        onTogglePin={togglePin}
                                        staggerIndex={i}
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

function SectionHeader({ label, count }) {
    return (
        <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {label}
            </span>
            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                {count}
            </span>
        </div>
    );
}

function ConversationItem({
    conversation,
    activeConversationId,
    onSelectConversation,
    isPinned,
    onTogglePin,
    staggerIndex = 0,
}) {
    const active = conversation.id === activeConversationId;
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!menuOpen) return;
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [menuOpen]);

    const timeLabel = formatTime(conversation.updated_at);

    const handleMenuClick = (e) => {
        e.stopPropagation();
        setMenuOpen((prev) => !prev);
    };

    return (
        <div
            className={[
                'relative flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all duration-150 group cursor-pointer',
                active
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-2 border-blue-500 dark:border-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-transparent',
            ].join(' ')}
            onClick={() => onSelectConversation(conversation.id)}
            style={{ animationDelay: `${staggerIndex * 30}ms` }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectConversation(conversation.id);
                }
            }}
        >
            <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="truncate text-sm">
                    {conversation.title || 'New Conversation'}
                </span>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
                {timeLabel && (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
                        {timeLabel}
                    </span>
                )}

                {/* Pin button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(conversation.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    aria-label={isPinned ? 'Unpin conversation' : 'Pin conversation'}
                    title={isPinned ? 'Unpin' : 'Pin'}
                >
                    {isPinned ? (
                        <PinOff size={12} className="text-blue-500" />
                    ) : (
                        <Pin size={12} className="text-gray-400" />
                    )}
                </button>

                {/* Three-dot menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={handleMenuClick}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        aria-label="Conversation options"
                    >
                        <MoreHorizontal size={12} className="text-gray-400" />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20 animate-fade-in-up">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTogglePin(conversation.id);
                                    setMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                {isPinned ? (
                                    <PinOff size={12} />
                                ) : (
                                    <Pin size={12} />
                                )}
                                {isPinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Edit3 size={12} />
                                Rename
                            </button>
                            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <Trash2 size={12} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

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

function groupConversations(conversations) {
    const groups = {
        today: [],
        yesterday: [],
        last7Days: [],
        last30Days: [],
        older: [],
    };

    const now = new Date();

    conversations.forEach((conv) => {
        const updatedAt = conv.updated_at ? new Date(conv.updated_at) : null;
        if (!updatedAt) {
            groups.older.push(conv);
            return;
        }

        if (isToday(updatedAt)) {
            groups.today.push(conv);
        } else if (isYesterday(updatedAt)) {
            groups.yesterday.push(conv);
        } else if (differenceInDays(now, updatedAt) <= 7) {
            groups.last7Days.push(conv);
        } else if (differenceInDays(now, updatedAt) <= 30) {
            groups.last30Days.push(conv);
        } else {
            groups.older.push(conv);
        }
    });

    return groups;
}

function formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const daysDiff = differenceInDays(now, date);

    if (daysDiff === 0) {
        return format(date, 'h:mm a');
    } else if (daysDiff === 1) {
        return 'Yesterday';
    } else if (daysDiff < 7) {
        return format(date, 'EEE');
    } else {
        return format(date, 'MMM d');
    }
}

export default memo(ConversationSidebar);
