import React from 'react';
import styles from './ChatStyles.module.css';

// Props: onToggleSidebar, onNewChat, onLogout (matches ChatApp.jsx usage)
const ChatHeader = ({ onToggleSidebar, onNewChat, onLogout }) => {
  return (
    <header className={styles.chatHeader}>
      {/* Sidebar Toggle Button */}
      <button
        className={styles.iconButton}
        onClick={onToggleSidebar}
        title="Toggle Sidebar"
        aria-label="Toggle sidebar"
      >
        <svg className={styles.iconMd} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Logo */}
      <a
        href="/"
        className={styles.headerLogo}
        title="Course Aura"
      >
        <img
          src="/logo-horizontal.jpeg"
          alt="Course Aura AI Logo"
          className={styles.logoImage}
          onError={(e) => {
            // Fallback if logo image is missing
            e.target.style.display = 'none';
            e.target.parentElement.querySelector('.logoFallback').style.display = 'block';
          }}
        />
        <span className="logoFallback" style={{ display: 'none', fontWeight: 700, fontSize: '1.1rem' }}>
          Course Aura
        </span>
      </a>

      {/* Right Side Actions */}
      <div className={styles.headerActions}>
        <button
          className={styles.newChatButton}
          onClick={onNewChat}
        >
          + New Course
        </button>
        <button
          className={styles.iconButton}
          onClick={onLogout}
          title="Logout"
          aria-label="Logout"
        >
          <svg className={styles.iconMd} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;