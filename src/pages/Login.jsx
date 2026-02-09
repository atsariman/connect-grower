import React, { useState } from "react";
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Email verification state removed as we are making it optional
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            navigate("/");
        } catch (err) {
            setError("Google Sign In Failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Basic Validation
        if (!isLogin && password !== confirmPassword) {
            setError("Passwords do not match!");
            setLoading(false);
            return;
        }

        if (!isLogin && name.trim() === "") {
            setError("Please enter your name.");
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                // Login Logic
                await signInWithEmailAndPassword(auth, email, password);

                // Optional: We can show a warning if email is not verified, but let them in
                // if (!userCredential.user.emailVerified) { ... }

                navigate("/");
            } else {
                // Sign Up Logic
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                // Update Profile with Name
                await updateProfile(userCredential.user, {
                    displayName: name
                });

                // Send Verification Email (Optional background process)
                try {
                    await sendEmailVerification(userCredential.user);
                } catch (verifyError) {
                    console.error("Verification email failed:", verifyError);
                    // Continue anyway, don't block user
                }

                // DIRECT LOGIN: Do not sign out. Just navigate to Home.
                // We treat them as logged in immediately.
                navigate("/");
            }
        } catch (err) {
            console.error(err);
            // Friendly Error Messages
            if (err.code === 'auth/email-already-in-use') {
                setError("This email is already registered.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            } else if (err.code === 'auth/invalid-email') {
                setError("Please enter a valid email address.");
            } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError("Invalid email or password.");
            } else {
                setError("Authentication Failed: " + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError("");
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
    };

    return (
        <div style={{
            minHeight: "85vh",
            padding: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%"
        }}>
            <div className="glass-panel" style={{ padding: "40px", width: "100%", maxWidth: "450px", textAlign: "center" }}>
                <Link to="/" style={{ textDecoration: 'none', display: 'block', marginBottom: '25px' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                        🌱 ConnectGrower
                    </span>
                </Link>

                {/* Tab Switcher */}
                <div style={{ display: 'flex', marginBottom: '25px', borderBottom: '2px solid #eee' }}>
                    <button
                        onClick={() => !isLogin && toggleMode()}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: 'none',
                            border: 'none',
                            borderBottom: isLogin ? '2px solid var(--primary-color)' : 'none',
                            color: isLogin ? 'var(--primary-color)' : '#999',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => isLogin && toggleMode()}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: 'none',
                            border: 'none',
                            borderBottom: !isLogin ? '2px solid var(--primary-color)' : 'none',
                            color: !isLogin ? 'var(--primary-color)' : '#999',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        Sign Up
                    </button>
                </div>

                <h2 style={{ color: "var(--text-primary)", marginBottom: "20px", fontSize: '1.4rem' }}>
                    {isLogin ? "Welcome Back! 👋" : "Create Account"}
                </h2>

                {error && (
                    <div style={{ background: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'left' }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {!isLogin && (
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px', display: 'block' }}>Full Name</label>
                            <input
                                type="text"
                                placeholder="ex. John Farmer"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required={!isLogin}
                                style={{ width: '100%', padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: '1rem', boxSizing: 'border-box' }}
                            />
                        </div>
                    )}

                    <div style={{ textAlign: 'left' }}>
                        <label style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px', display: 'block' }}>Email Address</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '100%', padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: '1rem', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px', display: 'block' }}>Password</label>
                        <input
                            type="password"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: '1rem', boxSizing: 'border-box' }}
                        />
                    </div>

                    {!isLogin && (
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px', display: 'block' }}>Confirm Password</label>
                            <input
                                type="password"
                                placeholder="********"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required={!isLogin}
                                style={{ width: '100%', padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: '1rem', boxSizing: 'border-box' }}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "14px",
                            fontSize: '1rem',
                            marginTop: '10px',
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? "Processing..." : (isLogin ? "Log In" : "Create Account")}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: "25px 0", color: "#888" }}>
                    <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
                    <span style={{ padding: '0 10px', fontSize: '0.8rem' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="btn"
                    style={{
                        width: "100%",
                        padding: "12px",
                        background: "white",
                        border: "1px solid #ddd",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        color: "#555",
                        fontSize: '1rem',
                        transition: 'background 0.2s',
                        opacity: loading ? 0.7 : 1,
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                    onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#f5f5f5')}
                    onMouseOut={(e) => !loading && (e.currentTarget.style.background = 'white')}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px', height: '18px' }} />
                    Sign in with Google
                </button>
            </div>
        </div>
    );
};

export default Login;
