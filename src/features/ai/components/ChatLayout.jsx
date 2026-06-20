import { memo } from 'react';

function ChatLayout({ onNewChat, sidebar, content, inputBar }) {
    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
            {/* Minimal top bar - 52px like ChatGPT */}
            <div className="shrink-0 flex items-center justify-between px-4 h-[52px] border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <button
                    onClick={onNewChat}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="New chat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>New chat</span>
                </button>
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
                    U
                </div>
            </div>

            {/* Sidebar + Main Chat */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
                {/* Conversation sidebar - fixed 300px */}
                <aside className="w-[300px] shrink-0 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
                    {sidebar}
                </aside>

                {/* Main chat area */}
                <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-6">
                            {content}
                        </div>
                    </div>

                    {/* Sticky composer */}
                    <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
                        <div className="max-w-[760px] mx-auto">
                            {inputBar}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(ChatLayout);
