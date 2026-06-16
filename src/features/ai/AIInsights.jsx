import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Copy, Check, RefreshCw, TrendingUp, Users, Target, Package } from 'lucide-react';
import { getAIInsight } from '../../lib/apiClient';
import './AIInsights.css';

const ANALYSIS_TYPES = [
  {
    text: 'Analyze project completion trends and identify bottlenecks.',
    icon: TrendingUp,
    title: 'Project Performance',
    description: 'Analyze project completion trends, project progress, and delivery performance',
  },
  {
    text: 'Analyze team productivity and workload distribution.',
    icon: Users,
    title: 'Team Productivity',
    description: 'Review team workload, contribution patterns, and productivity metrics',
  },
  {
    text: 'Analyze recent activity logs and highlight key trends.',
    icon: Target,
    title: 'Activity Insights',
    description: 'Review activity logs and identify engagement patterns',
  },
  {
    text: 'Analyze dashboard metrics and identify improvement opportunities.',
    icon: Package,
    title: 'Dashboard Analytics',
    description: 'Summarize dashboard metrics and overall workspace health',
  },
];

function InsightMessage({ role, content }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  // Parse markdown-style formatting
  const lines = content.split('\n').filter(line => line.trim());

  return (
    <div className="flex gap-3 group">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
        <Sparkles size={14} className="text-white" />
      </div>
      <div className="flex-1">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl rounded-tl-sm p-4 text-sm text-gray-700 dark:text-gray-300 space-y-2 border border-gray-100 dark:border-gray-700">
          {lines.map((line, i) => {
            const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');
            const boldMatch = line.match(/\*\*(.*?)\*\*/g);

            let processedLine = line;
            if (boldMatch) {
              boldMatch.forEach(bold => {
                const text = bold.replace(/\*\*/g, '');
                processedLine = processedLine.replace(bold, `<strong class="text-gray-900 dark:text-white">${text}</strong>`);
              });
            }

            if (isBullet) {
              const bulletChar = line[0];
              const rest = line.substring(1).trim();
              return (
                <div key={i} className="flex gap-2">
                  <span className="text-blue-500 mt-0.5 flex-shrink-0">{bulletChar}</span>
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

export default function AIInsights() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesContainerRef = useRef(null);

  // Controlled auto-scroll to bottom - prevents header overlap
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (text) => {
    const prompt = text || input.trim();
    if (!prompt || loading) return;

    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setLoading(true);

    try {
      const response = await getAIInsight(prompt);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `⚠️ **Error**: ${err.message}\n\nBackend proxy unavailable—using mock responses.` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
    setError(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Bar */}
      <div className="shrink-0 flex items-center justify-between px-2 sm:px-0 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Insights</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Analyze projects, teams, activity logs, and workspace performance using AI.</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all flex items-center gap-1.5 border border-gray-200 dark:border-gray-700"
          >
            <RefreshCw size={12} className="shrink-0" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        )}
      </div>

      {/* Scrollable Middle Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <>
            {/* Analysis Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2 sm:px-0 py-6">
              {ANALYSIS_TYPES.map((type, i) => {
                const Icon = type.icon;
                return (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-700 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Icon size={24} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{type.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{type.description}</p>
                        <button
                          onClick={() => handleSend(type.text)}
                          className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          Analyze
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <>
            {/* Conversation Container */}
            <div className="max-w-3xl mx-auto px-2 sm:px-0 py-6">
              <div className="space-y-6">
                {messages.map((msg, i) => (
                  <InsightMessage key={i} role={msg.role} content={msg.content} />
                ))}
                {loading && (
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
                      Analyzing your data...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Input Bar */}
      <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-2 sm:px-0 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md p-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about projects, team productivity, activity logs, or dashboard metrics..."
              className="w-full text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 rounded-lg px-3 py-2 resize-y outline-none border-none min-h-[48px] sm:min-h-[52px] max-h-[120px] transition-all duration-200 ease-in-out"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="absolute bottom-2.5 right-2.5 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-9 h-9"
              aria-label="Send message"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
