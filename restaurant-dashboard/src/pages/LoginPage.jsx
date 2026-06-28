import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
    // Steps: 'credentials' → 'otp'
    const [step, setStep] = useState('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [otpError, setOtpError] = useState('');
    const [resendTimer, setResendTimer] = useState(0);
    const [showPassword, setShowPassword] = useState(false);

    const { login, loading, error, clearError } = useAuthStore();
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
        // If we are in production on Cloudflare, dispatch the OTP email
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
                }
            } catch (err) {
                console.error("Failed to fetch OTP edge endpoint:", err);
            }
        } else {
            // In local development, show the popup alert so you can easily copy-paste
            alert(`Your OTP is: ${otpCode}\n\n(In production, this would be sent to ${targetEmail})`);
        }
    };

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        clearError();
        try {
            await login(email, password);
            // Credentials valid → move to OTP step
            const code = generateOtp();
            await sendOtpEmail(email, code);
            setStep('otp');
        } catch {
            // Error handled by store
        }
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return; // Only allow single digit
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setOtpError('');

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        // On backspace, go to previous input
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

    const handleOtpSubmit = (e) => {
        e.preventDefault();
        const enteredOtp = otp.join('');
        if (enteredOtp === generatedOtp) {
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
                            : 'Enter the verification code'}
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="login-steps">
                    <div className={`step-dot ${step === 'credentials' ? 'active' : 'done'}`}>
                        {step === 'otp' ? '✓' : '1'}
                    </div>
                    <div className="step-line"></div>
                    <div className={`step-dot ${step === 'otp' ? 'active' : ''}`}>2</div>
                </div>

                {/* Step 1: Credentials */}
                {step === 'credentials' && (
                    <form onSubmit={handleCredentialsSubmit} className="login-form">
                        {error && <div className="login-error">{formatError(error)}</div>}



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
                            <div className="password-input-wrapper" style={{ position: 'relative' }}>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    style={{ paddingRight: '40px' }}
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
                                        color: '#94A3B8', // Minimalist Slate-400
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
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Verifying...' : 'Continue →'}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP Verification */}
                {step === 'otp' && (
                    <form onSubmit={handleOtpSubmit} className="login-form">
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
            </div>
        </div>
    );
}
