import { memo, useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';

function MessageBubble({ role, content }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        try {
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            // Clipboard can fail in some environments; no need to break chat UI.
            console.log('[AIInsights] Copy failed', e?.message || e);
        }
    };

    if (role === 'user') {
        return (
            <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-lg text-sm">
                    {content}
                </div>
            </div>
        );
    }

    // Parse markdown-style formatting (preserve existing behavior)
    const lines = content.split('\n').filter((line) => line.trim());

    return (
        <div className="flex gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles size={14} className="text-white" />
            </div>

            <div className="flex-1">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl rounded-tl-sm p-4 text-sm text-gray-700 dark:text-gray-300 space-y-2 border border-gray-100 dark:border-gray-700">
                    {lines.map((line, i) => {
                        const isBullet =
                            line.startsWith('•') || line.startsWith('-') || line.startsWith('*');

                        const boldMatch = line.match(/\*\*(.*?)\*\*/g);

                        let processedLine = line;

                        if (boldMatch) {
                            boldMatch.forEach((bold) => {
                                const text = bold.replace(/\*\*/g, '');
                                processedLine = processedLine.replace(
                                    bold,
                                    `<strong class="text-gray-900 dark:text-white">${text}</strong>`
                                );
                            });
                        }

                        if (isBullet) {
                            const bulletChar = line[0];
                            const rest = line.substring(1).trim();

                            return (
                                <div key={i} className="flex gap-2">
                                    <span className="text-blue-500 mt-0.5 flex-shrink-0">
                                        {bulletChar}
                                    </span>
                                    <span dangerouslySetInnerHTML={{ __html: rest }} />
                                </div>
                            );
                        }

                        return <p key={i} dangerouslySetInnerHTML={{ __html: processedLine }} />;
                    })}
                </div>

                <button
                    onClick={handleCopy}
                    className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy response'}
                </button>
            </div>
        </div>
    );
}

export default memo(MessageBubble);
