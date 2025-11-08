import React, { useState } from 'react';
import { LogIn, MessageSquare, UserPlus } from 'lucide-react';
import styles from './ChatStyles.module.css';

export const LoginScreen = ({ handleGoogleLogin, handleEmailLogin, handleEmailSignUp }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        if (isLoginMode) {
            // Pass email/pass to the handler from ChatApp
            handleEmailLogin(email, password).catch(err => setError(err.message));
        } else {
            // Pass email/pass to the handler from ChatApp
            handleEmailSignUp(email, password).catch(err => setError(err.message));
        }
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setError('');
        setEmail('');
        setPassword('');
    };

    return (
        <div className={styles.appContainer} style={{justifyContent: 'center', alignItems: 'center'}}>
            <div className={styles.loginCard}>
                <h2 className={styles.loginTitle}>
                    <MessageSquare className={styles.icon} /> 
                    AI Course Generator
                </h2>
                <p className={styles.loginSubtitle}>
                    {isLoginMode ? 'Sign in to continue' : 'Create an account to get started'}
                </p>

                {/* --- Email/Password Form --- */}
                <form onSubmit={handleSubmit} className={styles.loginForm}>
                    <div className={styles.formGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <p className={styles.loginError}>{error}</p>}

                    <button type="submit" className={styles.submitButton}>
                        {isLoginMode ? (
                            <> <LogIn className={styles.iconSmall} /> Sign In </>
                        ) : (
                            <> <UserPlus className={styles.iconSmall} /> Sign Up </>
                        )}
                    </button>
                </form>

                <div className={styles.divider}>or</div>

                {/* --- Google Login Button --- */}
                <button className={styles.loginButton} onClick={handleGoogleLogin}>
                    <svg className={styles.iconSmall} aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                    Sign in with Google
                </button>

                <p className={styles.toggleMode}>
                    {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={toggleMode}>
                        {isLoginMode ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </div>
        </div>
    );
};