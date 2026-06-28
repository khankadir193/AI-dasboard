import { memo } from 'react';
import ConversationItem from './ConversationItem';

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

function ConversationGroup({
    label,
    count,
    wrapperClassName = 'mb-2 animate-fade-in-up',
    conversations,
    activeConversationId,
    onSelectConversation,
    onTogglePin,
    isPinned = false,
}) {
    return (
        <div className={wrapperClassName}>
            <SectionHeader label={label} count={count} />
            {conversations.map((conv, i) => (
                <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    activeConversationId={activeConversationId}
                    onSelectConversation={onSelectConversation}
                    isPinned={isPinned}
                    onTogglePin={onTogglePin}
                    staggerIndex={i}
                />
            ))}
        </div>
    );
}

export default memo(ConversationGroup);
