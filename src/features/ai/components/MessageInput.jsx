import { memo, useRef, useCallback, useState, useEffect } from 'react';
import { ArrowUp, Paperclip, Mic, MicOff, Loader2 } from 'lucide-react';

const SpeechRecognitionAPI =
    window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechSupported = !!SpeechRecognitionAPI;

function MessageInput({ value, onChange, onSend, loading }) {
    const textareaRef = useRef(null);
    const lastSubmittedValueRef = useRef(null);
    const recognitionRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [speechError, setSpeechError] = useState(null);

    // Cleanup recognition on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch {
                    // ignore
                }
            }
        };
    }, []);

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
            textareaRef.current.style.height =
                Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    };

    const toggleRecording = useCallback(() => {
        if (!isSpeechSupported) return;

        if (isRecording) {
            // Stop recording
            try {
                recognitionRef.current?.stop();
            } catch {
                // ignore
            }
            setIsRecording(false);
            return;
        }

        setSpeechError(null);
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map((r) => r[0].transcript)
                .join('');
            if (transcript) {
                onChange(transcript);
            }
        };

        recognition.onerror = (event) => {
            if (event.error === 'not-allowed') {
                setSpeechError(
                    'Microphone access denied. Check browser permissions.'
                );
            } else if (event.error === 'no-speech') {
                setSpeechError('No speech detected. Try again.');
            } else {
                setSpeechError(`Error: ${event.error}`);
            }
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        try {
            recognition.start();
            recognitionRef.current = recognition;
            setIsRecording(true);
        } catch (e) {
            setSpeechError('Failed to start speech recognition.');
            setIsRecording(false);
        }
    }, [isRecording, onChange]);

    const hasText = value.trim().length > 0;
    const isDisabled = !hasText || loading;

    return (
        <div className="flex items-end gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-[20px] shadow-lg shadow-blue-500/5 focus-within:border-blue-400/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all px-3 py-2.5">
            {/* Attach file button */}
            <button
                type="button"
                disabled
                className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 dark:text-gray-500 opacity-40 cursor-not-allowed flex-shrink-0"
                aria-label="Attach file (coming soon)"
                title="Attachments coming soon"
            >
                <Paperclip size={16} />
            </button>

            {/* Textarea */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your data..."
                rows={1}
                className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none resize-none py-0.5 leading-6 max-h-[200px]"
            />

            {/* Mic button */}
            {isSpeechSupported ? (
                <button
                    type="button"
                    onClick={toggleRecording}
                    className={[
                        'flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 transition-all',
                        isRecording
                            ? 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 animate-mic-pulse'
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                    ].join(' ')}
                    aria-label={
                        isRecording ? 'Stop recording' : 'Start voice input'
                    }
                    title={
                        isRecording
                            ? 'Stop recording'
                            : 'Voice input'
                    }
                >
                    {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
            ) : (
                <button
                    type="button"
                    disabled
                    className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 dark:text-gray-500 opacity-40 cursor-not-allowed flex-shrink-0"
                    aria-label="Speech recognition not available"
                    title="Speech recognition not available in this browser"
                >
                    <Mic size={16} />
                </button>
            )}

            {/* Send button */}
            <button
                type="button"
                onClick={trySend}
                disabled={isDisabled}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 hover:scale-105 active:scale-95"
                aria-label="Send"
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <ArrowUp size={16} />
                )}
            </button>

            {/* Speech error toast */}
            {speechError && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 whitespace-nowrap shadow-lg animate-fade-in-up">
                    {speechError}
                    <button
                        onClick={() => setSpeechError(null)}
                        className="ml-2 text-red-400 hover:text-red-600"
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
}

export default memo(MessageInput);
