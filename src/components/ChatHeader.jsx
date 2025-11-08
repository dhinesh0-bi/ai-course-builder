import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import styles from './ChatStyles.module.css';

const ChatHeader = ({ user, onToggleSidebar, onNewChat, onLogout }) => {
    return (
        <header className={styles.header}>
            <button 
                className={styles.menuButton} 
                onClick={onToggleSidebar}
            >
                <Menu className={styles.icon} />
            </button>
            
            <h1 className={styles.headerTitle}>AI Course Generator</h1>
            
            <div className={styles.headerActions}>
                <button className={styles.newChatButton} onClick={onNewChat}>
                    + New Chat
                </button>
                <button 
                    className={styles.logoutButton} 
                    onClick={onLogout} 
                    title={`Logged in as ${user.email}`}
                >
                    <LogOut className={styles.icon} />
                </button>
            </div>
        </header>
    );
};

export default ChatHeader;