import { useState, useEffect, useRef } from 'react';
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
    return code;
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
    // Mode: 'password' | 'otp' | 'forgot'
    const [mode, setMode] = useState('password');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // OTP State
    const [otpStep, setOtpStep] = useState('request'); // 'request' | 'verify'
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [sentOtpCode, setSentOtpCode] = useState('');
    const [otpExpiry, setOtpExpiry] = useState(null);
    const [resendTimer, setResendTimer] = useState(0);
    const [sendingOtp, setSendingOtp] = useState(false);

    const [notice, setNotice] = useState('');
    const [customError, setCustomError] = useState('');

    const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

    const { user, restaurantId, accountStatus, login, resetPassword, loading, error, clearError } =
        useAuthStore();
    const navigate = useNavigate();

    // Auto-redirect when authenticated and active
    useEffect(() => {
        if (user && restaurantId && accountStatus === 'active') {
            navigate('/dashboard/orders', { replace: true });
        }
    }, [user, restaurantId, accountStatus, navigate]);

    // Resend countdown timer
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        clearError();
        setCustomError('');
        setNotice('');
        try {
            await login(email, password);
        } catch {
            // Surfaced via store's `error`.
        }
    };

    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        if (!email.trim()) {
            setCustomError('Please enter your email address.');
            return;
        }

        clearError();
        setCustomError('');
        setNotice('');
        setSendingOtp(true);

        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        setSentOtpCode(generatedCode);
        setOtpExpiry(Date.now() + 10 * 60 * 1000); // 10 minutes

        try {
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase(), code: generatedCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                setCustomError(data.error || 'Could not send verification email. Please try again.');
                setSendingOtp(false);
                return;
            }

            setNotice(
                data.simulated
                    ? `[Dev Mode] Verification code logged to console: ${generatedCode}`
                    : `Verification code sent to ${email}. Check your inbox and spam folder.`
            );
            setOtpStep('verify');
            setResendTimer(60);
            setTimeout(() => otpRefs[0].current?.focus(), 100);
        } catch (err) {
            console.error('Error triggering OTP:', err);
            setCustomError('Failed to reach OTP server. Check your internet connection.');
        } finally {
            setSendingOtp(false);
        }
    };

    const handleOtpChange = (index, value) => {
        const char = value.slice(-1);
        if (char && !/^\d$/.test(char)) return;

        const updated = [...otpDigits];
        updated[index] = char;
        setOtpDigits(updated);

        if (char && index < 5) {
            otpRefs[index + 1].current?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpRefs[index - 1].current?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').trim();
        if (/^\d{6}$/.test(pasted)) {
            const chars = pasted.split('');
            setOtpDigits(chars);
            otpRefs[5].current?.focus();
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        clearError();
        setCustomError('');
        setNotice('');

        const enteredCode = otpDigits.join('');
        if (enteredCode.length < 6) {
            setCustomError('Please enter the complete 6-digit verification code.');
            return;
        }

        if (Date.now() > otpExpiry) {
            setCustomError('Verification code has expired. Click resend to get a new code.');
            return;
        }

        if (enteredCode !== sentOtpCode) {
            setCustomError('Incorrect verification code. Please check the code in your email.');
            return;
        }

        // OTP match confirmed
        setNotice('✓ Verification successful! Redirecting to your dashboard…');
        setTimeout(() => {
            navigate('/dashboard/orders', { replace: true });
        }, 1200);
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        clearError();
        setCustomError('');
        setNotice('');
        try {
            await resetPassword(email);
        } catch {
            // Surfaced via error state
        }
        setNotice(
            `If an account exists for ${email}, a password reset link is on its way. Check your inbox and spam folder.`
        );
    };

    // Unprovisioned or Inactive/Paused screen
    if (user && (accountStatus === 'unprovisioned' || (accountStatus && accountStatus !== 'active'))) {
        const isPaused = accountStatus === 'paused';
        const isCancelled = accountStatus === 'cancelled';

        return (
            <div className="login-page">
                <div className="login-card">
                    <div className="login-header">
                        <h1>
                            {isPaused
                                ? '⏸️ Subscription Paused'
                                : isCancelled
                                ? '⛔ Subscription Ended'
                                : 'Almost there'}
                        </h1>
                        <p>
                            {isPaused
                                ? 'Your restaurant subscription is currently on hold'
                                : isCancelled
                                ? 'This workspace has been closed'
                                : "Your account isn't active yet"}
                        </p>
                    </div>
                    <p style={{ fontSize: '14px', color: '#475569', textAlign: 'center', lineHeight: 1.7 }}>
                        {isPaused
                            ? 'Your subscription was paused by the platform administrator. Access to the dashboard and live QR ordering are temporarily disabled. Please contact support to resume your plan.'
                            : isCancelled
                            ? 'Your subscription for this restaurant has expired or was terminated. If you would like to reactivate your access, please get in touch with our team.'
                            : "We've received your registration. Once your payment is confirmed we'll activate your workspace and email you — usually the same working day."}
                    </p>
                    <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginTop: '14px' }}>
                        Need help? Email <strong>sambhavajain512@gmail.com</strong> or message on WhatsApp.
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
                        {mode === 'password'
                            ? 'Sign in with Password'
                            : mode === 'otp'
                            ? 'Sign in with Email OTP'
                            : 'Reset your password'}
                    </p>
                </div>

                {/* Login Mode Toggle (Password vs OTP) */}
                {mode !== 'forgot' && (
                    <div style={{
                        display: 'flex',
                        background: '#F1F5F9',
                        padding: '4px',
                        borderRadius: '10px',
                        marginBottom: '24px',
                        gap: '4px'
                    }}>
                        <button
                            type="button"
                            onClick={() => {
                                setMode('password');
                                clearError();
                                setCustomError('');
                                setNotice('');
                            }}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: mode === 'password' ? '700' : '500',
                                background: mode === 'password' ? '#FFFFFF' : 'transparent',
                                color: mode === 'password' ? '#0F172A' : '#64748B',
                                boxShadow: mode === 'password' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            🔑 Password
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setMode('otp');
                                setOtpStep('request');
                                clearError();
                                setCustomError('');
                                setNotice('');
                            }}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: mode === 'otp' ? '700' : '500',
                                background: mode === 'otp' ? '#FFFFFF' : 'transparent',
                                color: mode === 'otp' ? '#0F172A' : '#64748B',
                                boxShadow: mode === 'otp' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            ✉️ Email OTP
                        </button>
                    </div>
                )}

                {/* Mode 1: Password Login */}
                {mode === 'password' && (
                    <form onSubmit={handlePasswordLogin} className="login-form">
                        {(error || customError) && (
                            <div className="login-error">{customError || formatAuthError(error)}</div>
                        )}
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
                                        setCustomError('');
                                        setNotice('');
                                        setMode('forgot');
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

                {/* Mode 2: Email OTP Login */}
                {mode === 'otp' && (
                    <div className="login-form">
                        {(error || customError) && (
                            <div className="login-error">{customError || formatAuthError(error)}</div>
                        )}
                        {notice && <div className="login-success">{notice}</div>}

                        {otpStep === 'request' ? (
                            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="form-group">
                                    <label htmlFor="otp-email">Registered Email Address</label>
                                    <input
                                        id="otp-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="owner@restaurant.com"
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                                <button type="submit" className="login-btn" disabled={sendingOtp}>
                                    {sendingOtp ? 'Sending OTP…' : 'Send Verification Code ✉️'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div className="form-group">
                                    <label style={{ textAlign: 'center', marginBottom: '8px', display: 'block' }}>
                                        Enter 6-Digit Code
                                    </label>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '8px',
                                            justifyContent: 'center',
                                        }}
                                        onPaste={handleOtpPaste}
                                    >
                                        {otpDigits.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                ref={otpRefs[idx]}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                                style={{
                                                    width: '44px',
                                                    height: '50px',
                                                    textAlign: 'center',
                                                    fontSize: '20px',
                                                    fontWeight: '700',
                                                    borderRadius: '8px',
                                                    border: '1.5px solid var(--border)',
                                                    background: 'var(--surface-2)',
                                                    color: 'var(--text)',
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="login-btn" disabled={loading}>
                                    Verify & Sign In →
                                </button>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: '6px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setOtpStep('request')}
                                        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                                    >
                                        ← Change email
                                    </button>

                                    <button
                                        type="button"
                                        disabled={resendTimer > 0 || sendingOtp}
                                        onClick={handleSendOtp}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: resendTimer > 0 ? '#94A3B8' : 'var(--accent, #E8A54B)',
                                            fontWeight: 600,
                                            cursor: resendTimer > 0 ? 'default' : 'pointer',
                                        }}
                                    >
                                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* Mode 3: Forgot Password */}
                {mode === 'forgot' && (
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
                                    setCustomError('');
                                    setNotice('');
                                    setMode('password');
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
