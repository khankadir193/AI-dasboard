import { memo } from 'react';

function ChatLayout({ headerTitle, headerSubtitle, onNewChat, sidebar, content, inputBar }) {
    return (
        <div className="h-full flex flex-col">
            {/* Header Bar */}
            <div className="shrink-0 flex items-center justify-between px-2 sm:px-0 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    {/*
            Keep icon styling identical to current implementation by relying on existing Tailwind classes.
            The icon itself is provided by the AIInsightsPage/parent if needed; here we keep layout only.
          */}
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{headerTitle}</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{headerSubtitle}</p>
                    </div>
                </div>

                <button
                    onClick={onNewChat}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all flex items-center gap-1.5 border border-gray-200 dark:border-gray-700"
                    aria-label="New chat"
                >
                    <span className="hidden sm:inline">New Chat</span>
                </button>
            </div>

            {/* Chat layout: Sidebar + Current Chat */}
            <div className="flex-1 overflow-hidden flex">
                {sidebar}
                <div className="flex-1 overflow-y-auto">{content}</div>
            </div>

            {/* Input Bar */}
            <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-2 sm:px-0 py-3">
                <div className="max-w-3xl mx-auto">{inputBar}</div>
            </div>
        </div>
    );
}

export default memo(ChatLayout);
