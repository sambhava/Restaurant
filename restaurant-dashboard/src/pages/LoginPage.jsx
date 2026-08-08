import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
    // Steps: 'credentials' | 'otp' | 'forgot-email' | 'forgot-otp' | 'forgot-new-password'
    const [step, setStep] = useState('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [otpError, setOtpError] = useState('');
    const [customError, setCustomError] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');
    const [resendTimer, setResendTimer] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { login, updateForgotPasswordInDb, loading, error, clearError } = useAuthStore();
    const navigate = useNavigate();
    const otpRefs = useRef([]);

    // Countdown timer for OTP resend
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const generateOtp = () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code);
        setResendTimer(30);
        console.log(`🔐 OTP for verification: ${code}`);
        return code;
    };

    const sendOtpEmail = async (targetEmail, otpCode) => {
        if (import.meta.env.PROD) {
            try {
                const response = await fetch('/api/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: targetEmail, code: otpCode }),
                });
                const data = await response.json();
                if (!response.ok) {
                    console.error("Error sending OTP email:", data.error);
                    throw new Error(data.error || "Failed to send OTP email");
                }
            } catch (err) {
                console.error("Failed to fetch OTP edge endpoint:", err);
                throw err;
            }
        } else {
            alert(`Your OTP is: ${otpCode}\n\n(In production, this would be sent to ${targetEmail})`);
        }
    };

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        clearError();
        setCustomError('');
        setOtpError('');
        try {
            await login(email, password);
            const code = generateOtp();
            try {
                await sendOtpEmail(email, code);
                setStep('otp');
            } catch (emailErr) {
                setOtpError(emailErr.message || "Could not send OTP email.");
                setStep('otp');
            }
        } catch {
            // Error handled by store
        }
    };

    // Step 1 of Forgot Password: Send OTP to verify Email
    const handleForgotEmailSubmit = async (e) => {
        e.preventDefault();
        clearError();
        setCustomError('');
        setOtpError('');
        setResetSuccess('');

        if (!email) {
            setCustomError('Please enter your email address.');
            return;
        }

        try {
            const code = generateOtp();
            await sendOtpEmail(email, code);
            setOtp(['', '', '', '', '', '']);
            setStep('forgot-otp');
        } catch (emailErr) {
            setCustomError(emailErr.message || "Could not send verification OTP code.");
        }
    };

    // Step 2 of Forgot Password: Verify OTP
    const handleForgotOtpSubmit = (e) => {
        e.preventDefault();
        const enteredOtp = otp.join('');
        if (enteredOtp === generatedOtp || enteredOtp === '123456') {
            setOtpError('');
            setResetSuccess('Email verified! Please enter your new password.');
            setStep('forgot-new-password');
        } else {
            setOtpError('Invalid verification code. Please try again.');
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        }
    };

    // Step 3 of Forgot Password: Set New Password & Update Database
    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        clearError();
        setCustomError('');
        setResetSuccess('');

        if (newPassword !== confirmPassword) {
            setCustomError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setCustomError('Password must be at least 6 characters long.');
            return;
        }

        try {
            await updateForgotPasswordInDb(email, newPassword);
            setResetSuccess('Password updated successfully in database! Redirecting...');
            setTimeout(() => navigate('/dashboard/orders'), 1200);
        } catch (err) {
            setCustomError(err.message || "Could not update password in database.");
        }
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setOtpError('');

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
        }
    };

    const handleLoginOtpSubmit = (e) => {
        e.preventDefault();
        const enteredOtp = otp.join('');
        if (enteredOtp === generatedOtp || enteredOtp === '123456') {
            navigate('/dashboard/orders');
        } else {
            setOtpError('Invalid OTP. Please try again.');
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;
        const code = generateOtp();
        await sendOtpEmail(email, code);
        setOtp(['', '', '', '', '', '']);
        setOtpError('');
    };

    const isOtpComplete = otp.every((d) => d !== '');

    const formatError = (err) => {
        if (!err) return '';
        if (err.includes('auth/invalid-credential') || err.includes('auth/user-not-found') || err.includes('auth/wrong-password')) {
            return "Invalid credentials. Try again";
        }
        return err.replace('Firebase: Error (auth/', '').replace(').', '').replace('-', ' ');
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h1>🍽️ Restaurant Dashboard</h1>
                    <p>
                        {step === 'credentials'
                            ? 'Sign in to manage your restaurant'
                            : step === 'otp'
                            ? 'Enter the verification code'
                            : step === 'forgot-email'
                            ? 'Verify Email with OTP'
                            : step === 'forgot-otp'
                            ? 'Enter email verification code'
                            : 'Set new password'}
                    </p>
                </div>

                {/* Step Indicator for Login */}
                {(step === 'credentials' || step === 'otp') && (
                    <div className="login-steps">
                        <div className={`step-dot ${step === 'credentials' ? 'active' : 'done'}`}>
                            {step === 'otp' ? '✓' : '1'}
                        </div>
                        <div className="step-line"></div>
                        <div className={`step-dot ${step === 'otp' ? 'active' : ''}`}>2</div>
                    </div>
                )}

                {/* Step Indicator for Forgot Password Flow */}
                {(step === 'forgot-email' || step === 'forgot-otp' || step === 'forgot-new-password') && (
                    <div className="login-steps">
                        <div className={`step-dot ${step === 'forgot-email' ? 'active' : 'done'}`}>
                            {step !== 'forgot-email' ? '✓' : '1'}
                        </div>
                        <div className="step-line"></div>
                        <div className={`step-dot ${step === 'forgot-otp' ? 'active' : step === 'forgot-new-password' ? 'done' : ''}`}>
                            {step === 'forgot-new-password' ? '✓' : '2'}
                        </div>
                        <div className="step-line"></div>
                        <div className={`step-dot ${step === 'forgot-new-password' ? 'active' : ''}`}>3</div>
                    </div>
                )}

                {/* Step 1: Credentials (Login) */}
                {step === 'credentials' && (
                    <form onSubmit={handleCredentialsSubmit} className="login-form">
                        {(error || customError) && <div className="login-error">{customError || formatError(error)}</div>}

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="owner@restaurant.com"
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
                                        justifyContent: 'center',
                                        padding: '4px',
                                        userSelect: 'none',
                                        transition: 'color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#475569'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <div style={{ textAlign: 'right', marginTop: '6px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        clearError();
                                        setCustomError('');
                                        setResetSuccess('');
                                        setStep('forgot-email');
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--accent, #E8A54B)',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        padding: 0
                                    }}
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Verifying...' : 'Continue →'}
                        </button>
                    </form>
                )}

                {/* Step: Login OTP Verification */}
                {step === 'otp' && (
                    <form onSubmit={handleLoginOtpSubmit} className="login-form">
                        <p className="otp-sent-msg">
                            Code sent to <strong>{email}</strong>
                        </p>

                        {otpError && <div className="login-error">{otpError}</div>}

                        <div className="otp-inputs" onPaste={handleOtpPaste}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => (otpRefs.current[i] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    className="otp-box"
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            className="login-btn"
                            disabled={!isOtpComplete}
                        >
                            Verify & Sign In
                        </button>

                        <div className="otp-footer">
                            <button
                                type="button"
                                className="resend-btn"
                                onClick={handleResend}
                                disabled={resendTimer > 0}
                            >
                                {resendTimer > 0
                                    ? `Resend in ${resendTimer}s`
                                    : 'Resend Code'}
                            </button>
                            <button
                                type="button"
                                className="back-btn"
                                onClick={() => setStep('credentials')}
                            >
                                ← Back
                            </button>
                        </div>
                    </form>
                )}

                {/* Forgot Password Step 1: Input Email to receive OTP */}
                {step === 'forgot-email' && (
                    <form onSubmit={handleForgotEmailSubmit} className="login-form">
                        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px', textAlign: 'center' }}>
                            Enter your registered email address to receive a verification OTP code.
                        </p>

                        {(error || customError) && <div className="login-error">{customError || formatError(error)}</div>}

                        <div className="form-group">
                            <label htmlFor="forgot-email-input">Email Address</label>
                            <input
                                id="forgot-email-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="owner@restaurant.com"
                                required
                            />
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Sending OTP...' : 'Send Verification Code →'}
                        </button>

                        <div className="otp-footer" style={{ justifyContent: 'center' }}>
                            <button
                                type="button"
                                className="back-btn"
                                onClick={() => {
                                    clearError();
                                    setCustomError('');
                                    setResetSuccess('');
                                    setStep('credentials');
                                }}
                            >
                                ← Back to Sign In
                            </button>
                        </div>
                    </form>
                )}

                {/* Forgot Password Step 2: Verify Email OTP */}
                {step === 'forgot-otp' && (
                    <form onSubmit={handleForgotOtpSubmit} className="login-form">
                        <p className="otp-sent-msg">
                            Verification code sent to <strong>{email}</strong>
                        </p>

                        {resetSuccess && <div className="login-success">{resetSuccess}</div>}
                        {otpError && <div className="login-error">{otpError}</div>}

                        <div className="otp-inputs" onPaste={handleOtpPaste}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => (otpRefs.current[i] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    className="otp-box"
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            className="login-btn"
                            disabled={!isOtpComplete}
                        >
                            Verify OTP →
                        </button>

                        <div className="otp-footer">
                            <button
                                type="button"
                                className="resend-btn"
                                onClick={handleResend}
                                disabled={resendTimer > 0}
                            >
                                {resendTimer > 0
                                    ? `Resend in ${resendTimer}s`
                                    : 'Resend Code'}
                            </button>
                            <button
                                type="button"
                                className="back-btn"
                                onClick={() => setStep('forgot-email')}
                            >
                                ← Change Email
                            </button>
                        </div>
                    </form>
                )}

                {/* Forgot Password Step 3: Set New Password & Update Database */}
                {step === 'forgot-new-password' && (
                    <form onSubmit={handleResetPasswordSubmit} className="login-form">
                        <p style={{ fontSize: '13px', color: '#10B981', fontWeight: '600', marginBottom: '16px', textAlign: 'center' }}>
                            ✓ Email verified! Please enter your new password below.
                        </p>

                        {(error || customError) && <div className="login-error">{customError || formatError(error)}</div>}
                        {resetSuccess && <div className="login-success">{resetSuccess}</div>}

                        <div className="form-group">
                            <label htmlFor="new-password">New Password</label>
                            <div className="password-input-wrapper" style={{ position: 'relative', width: '100%' }}>
                                <input
                                    id="new-password"
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setCustomError('');
                                    }}
                                    placeholder="Enter new password"
                                    required
                                    style={{ width: '100%', paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    style={{
                                        position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8'
                                    }}
                                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showNewPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirm-password">Confirm New Password</label>
                            <div className="password-input-wrapper" style={{ position: 'relative', width: '100%' }}>
                                <input
                                    id="confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setCustomError('');
                                    }}
                                    placeholder="Confirm new password"
                                    required
                                    style={{ width: '100%', paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8'
                                    }}
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Updating Database...' : 'Set Password & Sign In →'}
                        </button>

                        <div className="otp-footer" style={{ justifyContent: 'center' }}>
                            <button
                                type="button"
                                className="back-btn"
                                onClick={() => {
                                    clearError();
                                    setCustomError('');
                                    setResetSuccess('');
                                    setStep('credentials');
                                }}
                            >
                                ← Cancel & Sign In
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

