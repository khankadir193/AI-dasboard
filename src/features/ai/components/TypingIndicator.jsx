import { memo } from 'react';
import { Loader2 } from 'lucide-react';

function TypingIndicator({ visible, text }) {
    if (!visible) return null;

    return (
        <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Loader2 size={14} className="text-white animate-spin" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 text-sm text-gray-500 border border-gray-100 dark:border-gray-700 shadow-sm">
                <span className="inline-flex gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
                {text}
            </div>
        </div>
    );
}

export default memo(TypingIndicator);
