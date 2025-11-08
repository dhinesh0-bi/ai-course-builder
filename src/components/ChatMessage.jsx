import React from 'react';
import { Loader2 } from 'lucide-react';
import styles from './ChatStyles.module.css';
import { CourseOutput } from './ChatOutput'; 

export const ChatMessage = ({ sender, content, isCourse, isLoading, onExport }) => {
    return (
        <div className={`${styles.messageContainer} ${sender === 'user' ? styles.userMessage : styles.aiMessage}`}>
            <div className={styles.messageBubble}>
                <div className={styles.messageSender}>{sender === 'user' ? 'You' : 'AI Assistant'}</div>
                
                {isLoading ? (
                    <div className={styles.loadingMessage}>
                        <Loader2 className={styles.loaderSpinner} /> 
                        <p>Generating course outline...</p>
                    </div>
                ) : isCourse ? (
                    <CourseOutput content={content} onExport={onExport} />
                ) : (
                    <p>{content}</p>
                )}
            </div>
        </div>
    );
};