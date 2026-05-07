import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Copy, Check, RefreshCw } from 'lucide-react';
import { getAIInsight } from '../../lib/apiClient';
import './AIInsights.css';

const SAMPLE_PROMPTS = [
  'Analyze my revenue trend: Q1=$42k, Q2=$38k, Q3=$51k, Q4=$67k. What are the key takeaways?',
  'My user churn rate is 8% this month, up from 5% last month. What could be causing this?',
  'Compare these two campaigns: Campaign A had 5000 clicks, 2% conversion, $2 CPC. Campaign B had 8000 clicks, 1.2% conversion, $1.5 CPC.',
  'My top 3 products by revenue: Product A $32k, Product B $18k, Product C $9k. How should I prioritize my roadmap?',
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
    <div className="ai-container">
      {/* Header */}
      <div className="ai-header-section bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50/50 dark:from-slate-950/50 dark:to-purple-950/30 shadow-sm mx-2 sm:mx-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">AI Data Analyst</h1>
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5 max-w-md">Secure backend proxy + Groq AI 🔒</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button 
              onClick={handleReset}
              className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all flex items-center gap-1.5 shadow-sm border border-gray-200 dark:border-gray-700 whitespace-nowrap ml-auto sm:ml-0"
            >
              <RefreshCw size={12} className="shrink-0" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Conversation */}
      {messages.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm font-medium text-gray-500 mb-3">Try a sample prompt:</p>
          <div className="space-y-2">
            {SAMPLE_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="w-full text-left text-sm px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all text-gray-600 dark:text-gray-400"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="ai-messages max-w-4xl mx-auto px-4 sm:px-0">
          {messages.map((msg, i) => (
            <InsightMessage key={i} role={msg.role} content={msg.content} />
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Loader2 size={14} className="text-white animate-spin" />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 text-sm text-gray-500">
                <span className="inline-flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
                Analyzing your data...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="ai-input-section">
        <div className="max-w-2xl mx-auto px-2 sm:px-0">
          <div className="flex gap-2 items-end bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl p-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Paste your data, metrics, or ask questions... (Shift+Enter for new line, Enter to send)"
              className="ai-textarea flex-1 min-h-[44px] sm:min-h-[48px]"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-2 rounded-lg flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10"
              aria-label="Send message"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 text-center opacity-70 max-w-md mx-auto">
            💡 Shift+Enter for new lines • Supports data analysis, trends, comparisons
          </p>
        </div>
      </div>
    </div>
  );
}
