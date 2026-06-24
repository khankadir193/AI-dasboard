import { memo, useState } from 'react';
import { Plus, PanelLeft, PanelLeftClose } from 'lucide-react';
import clsx from 'clsx';

function ChatLayout({ onNewChat, sidebar, content, inputBar }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex-1 min-h-0 flex flex-col bg-gradient-to-b from-gray-50/30 to-white dark:from-gray-950/30 dark:to-gray-900 overflow-hidden">
            {/* Minimal top bar - 52px glass effect */}
            <div className="shrink-0 flex items-center justify-between px-4 h-[52px] border-b border-gray-100/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSidebarOpen((prev) => !prev)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                    >
                        {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
                    </button>
                    <button
                        onClick={onNewChat}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="New chat"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">New chat</span>
                    </button>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white shadow-sm">
                    U
                </div>
            </div>

            {/* Sidebar + Main Chat */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
                {/* Conversation sidebar - collapsible */}
                <aside
                    className={clsx(
                        'shrink-0 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col transition-all duration-300 ease-in-out',
                        sidebarOpen ? 'opacity-100' : 'opacity-0'
                    )}
                    style={{ width: sidebarOpen ? 300 : 0 }}
                >
                    {sidebar}
                </aside>

                {/* Main chat area */}
                <div className="flex-1 min-w-0 flex flex-col min-h-0">
                    {/* scrolling is owned by MessageList to avoid competing scroll containers */}
                    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 w-full flex flex-col flex-1 min-h-0">
                            {content}
                        </div>
                    </div>

                    {/* Floating composer area */}
                    <div className="shrink-0 px-4 py-3 sm:px-6">
                        <div className="max-w-4xl mx-auto relative">
                            {inputBar}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(ChatLayout);
