import React from 'react';
import { Trash2, Clock, Zap } from 'lucide-react';
import styles from './ChatStyles.module.css';

const HistorySidebar = ({ history, onLoadSession, onClearHistory, activeSessionId }) => {
    return (
        <div className={styles.sidebarContainer}>
            <div className={styles.sidebarHeader}>
                <Clock className={styles.sidebarIcon} />
                <h2 className={styles.sidebarTitle}>Session History</h2>
            </div>
            
            <ul className={styles.historyList}>
                {history.length > 0 ? (
                    history.map((session) => (
                        <li 
                            key={session.id} 
                            className={`${styles.historyItem} ${session.id === activeSessionId ? styles.activeHistoryItem : ''}`}
                            onClick={() => onLoadSession(session.id)}
                            title={session.title}
                        >
                            <Zap className={styles.historyItemIcon} />
                            <span className={styles.historyItemTitle}>
                                {session.title}
                            </span>
                        </li>
                    ))
                ) : (
                    <li className={styles.noHistory}>No history saved yet.</li>
                )}
            </ul>
            
            {history.length > 0 && (
                <button 
                    className={styles.clearHistoryButton}
                    onClick={onClearHistory}
                >
                    <Trash2 className={styles.historyIcon} />
                    Clear All History
                </button>
            )}
        </div>
    );
};

export default HistorySidebar;