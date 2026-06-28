import { memo } from 'react';
import { Search } from 'lucide-react';

function ConversationSearch({ value, onChange }) {
    return (
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
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-9 pr-12 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40 transition-all"
                />
            </div>
        </div>
    );
}

export default memo(ConversationSearch);
