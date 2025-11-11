import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';
import styles from './ChatStyles.module.css'; 

// Import all the new child components
import HistorySidebar from './HistorySidebar';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { LoginScreen } from './LoginScreen';

// Import Firebase config (which is one level up, in src/)
import { auth } from '../firebaseConfig';

// ------------------------------------------------------------------
// 💥 CONFIGURATION BLOCK
// ------------------------------------------------------------------
const API_URL = 'https://ai-course-builder-lpeh.onrender.com/api/generate-course';
const EXPORT_API_URL = 'https://ai-course-builder-lpeh.onrender.com/api/export-course'; 
const HISTORY_LOAD_URL = 'https://ai-course-builder-lpeh.onrender.com/api/history/load';
const HISTORY_SAVE_URL = 'https://ai-course-builder-lpeh.onrender.com/api/history/save';
const INITIAL_AI_MESSAGE = 'Hello! Describe the topic, audience, and desired duration for your new course.';

// --- Helper Functions ---
const generateSessionId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// Now this function can safely reference INITIAL_AI_MESSAGE
const getInitialMessages = (message = INITIAL_AI_MESSAGE) => ([
    { sender: 'ai', content: message, isCourse: false, id: generateSessionId(), timestamp: Date.now() }
]);

// --- Main Chat App Component ---
const ChatApp = () => {
    // --- State Declarations ---
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [messages, setMessages] = useState(getInitialMessages());
    const [history, setHistory] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(messages[0].id);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false); 
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    
    // --- Authentication Effect ---
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

    // --- Persistence Effect (Saves to MongoDB) ---
    useEffect(() => {
        // We will change this logic based on user feedback to save only on AI response
    }, []); 
    
    
    // --- Auth Handlers ---
    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed. Check console for details.");
        }
    };
    
    const handleLogout = async () => {
        await signOut(auth);
    };

    const handleEmailSignUp = async (email, password) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Sign up failed:", error);
            throw new Error(getFirebaseErrorMessage(error));
        }
    };

    const handleEmailLogin = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
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

    // --- History Functions (API Calls) ---
    
    // This function ONLY updates the history list for the sidebar
    const refreshHistoryList = async (idToken) => {
        try {
            const response = await fetch(HISTORY_LOAD_URL, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!response.ok) throw new Error("Failed to load history list.");
            const data = await response.json();
            
            if (data.success && data.history.length > 0) {
                setHistory(data.history);
            } else {
                setHistory([]);
            }
        } catch (error) {
            console.error("History refresh error:", error);
        }
    };

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
                // No history found, start a fresh session
                setHistory([]);
                const initialMessages = getInitialMessages();
                setMessages(initialMessages);
                setActiveSessionId(initialMessages[0].id);
            }
        } catch (error) {
            console.error("History load error:", error);
        }
    };

    const saveCurrentSession = async (idToken, currentMessages) => {
        const firstUserPrompt = currentMessages.find(msg => msg.sender === 'user')?.content;
        const title = firstUserPrompt 
            ? (firstUserPrompt.length > 30 ? firstUserPrompt.substring(0, 30) + "..." : firstUserPrompt)
            : "New Chat";

        const sessionData = {
            sessionId: activeSessionId,
            title: title,
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
            
            // Only refresh the sidebar list, don't reload the main chat
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

    const onNewChat = () => {
        const newId = generateSessionId();
        
        const newHistorySession = {
            id: newId,
            title: "New Chat", // Placeholder title
            messages: [],
            timestamp: new Date().toISOString()
        };

        const initialMessages = [{ 
            sender: 'ai', 
            content: INITIAL_AI_MESSAGE, 
            id: newId, 
            isCourse: false 
        }];

        // Optimistically update sidebar
        setHistory(prevHistory => [newHistorySession, ...prevHistory]);
        
        // Reset main chat window
        setMessages(initialMessages);
        setActiveSessionId(newId);
        setSidebarOpen(false);
        setInput('');
    };

    const onClearHistory = async () => {
        if (!window.confirm("Are you sure you want to delete all chat history?")) {
            return;
        }
        if (!token) {
            alert("You must be logged in to clear history.");
            return;
        }
        try {
            const response = await fetch('https://ai-course-builder-lpeh.onrender.com/api/history/clear', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to clear history on the server.');
            
            setHistory([]);
            onNewChat(); // Reset to a new, fresh chat

        } catch (error) {
            console.error("Clear history error:", error);
            alert("Failed to clear history: " + error.message);
        }
    };

    // --- Export Function ---
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

    // --- Core API Logic ---
    // src/components/ChatApp.jsx

    const handleSend = async () => {
        if (input.trim() === '' || loading) return;

        const userPrompt = input.trim();
        const newUserMessage = { sender: 'user', content: userPrompt, isCourse: false };

        let newMessagesList = [...messages, newUserMessage];
        
        setMessages(newMessagesList);
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

            // 💡 **THIS IS THE FIX (Part 1)** 💡
            // Don't throw an error yet, even if response.ok is false
            if (!response.ok) {
                let errorMsg = `Server error: ${response.status}`; // Default message
                try {
                    // Try to read the friendly JSON message from the server
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMsg = errorData.error; // e.g., "The AI model is overloaded..."
                    }
                } catch (e) {
                    // Could not parse JSON, stick with the default message
                }
                // Now throw the new, friendly error
                throw new Error(errorMsg);
            }

            const data = await response.json();
            
            setMessages((prev) => {
                const updatedList = prev.slice(0, -1); // Remove loading
                if (data.success && data.course) {
                    const aiResponse = { sender: 'ai', content: data.course, isCourse: true };
                    newMessagesList = [...updatedList, aiResponse];
                    return newMessagesList;
                } else {
                     const errorResponse = { sender: 'ai', content: `Error: ${data.error || 'Unknown error'}.`, isCourse: false };
                    newMessagesList = [...updatedList, errorResponse];
                    return newMessagesList;
                }
            });

            // Save the complete session
            if (user && token) {
                saveCurrentSession(token, newMessagesList);
            }

        } catch (error) {
            // 💡 **THIS IS THE FIX (Part 2)** 💡
            console.error("API Fetch Error:", error);
            
            // Remove the loading placeholder
            setMessages((prev) => prev.slice(0, -1)); 

            // This will now display the friendly message (e.g., "The AI model is overloaded...")
            const errorResponse = { 
                sender: 'ai', 
                content: `${error.message}`, 
                isCourse: false 
            };
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
        return <LoginScreen 
            handleGoogleLogin={handleGoogleLogin} 
            handleEmailLogin={handleEmailLogin}
            handleEmailSignUp={handleEmailSignUp}
        />;
    }

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
                            onExport={handleExport} // Pass the export handler down
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