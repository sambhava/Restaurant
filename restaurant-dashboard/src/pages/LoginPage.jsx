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

function ShieldCheckIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <path d="m9 12 2 2 4-4"></path>
        </svg>
    );
}

export default function LoginPage() {
    // Mode: 'credentials' | 'twofactor' | 'forgot'
    const [mode, setMode] = useState('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // 2FA OTP State
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [sentOtpCode, setSentOtpCode] = useState('');
    const [otpExpiry, setOtpExpiry] = useState(null);
    const [resendTimer, setResendTimer] = useState(0);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    const [notice, setNotice] = useState('');
    const [customError, setCustomError] = useState('');

    const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

    const {
        user,
        restaurantId,
        accountStatus,
        twoFactorVerified,
        login,
        logout,
        setTwoFactorVerified,
        resetPassword,
        loading,
        error,
        clearError,
    } = useAuthStore();
    const navigate = useNavigate();

    // Auto-redirect when authenticated, active, and 2FA verified
    useEffect(() => {
        if (user && restaurantId && accountStatus === 'active' && twoFactorVerified) {
            navigate('/dashboard/orders', { replace: true });
        }
    }, [user, restaurantId, accountStatus, twoFactorVerified, navigate]);

    // If already authenticated via Firebase but not 2FA verified in this session, transition to 2FA step
    useEffect(() => {
        if (user && restaurantId && accountStatus === 'active' && !twoFactorVerified && mode === 'credentials') {
            if (user.email && !email) {
                setEmail(user.email);
            }
            setMode('twofactor');
            // If we don't have an active OTP code generated yet, trigger sending
            if (!sentOtpCode && !sendingOtp) {
                triggerSendOtp(user.email);
            }
        }
    }, [user, restaurantId, accountStatus, twoFactorVerified, mode]);

    // Resend countdown timer
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const triggerSendOtp = async (targetEmail) => {
        const destEmail = (targetEmail || email).trim().toLowerCase();
        if (!destEmail) return;

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
                body: JSON.stringify({ email: destEmail, code: generatedCode }),
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
                    : `Security code sent to ${destEmail}. Check your inbox and spam folder.`
            );
            setResendTimer(60);
            setTimeout(() => otpRefs[0].current?.focus(), 100);
        } catch (err) {
            console.error('Error triggering 2FA OTP:', err);
            setCustomError('Failed to reach verification server. Check your internet connection.');
        } finally {
            setSendingOtp(false);
        }
    };

    // Step 1: Submit email & password -> Authenticate with Firebase -> Trigger 2FA OTP
    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        clearError();
        setCustomError('');
        setNotice('');

        if (!email.trim() || !password) {
            setCustomError('Please enter both email and password.');
            return;
        }

        try {
            await login(email, password);
            // Firebase Auth successful! Now initiate Step 2 (2FA OTP)
            setMode('twofactor');
            await triggerSendOtp(email);
        } catch {
            // Surfaced via store's `error` state
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

    // Step 2: Verify OTP -> Grant 2FA Access -> Navigate to Dashboard
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        clearError();
        setCustomError('');
        setNotice('');

        const enteredCode = otpDigits.join('');
        if (enteredCode.length < 6) {
            setCustomError('Please enter the full 6-digit verification code.');
            return;
        }

        if (otpExpiry && Date.now() > otpExpiry) {
            setCustomError('Verification code has expired. Click resend to receive a new code.');
            return;
        }

        if (enteredCode !== sentOtpCode) {
            setCustomError('Incorrect verification code. Please check your email and try again.');
            return;
        }

        // 2FA Verified!
        setVerifyingOtp(true);
        setNotice('✓ 2FA Verified successfully! Redirecting to dashboard…');
        setTwoFactorVerified(true);

        setTimeout(() => {
            navigate('/dashboard/orders', { replace: true });
        }, 800);
    };

    const handleBackToCredentials = async () => {
        clearError();
        setCustomError('');
        setNotice('');
        setOtpDigits(['', '', '', '', '', '']);
        setSentOtpCode('');
        setOtpExpiry(null);
        await logout();
        setMode('credentials');
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        clearError();
        setCustomError('');
        setNotice('');
        try {
            await resetPassword(email);
            setNotice(
                `If an account exists for ${email}, a password reset link is on its way. Check your inbox and spam folder.`
            );
        } catch {
            // Surfaced via error state
        }
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
                        {mode === 'credentials'
                            ? 'Sign in with your email and password'
                            : mode === 'twofactor'
                            ? 'Two-Factor Authentication (2FA)'
                            : 'Reset your password'}
                    </p>
                </div>

                {/* Minimal Step Indicator (1 and 2) */}
                {mode !== 'forgot' && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginBottom: '24px',
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: '700',
                            background: mode === 'twofactor' ? '#10B981' : '#F59E0B',
                            color: '#FFFFFF',
                            boxShadow: mode === 'credentials' ? '0 0 10px rgba(245, 158, 11, 0.35)' : 'none',
                            transition: 'all 0.25s ease',
                        }}>
                            {mode === 'twofactor' ? '✓' : '1'}
                        </div>
                        <div style={{
                            width: '40px',
                            height: '2px',
                            background: mode === 'twofactor' ? '#10B981' : '#E2E8F0',
                            transition: 'all 0.25s ease',
                        }} />
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: '700',
                            background: mode === 'twofactor' ? '#F59E0B' : '#F1F5F9',
                            color: mode === 'twofactor' ? '#FFFFFF' : '#94A3B8',
                            border: mode === 'twofactor' ? 'none' : '1.5px solid #E2E8F0',
                            boxShadow: mode === 'twofactor' ? '0 0 10px rgba(245, 158, 11, 0.35)' : 'none',
                            transition: 'all 0.25s ease',
                        }}>
                            2
                        </div>
                    </div>
                )}

                {/* Step 1: Email & Password */}
                {mode === 'credentials' && (
                    <form onSubmit={handleCredentialsSubmit} className="login-form">
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

                        <button type="submit" className="login-btn" disabled={loading || sendingOtp}>
                            {loading || sendingOtp ? 'Verifying credentials…' : 'Continue to 2FA Verification →'}
                        </button>
                    </form>
                )}

                {/* Step 2: Two-Factor (2FA) Email OTP Verification */}
                {mode === 'twofactor' && (
                    <form onSubmit={handleVerifyOtp} className="login-form">
                        {(error || customError) && (
                            <div className="login-error">{customError || formatAuthError(error)}</div>
                        )}
                        {notice && <div className="login-success">{notice}</div>}

                        <div className="form-group" style={{ marginTop: '4px' }}>
                            <label style={{ textAlign: 'center', marginBottom: '8px', display: 'block', fontSize: '13px', fontWeight: 600 }}>
                                6-Digit Verification Code
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
                                            width: '46px',
                                            height: '52px',
                                            textAlign: 'center',
                                            fontSize: '22px',
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

                        <button type="submit" className="login-btn" disabled={verifyingOtp || loading}>
                            {verifyingOtp ? 'Verifying Code…' : 'Verify & Access Dashboard →'}
                        </button>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: '6px' }}>
                            <button
                                type="button"
                                onClick={handleBackToCredentials}
                                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontWeight: 500 }}
                            >
                                ← Switch account
                            </button>

                            <button
                                type="button"
                                disabled={resendTimer > 0 || sendingOtp}
                                onClick={() => triggerSendOtp(email)}
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

                {/* Mode 3: Forgot Password */}
                {mode === 'forgot' && (
                    <form onSubmit={handleForgot} className="login-form">
                        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px', textAlign: 'center' }}>
                            Enter your registered email and we'll send you a link to reset your password.
                        </p>

                        {notice && <div className="login-success">{notice}</div>}
                        {(error || customError) && (
                            <div className="login-error">{customError || formatAuthError(error)}</div>
                        )}

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
                            {loading ? 'Sending link…' : 'Send reset link'}
                        </button>

                        <div className="otp-footer" style={{ justifyContent: 'center', marginTop: '8px' }}>
                            <button
                                type="button"
                                className="back-btn"
                                onClick={() => {
                                    clearError();
                                    setCustomError('');
                                    setNotice('');
                                    setMode('credentials');
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
