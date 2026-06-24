import { memo } from 'react';

const iconColors = [
    'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
];

function EmptyState({ analysisCards, onAnalyze }) {
    return (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center text-center pt-16">
            <div className="mb-8 animate-fade-in-up">
                <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent mb-2">
                    What would you like to explore?
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Ask about projects, teams, activity logs, or dashboard
                    performance
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {analysisCards.slice(0, 4).map((card, index) => {
                    const IconComponent = card.icon;
                    return (
                        <button
                            key={index}
                            onClick={() => onAnalyze(card.text)}
                            className={[
                                'text-left px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:-translate-y-0.5 hover:shadow-md bg-white dark:bg-gray-900/50 transition-all group',
                                'animate-fade-in-up',
                                `stagger-${index + 1}`,
                            ].join(' ')}
                            style={{
                                animationDelay: `${(index + 1) * 80}ms`,
                            }}
                        >
                            <div
                                className={[
                                    'w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 transition-colors',
                                    iconColors[index],
                                ].join(' ')}
                            >
                                {IconComponent && <IconComponent size={16} />}
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-0.5">
                                {card.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                {card.description}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default memo(EmptyState);
