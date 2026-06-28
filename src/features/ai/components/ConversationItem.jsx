import { memo, useState, useRef, useEffect } from 'react';
import {
    Pin,
    PinOff,
    MoreHorizontal,
    Trash2,
    Edit3,
} from 'lucide-react';
import { formatTime } from '../utils/conversationUtils';

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

export default memo(ConversationItem);
