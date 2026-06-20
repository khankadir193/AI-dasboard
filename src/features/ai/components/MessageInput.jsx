import { memo, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

function MessageInput({ value, onChange, onSend, loading }) {
    const textareaRef = useRef(null);
    const lastSubmittedValueRef = useRef(null);

    const trySend = useCallback(() => {
        if (loading) return;
        const trimmed = (value || '').trim();
        if (!trimmed) return;
        if (lastSubmittedValueRef.current === trimmed) return;
        lastSubmittedValueRef.current = trimmed;
        onSend();
    }, [loading, value, onSend]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            trySend();
        }
    };

    const handleChange = (e) => {
        onChange(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
        }
    };

    return (
        <div className="flex items-end gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus-within:border-gray-300 dark:focus-within:border-gray-600 focus-within:shadow-md transition-all px-3 py-2.5">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about projects, team productivity, activity logs, or dashboard metrics..."
                rows={1}
                className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none resize-none py-0.5 leading-6 max-h-[160px]"
            />
            <button
                type="button"
                onClick={trySend}
                disabled={!value.trim() || loading}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Send"
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                )}
            </button>
        </div>
    );
}

export default memo(MessageInput);
