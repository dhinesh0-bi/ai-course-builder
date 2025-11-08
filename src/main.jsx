import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatApp from './components/ChatApp'; // 💡 IMPORT THE NEW APP
import './index.css'; // Global styles

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ChatApp /> {/* 💡 RENDER THE NEW APP */}
    </React.StrictMode>,
  );
} else {
  console.error("The 'root' element was not found. Check your index.html.");
}