import React from 'react';
import { Send, Loader2 } from 'lucide-react';
import styles from './ChatStyles.module.css';

const ChatInput = ({ input, setInput, loading, onSend }) => {
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div className={styles.inputContainer}>
            <div className={styles.inputWrapper}>
                <textarea
                    className={styles.inputField}
                    rows="2"
                    placeholder={loading ? "Please wait for the response..." : "Describe your course idea..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className={`${styles.sendButton} ${loading ? styles.loadingButton : ''}`}
                    onClick={onSend}
                    aria-label="Send message and generate course"
                    disabled={loading}
                >
                    {loading ? <Loader2 className={styles.loaderSpinner} /> : <Send className={styles.icon} />} 
                    {loading ? 'Generating...' : 'Generate'}
                </button>
            </div>
            <p className={styles.inputHint}>
                Press Enter to send. Use Shift+Enter for a new line.
            </p>
        </div>
    );
};

export default ChatInput;