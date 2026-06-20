import { memo, useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';

function MessageBubble({ role, content }) {
    const [copied, setCopied] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.log('[AIInsights] Copy failed', e?.message || e);
        }
    };

    const isUser = role === 'user';

    return (
        <div
            className="relative"
            onFocusCapture={() => setShowActions(true)}
            onBlurCapture={() => setShowActions(false)}
        >
            <div
                tabIndex={0}
                className="outline-none"
                aria-label={isUser ? 'User message' : 'AI message'}
            >
                {isUser ? (
                    <div className="flex justify-end">
                        <div className="max-w-[80%]">
                            <div className="inline-block rounded-2xl bg-blue-600 text-white px-4 py-2.5 text-sm leading-relaxed">
                                {content}
                            </div>
                            {showActions && (
                                <div className="mt-1 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="p-1 rounded-lg hover:bg-blue-700/20 transition-colors text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-200/60"
                                        aria-label="Copy message"
                                    >
                                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="rounded-2xl px-4 py-3 text-sm border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/40">
                                <div className="prose prose-sm max-w-none leading-relaxed text-[14px] prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0 prose-pre:bg-gray-900/95 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:p-3 prose-code:bg-gray-200/70 dark:prose-code:bg-gray-700/40 prose-code:rounded prose-code:px-1 prose-table:my-3 prose-th:bg-gray-100 dark:prose-th:bg-gray-800/60 prose-th:p-2 prose-td:p-2">
                                    {content}
                                </div>
                                {showActions && (
                                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                                        <button
                                            type="button"
                                            onClick={handleCopy}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                            aria-label="Copy message"
                                        >
                                            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(MessageBubble);
