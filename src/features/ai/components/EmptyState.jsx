import { memo } from 'react';

function EmptyState({ analysisCards, onAnalyze }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2 sm:px-0 py-6 max-w-4xl mx-auto">
            {analysisCards.map((type, i) => {
                const Icon = type.icon;

                return (
                    <div
                        key={i}
                        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-700 transition-all"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                <Icon size={24} className="text-blue-600 dark:text-blue-400" />
                            </div>

                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                    {type.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {type.description}
                                </p>

                                <button
                                    onClick={() => onAnalyze(type.text)}
                                    className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    Analyze
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default memo(EmptyState);
