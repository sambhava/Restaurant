import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

/** Turns Firebase auth error codes into something a restaurant owner can act on. */
function formatAuthError(code) {
    if (!code) return '';
    if (code.includes('too-many-requests')) {
        return 'Too many failed attempts. Please wait a few minutes, or reset your password.';
    }
    if (code.includes('network-request-failed')) {
        return 'Could not reach the server. Check your internet connection and try again.';
    }
    if (
        code.includes('invalid-credential') ||
        code.includes('user-not-found') ||
        code.includes('wrong-password') ||
        code.includes('invalid-email')
    ) {
        return 'Incorrect email or password.';
    }
    if (code.includes('user-disabled')) {
        return 'This account has been disabled. Please contact support.';
    }
    return 'Could not sign you in. Please try again.';
}

function EyeIcon({ open }) {
    return open ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    );
}

export default function LoginPage() {
    // 'credentials' | 'forgot'
    const [step, setStep] = useState('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [notice, setNotice] = useState('');

    const { user, restaurantId, accountStatus, login, resetPassword, loading, error, clearError } =
        useAuthStore();
    const navigate = useNavigate();

    // Once the profile has loaded and the account is provisioned, go to the dashboard.
    useEffect(() => {
        if (user && restaurantId && accountStatus === 'active') {
            navigate('/dashboard/orders', { replace: true });
        }
    }, [user, restaurantId, accountStatus, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        clearError();
        setNotice('');
        try {
            await login(email, password);
        } catch {
            // Surfaced via the store's `error`.
        }
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        clearError();
        setNotice('');
        try {
            await resetPassword(email);
        } catch {
            // Fall through — the message below is deliberately identical either way.
        }
        // Never reveal whether an email is registered.
        setNotice(
            `If an account exists for ${email}, a password reset link is on its way. Check your inbox and spam folder.`
        );
    };

    // Signed in, but activation hasn't provisioned this account yet.
    if (user && (accountStatus === 'unprovisioned' || (accountStatus && accountStatus !== 'active'))) {
        return (
            <div className="login-page">
                <div className="login-card">
                    <div className="login-header">
                        <h1>Almost there</h1>
                        <p>Your account isn't active yet</p>
                    </div>
                    <p style={{ fontSize: '14px', color: '#475569', textAlign: 'center', lineHeight: 1.7 }}>
                        We've received your registration. Once your payment is confirmed we'll activate your
                        workspace and email you — usually the same working day.
                    </p>
                    <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginTop: '14px' }}>
                        Need help? Get in touch and we'll sort it out.
                    </p>
                    <button
                        type="button"
                        className="login-btn"
                        style={{ marginTop: '20px' }}
                        onClick={() => useAuthStore.getState().logout()}
                    >
                        Sign out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h1>🍽️ Restaurant Dashboard</h1>
                    <p>
                        {step === 'credentials'
                            ? 'Sign in to manage your restaurant'
                            : 'Reset your password'}
                    </p>
                </div>

                {step === 'credentials' && (
                    <form onSubmit={handleLogin} className="login-form">
                        {error && <div className="login-error">{formatAuthError(error)}</div>}
                        {notice && <div className="login-success">{notice}</div>}

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="owner@restaurant.com"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="password-input-wrapper" style={{ position: 'relative', width: '100%' }}>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                    style={{ width: '100%', paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '14px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#94A3B8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px',
                                    }}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    <EyeIcon open={showPassword} />
                                </button>
                            </div>
                            <div style={{ textAlign: 'right', marginTop: '6px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        clearError();
                                        setNotice('');
                                        setStep('forgot');
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--accent, #E8A54B)',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        padding: 0,
                                    }}
                                >
                                    Forgot password?
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>
                )}

                {step === 'forgot' && (
                    <form onSubmit={handleForgot} className="login-form">
                        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px', textAlign: 'center' }}>
                            Enter your registered email and we'll send you a link to set a new password.
                        </p>

                        {notice && <div className="login-success">{notice}</div>}

                        <div className="form-group">
                            <label htmlFor="forgot-email">Email address</label>
                            <input
                                id="forgot-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="owner@restaurant.com"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Sending…' : 'Send reset link'}
                        </button>

                        <div className="otp-footer" style={{ justifyContent: 'center' }}>
                            <button
                                type="button"
                                className="back-btn"
                                onClick={() => {
                                    clearError();
                                    setNotice('');
                                    setStep('credentials');
                                }}
                            >
                                ← Back to sign in
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
