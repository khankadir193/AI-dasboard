import { memo } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

function TypingIndicator({ visible, text }) {
    if (!visible) return null;

    return (
        <div className="flex gap-3 animate-fade-in-up">
            <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <Sparkles size={14} className="text-white" />
                </div>
            </div>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/20 shadow-sm">
                <div className="flex items-center gap-2.5">
                    <span className="inline-flex gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse-dot" />
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse-dot [animation-delay:0.2s]" />
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse-dot [animation-delay:0.4s]" />
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                        {text}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default memo(TypingIndicator);
