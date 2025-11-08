import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
// 💡 Import new Firebase Auth functions
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';
import styles from './ChatStyles.module.css'; 

// ... (other imports: HistorySidebar, ChatHeader, ChatInput, ChatMessage, LoginScreen)
import HistorySidebar from './HistorySidebar';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { LoginScreen } from './LoginScreen';
import { auth } from '../firebaseConfig';

// ... (Configuration constants: API_URL, etc.)
// --- Configuration ---const VITE_API_URL = import.meta.env.VITE_API_URL;
const VITE_API_URL = import.meta.env.VITE_API_URL;

const API_URL = `${VITE_API_URL}/api/generate-course`;
const EXPORT_API_URL = `${VITE_API_URL}/api/export-course`; 
const HISTORY_LOAD_URL = `${VITE_API_URL}/api/history/load`;
const HISTORY_SAVE_URL = `${VITE_API_URL}/api/history/save`;
// ... (Helper Functions: generateSessionId, getInitialMessages) ...
const generateSessionId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);
const getInitialMessages = (message = INITIAL_AI_MESSAGE) => ([
    { sender: 'ai', content: message, isCourse: false, id: generateSessionId(), timestamp: Date.now() }
]);


// --- Main Chat App Component ---
const ChatApp = () => {
    // ... (All existing state: user, token, messages, history, etc.) ...
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [messages, setMessages] = useState(getInitialMessages());
    const [history, setHistory] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(messages[0].id);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false); 
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    // ... (Existing useEffect for onAuthStateChanged) ...
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const idToken = await currentUser.getIdToken();
                setUser(currentUser);
                setToken(idToken);
                loadHistory(idToken); 
            } else {
                setUser(null);
                setToken(null);
                setHistory([]); 
                setMessages(getInitialMessages()); 
            }
            setAuthLoading(false);
        });
        return () => unsubscribe(); 
    }, []);

    // ... (Existing useEffect for saveCurrentSession) ...
    useEffect(() => {
        if (user && token && messages.length > 1) { 
            saveCurrentSession(token, messages);
        }
    }, [messages, token, user]); 
    
    
    // --- Auth Handlers ---
    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Google login failed:", error);
            alert("Login failed. Check console for details.");
        }
    };
    
    const handleLogout = async () => {
        await signOut(auth);
    };

    // 💡 --- NEW EMAIL AUTH HANDLERS --- 💡
    const handleEmailSignUp = async (email, password) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle the rest (setting user, token, loading history)
        } catch (error) {
            console.error("Sign up failed:", error);
            // Propagate error message back to the LoginScreen
            throw new Error(getFirebaseErrorMessage(error));
        }
    };

    const handleEmailLogin = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle the rest
        } catch (error) {
            console.error("Sign in failed:", error);
            throw new Error(getFirebaseErrorMessage(error));
        }
    };

    // Helper to make Firebase errors user-friendly
    const getFirebaseErrorMessage = (error) => {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return 'This email is already in use. Please sign in.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/weak-password':
                return 'Password must be at least 6 characters long.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return 'Invalid email or password.';
            default:
                return 'An unknown error occurred. Please try again.';
        }
    };

    // ... (Rest of the functions: loadHistory, saveCurrentSession, onNewChat, etc.) ...
    // ... (handleSend, handleExport, etc.) ...
    // [All other functions remain unchanged]
    const loadHistory = async (idToken) => {
        try {
            const response = await fetch(HISTORY_LOAD_URL, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!response.ok) throw new Error("Failed to load history from server.");
            const data = await response.json();
            
            if (data.success && data.history.length > 0) {
                setHistory(data.history);
                const latestSession = data.history[0]; 
                setMessages(latestSession.messages);
                setActiveSessionId(latestSession.id);
            } else {
                setHistory([]);
                const initialMessages = getInitialMessages();
                setMessages(initialMessages);
                setActiveSessionId(initialMessages[0].id);
            }
        } catch (error) {
            console.error("History load error:", error);
        }
    };

    // src/components/ChatApp.jsx

    const saveCurrentSession = async (idToken, currentMessages) => {
        // 💡 Find the first user prompt to use as the title
        const firstUserPrompt = currentMessages.find(msg => msg.sender === 'user')?.content;
        
        // 💡 If no user prompt, keep "New Chat", otherwise use the prompt
        const title = firstUserPrompt 
            ? (firstUserPrompt.length > 30 ? firstUserPrompt.substring(0, 30) + "..." : firstUserPrompt)
            : "New Chat";

        const sessionData = {
            sessionId: activeSessionId,
            title: title, // Use the new dynamic title
            messages: currentMessages
        };

        try {
            const response = await fetch(HISTORY_SAVE_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}` 
                },
                body: JSON.stringify(sessionData)
            });
            if (!response.ok) throw new Error("Failed to save session.");
            
            // This refresh will now pull the list with the updated title
            refreshHistoryList(idToken); 

        } catch (error) {
            console.error("History save error:", error);
        }
    };

    const onLoadSession = (sessionId) => {
        const session = history.find(s => s.id === sessionId);
        if (session) {
            setMessages(session.messages);
            setActiveSessionId(sessionId);
            setSidebarOpen(false); 
        }
    };

    // src/components/ChatApp.jsx

    // ... (inside the ChatApp component)

    const onNewChat = () => {
        const newId = generateSessionId();
        
        // 1. Create the new placeholder session for the sidebar
        const newHistorySession = {
            id: newId,
            title: "New Chat", // This is the placeholder title
            messages: [], // Start with empty messages for the history
            timestamp: new Date().toISOString()
        };

        // 2. Create the initial message for the main chat window
        const initialMessages = [{ 
            sender: 'ai', 
            content: INITIAL_AI_MESSAGE, 
            id: newId, 
            isCourse: false 
        }];

        // 3. Update the history state (add the new session to the top)
        // This will make it appear in the sidebar immediately.
        setHistory(prevHistory => [newHistorySession, ...prevHistory]);

        // 4. Set the new state for the chat window
        setMessages(initialMessages);
        setActiveSessionId(newId);
        setSidebarOpen(false);
        setInput('');
    };
    
    // ... (rest of your ChatApp component)

    // src/components/ChatApp.jsx (Replace the onClearHistory function)

    const onClearHistory = async () => {
        // 1. Confirm with the user
        if (!window.confirm("Are you sure you want to delete all chat history? This action cannot be undone.")) {
            return;
        }

        if (!token) {
            alert("You must be logged in to clear history.");
            return;
        }

        try {
            // 2. Call the new DELETE endpoint
            const response = await fetch('http://localhost:3001/api/history/clear', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to clear history on the server.');
            }

            const data = await response.json();
            console.log(data.message);

            // 3. Clear local state and start a new chat
            setHistory([]);
            onNewChat(); // This already resets the chat window

        } catch (error) {
            console.error("Clear history error:", error);
            alert("Failed to clear history: " + error.message);
        }
    };

    const handleExport = async (courseData) => {
        if (!courseData || !courseData.title) {
            alert("Error: No valid course data found to export.");
            return;
        }
        try {
          const response = await fetch(EXPORT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course: courseData }), 
          });
          if (!response.ok) throw new Error(`Server export failed. Status: ${response.status}`);
    
          const blob = await response.blob();
          const cleanTitle = courseData.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
          const filename = `Course_Outline_${cleanTitle}.pdf`;
    
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url); 
        } catch (error) {
          console.error('Export Error:', error);
          alert('Failed to export course: ' + error.message);
        }
    };

    const handleSend = async () => {
        if (input.trim() === '' || loading) return;

        const userPrompt = input.trim();
        const newUserMessage = { sender: 'user', content: userPrompt, isCourse: false };

        setMessages((prev) => [...prev, newUserMessage]);
        setInput('');
        setLoading(true); 

        const loadingMessage = { sender: 'ai', content: 'Generating course outline...', isCourse: false, isLoading: true };
        setMessages((prev) => [...prev, loadingMessage]);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userPrompt }),
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const data = await response.json();
            setMessages((prev) => prev.slice(0, -1));

            if (data.success && data.course) {
                const aiResponse = { sender: 'ai', content: data.course, isCourse: true };
                setMessages((prev) => [...prev, aiResponse]);
            } else {
                 const errorResponse = { sender: 'ai', content: `Error: ${data.error || 'Unknown error'}.`, isCourse: false };
                setMessages((prev) => [...prev, errorResponse]);
            }

        } catch (error) {
            setMessages((prev) => prev.slice(0, -1)); 
            const errorResponse = { sender: 'ai', content: `Connection Error: ${error.message}`, isCourse: false };
            setMessages((prev) => [...prev, errorResponse]);
        } finally {
            setLoading(false); 
        }
    };
    
    // --- Render Logic ---
    if (authLoading) {
        return (
            <div className={styles.appContainer} style={{justifyContent: 'center', alignItems: 'center'}}>
                <Loader2 className={styles.loaderSpinner} /> Authenticating...
            </div>
        );
    }

    if (!user) {
        // 💡 Pass the new handlers to the LoginScreen
        return <LoginScreen 
            handleGoogleLogin={handleGoogleLogin} 
            handleEmailLogin={handleEmailLogin}
            handleEmailSignUp={handleEmailSignUp}
        />;
    }

    // ... (The rest of the return statement for the logged-in app) ...
    return (
        <div className={styles.appContainer}>
            <div className={`${styles.sidebarWrapper} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                <HistorySidebar 
                    history={history} 
                    onLoadSession={onLoadSession} 
                    onClearHistory={onClearHistory}
                    activeSessionId={activeSessionId}
                />
            </div>

            <div className={styles.mainContent}>
                <ChatHeader 
                    user={user}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    onNewChat={onNewChat}
                    onLogout={handleLogout}
                />

                <div className={styles.chatArea}>
                    {messages.map((msg, index) => (
                        <ChatMessage
                            key={msg.id || index}
                            sender={msg.sender}
                            content={msg.content}
                            isCourse={msg.isCourse}
                            isLoading={index === messages.length - 1 && msg.isLoading}
                            onExport={handleExport}
                        />
                    ))}
                </div>

                <ChatInput
                    input={input}
                    setInput={setInput}
                    loading={loading}
                    onSend={handleSend}
                />
            </div>
        </div>
    );
};

export default ChatApp;