import { memo, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';

function MessageInput({ value, onChange, onSend, loading }) {
    const lastSubmittedValueRef = useRef(null);

    const trySend = () => {
        if (loading) return;

        const trimmed = (value || '').trim();
        if (!trimmed) return;

        // Prevent double-trigger from multiple UI events for the same input content
        if (lastSubmittedValueRef.current === trimmed) return;
        lastSubmittedValueRef.current = trimmed;

        onSend();
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="relative bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md p-2">
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            trySend();
                        }
                    }}
                    placeholder="Ask about projects, team productivity, activity logs, or dashboard metrics..."
                    className="w-full text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 rounded-lg px-3 py-2 resize-y outline-none border-none min-h-[48px] sm:min-h-[52px] max-h-[120px] transition-all duration-200 ease-in-out"
                />

                <button
                    type="button"
                    onClick={trySend}
                    disabled={!value.trim() || loading}
                    className="absolute bottom-2.5 right-2.5 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-9 h-9"
                    aria-label="Send message"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
            </div>
        </div>
    );
}

export default memo(MessageInput);
