import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
    // Steps: 'credentials' → 'otp'
    const [step, setStep] = useState('credentials');
    const [restaurantName, setRestaurantName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [otpError, setOtpError] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

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

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        clearError();
        try {
            await login(email, password, restaurantName);
            // Credentials valid → move to OTP step
            const code = generateOtp();
            // In production, send this OTP via email/SMS using Firebase Functions
            // For now, it's logged to the console
            alert(`Your OTP is: ${code}\n\n(In production, this would be sent to ${email})`);
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

    const handleResend = () => {
        if (resendTimer > 0) return;
        const code = generateOtp();
        alert(`New OTP: ${code}\n\n(In production, this would be sent to ${email})`);
        setOtp(['', '', '', '', '', '']);
        setOtpError('');
    };

    const isOtpComplete = otp.every((d) => d !== '');

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
                        {error && <div className="login-error">{error}</div>}

                        <div className="form-group">
                            <label htmlFor="restaurantName">Restaurant Name</label>
                            <input
                                id="restaurantName"
                                type="text"
                                value={restaurantName}
                                onChange={(e) => setRestaurantName(e.target.value)}
                                placeholder="My Restaurant"
                                required
                            />
                        </div>

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
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
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
