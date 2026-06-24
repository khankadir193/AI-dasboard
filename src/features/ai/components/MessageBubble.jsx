import { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Copy, Check, Bot } from 'lucide-react';

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
            className={[
                'flex gap-3 animate-fade-in-up',
                isUser ? 'flex-row-reverse' : 'flex-row',
            ].join(' ')}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onFocusCapture={() => setShowActions(true)}
            onBlurCapture={() => setShowActions(false)}
        >
            {/* Avatar */}
            {isUser ? (
                <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                        U
                    </div>
                </div>
            ) : (
                <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                        <Sparkles size={14} className="text-white" />
                    </div>
                </div>
            )}

            {/* Message content */}
            <div className={[isUser ? 'max-w-[80%]' : 'max-w-[85%]', 'min-w-0'].join(' ')}>
                {isUser ? (
                    <div className="inline-block rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-4 py-2.5 text-sm leading-relaxed shadow-sm shadow-blue-500/20">
                        {content}
                    </div>
                ) : (
                    <div className="rounded-2xl px-4 py-3 text-sm border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/20 shadow-sm">
                        <div className="prose prose-sm max-w-none leading-relaxed text-[14px] text-gray-800 dark:text-gray-200">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}

                {/* Actions toolbar */}
                <div
                    className={[
                        'flex items-center gap-1 mt-1 transition-opacity duration-150',
                        showActions ? 'opacity-100' : 'opacity-0',
                        isUser ? 'justify-end' : 'justify-start',
                    ].join(' ')}
                >
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        aria-label="Copy message"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3 w-3" />
                                <span>Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default memo(MessageBubble);
