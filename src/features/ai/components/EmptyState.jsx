import { memo } from 'react';

function EmptyState({ analysisCards, onAnalyze }) {
    return (
        <div className="flex flex-col items-center text-center pt-16 pb-8">
            <div className="mb-8">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    What would you like to analyze?
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                    Ask about projects, teams, activity logs, or dashboard performance
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {analysisCards.slice(0, 4).map((card, index) => (
                    <button
                        key={index}
                        onClick={() => onAnalyze(card.text)}
                        className="text-left px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group"
                    >
                        <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-0.5">
                            {card.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {card.description}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default memo(EmptyState);
