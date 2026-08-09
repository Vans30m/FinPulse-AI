import { useState, useEffect, useRef } from 'react';
import { X, LayoutDashboard, LockKeyhole } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAppData } from '../../context/AppDataContext';
import API_BASE_URL, { apiFetch, ApiRequestError } from "../../config/api";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onLogout?: () => void;
}

type AuthStep = 'email' | 'otp-verification' | 'reset-pin' | 'set-pin' | 'enter-pin' | 'profile-setup' | 'forgot-password' | 'reset-password';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, onLogout }: LoginModalProps) {
  const { setUser } = useAppData();
  const [step, setStep] = useState<AuthStep>('email');

  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [bio, setBio] = useState('');
  const [profileUserId, setProfileUserId] = useState('');
  const [resetPasswordOtp, setResetPasswordOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const userInfoResponse = await apiFetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const userInfo = await userInfoResponse.json();
        if (userInfo.email) {
          setEmail(userInfo.email);

          const backendRes = await apiFetch(`${API_BASE_URL}/api/auth/google-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tokenResponse.access_token }),
          });

          if (backendRes.ok) {
            const data = await backendRes.json();
            localStorage.setItem('finpulse_token', data.token);
            localStorage.setItem('finpulse-user', JSON.stringify(data.user));
            setUser(data.user);

            if (data.hasPin) {
              sessionStorage.setItem('finpulse_pin_verified', 'true');
              onLoginSuccess();
            } else {
              setStep('set-pin');
            }
          } else {
            const errData = await backendRes.json();
            setError(errData.error || 'Google Login database error.');
          }
        } else {
          setError('Failed to retrieve user email from Google.');
        }
      } catch (err) {
        console.error("Google authentication failed:", err);
        setError(err instanceof ApiRequestError ? err.message : 'Google authentication failed.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError('Google Login Failed. Please try again.');
      setGoogleLoading(false);
    },
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('finpulse_token');
      const pinVerified = sessionStorage.getItem('finpulse_pin_verified');
      if (token && pinVerified !== 'true') {
        const storedUser = localStorage.getItem('finpulse-user');
        if (storedUser) {
          try {
            const userObj = JSON.parse(storedUser);
            setEmail(userObj.email || '');
          } catch (e) {
            console.error(e);
          }
        }
        setStep('enter-pin');
      } else {
        setStep('email');
        setEmail('');
      }
      setPin('');
      setError('');
      setIsRegisterMode(false);
      setName('');
      setPassword('');
      setOtpCode('');
      setResetOtp('');
      setNewPin('');
      setBio('');
      setProfileUserId('');
      setResetPasswordOtp('');
      setNewPassword('');
      setLoading(false);
      setIsSuccess(false);
      setGoogleLoading(false);
    }
  }, [isOpen]);

  const parseJsonResponse = async (res: Response) => {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiRequestError('Unexpected server response. Please try again.');
    }
  };

  const handleTraditionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegisterMode ? 'register' : 'login';
      const res = await apiFetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password })
      });

      const data = await parseJsonResponse(res);
      if (res.ok) {
        if (data.requiresVerification) {
          setStep('otp-verification');
          setOtpCode('');
        } else {
          localStorage.setItem('finpulse_token', data.token);
          localStorage.setItem('finpulse-user', JSON.stringify(data.user));
          setUser(data.user);
          onLoginSuccess();
        }
      } else {
        setError(data.error || 'Authentication failed.');
      }
    } catch (err) {
      console.error('Traditional auth failed:', err);
      setError(err instanceof ApiRequestError ? err.message : 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otpCode.length !== 6) {
      setError('Please enter a 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegisterMode ? 'verify-otp' : 'login-verify-otp';
      const res = await apiFetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, code: otpCode })
      });

      const data = await parseJsonResponse(res);
      if (res.ok) {
        if (isRegisterMode) {
          localStorage.setItem('finpulse_token', data.token);
          localStorage.setItem('finpulse-user', JSON.stringify(data.user));
          setUser(data.user);
          setProfileUserId(data.user.id);
          setStep('profile-setup');
        } else {
          if (data.hasPin) {
            setStep('enter-pin');
          } else {
            setStep('set-pin');
          }
        }
      } else {
        setError(data.error || 'Verification failed.');
      }
    } catch (err) {
      console.error('OTP verification failed:', err);
      setError(err instanceof ApiRequestError ? err.message : 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPinClick = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/auth/forgot-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await parseJsonResponse(res);
      if (res.ok) {
        setStep('reset-pin');
        setResetOtp('');
        setNewPin('');
      } else {
        setError(data.error || 'Failed to request PIN reset.');
      }
    } catch (err) {
      console.error('Forgot PIN request failed:', err);
      setError(err instanceof ApiRequestError ? err.message : 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (resetOtp.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    if (newPin.length !== 6) {
      setError('Please enter your new 6-digit PIN.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/auth/reset-pin-with-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetOtp, newPin })
      });

      const data = await parseJsonResponse(res);
      if (res.ok) {
        localStorage.setItem('finpulse_token', data.token);
        localStorage.setItem('finpulse-user', JSON.stringify(data.user));
        setUser(data.user);
        sessionStorage.setItem('finpulse_pin_verified', 'true');
        onLoginSuccess();
      } else {
        setError(data.error || 'Reset PIN failed.');
      }
    } catch (err) {
      console.error('Reset PIN failed:', err);
      setError(err instanceof ApiRequestError ? err.message : 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Email address is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await parseJsonResponse(res);
      if (res.ok) {
        setStep('reset-password');
        setResetPasswordOtp('');
        setNewPassword('');
      } else {
        setError(data.error || 'Failed to request password reset.');
      }
    } catch (err) {
      console.error('Forgot password request failed:', err);
      setError(err instanceof ApiRequestError ? err.message : 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (resetPasswordOtp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (!newPassword) {
      setError('Please enter your new password.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetPasswordOtp, newPassword })
      });

      const data = await parseJsonResponse(res);
      if (res.ok) {
        localStorage.setItem('finpulse_token', data.token);
        localStorage.setItem('finpulse-user', JSON.stringify(data.user));
        setUser(data.user);
        onLoginSuccess();
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      console.error('Reset password failed:', err);
      setError(err instanceof ApiRequestError ? err.message : 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Display Name is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profileUserId, name, bio })
      });

      const data = await parseJsonResponse(res);
      if (res.ok) {
        localStorage.setItem('finpulse-user', JSON.stringify(data.user));
        setUser(data.user);
        onLoginSuccess();
      } else {
        setError(data.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Profile setup failed:', err);
      setError(err instanceof ApiRequestError ? err.message : 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };




  // Focus the hidden PIN input when stepping into PIN modes
  useEffect(() => {
    if (step === 'set-pin' || step === 'enter-pin') {
      inputRef.current?.focus();
    }
  }, [step]);

  if (!isOpen) return null;

  const handlePinChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (loading || isSuccess) return;
    // Only allow numbers
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 6) {
      setPin(val);
      setError('');
    }

    // Auto-submit when 6 digits are entered
    if (val.length === 6) {
      // Delay slightly to let the 6th digit render on the screen
      setTimeout(async () => {
        setLoading(true);
        try {
          if (step === 'set-pin') {
            const res = await apiFetch(`${API_BASE_URL}/api/auth/set-pin`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, pin: val })
            });

            if (res.ok) {
              const data = await res.json();
              localStorage.setItem('finpulse_token', data.token);
              localStorage.setItem('finpulse-user', JSON.stringify(data.user));
              setUser(data.user);
              sessionStorage.setItem('finpulse_pin_verified', 'true');
              setIsSuccess(true);
              // Wait 800ms for verification success animation to show
              await new Promise(resolve => setTimeout(resolve, 800));
              setProfileUserId(data.user.id);
              setStep('profile-setup');
            } else {
              const errData = await res.json();
              setError(errData.error || 'Failed to save PIN.');
              setPin('');
            }
          } else if (step === 'enter-pin') {
            const res = await apiFetch(`${API_BASE_URL}/api/auth/verify-pin`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, pin: val })
            });

            if (res.ok) {
              const data = await res.json();
              localStorage.setItem('finpulse_token', data.token);
              localStorage.setItem('finpulse-user', JSON.stringify(data.user));
              setUser(data.user);
              sessionStorage.setItem('finpulse_pin_verified', 'true');
              setIsSuccess(true);
              // Wait 800ms for verification success animation to show
              await new Promise(resolve => setTimeout(resolve, 800));
              onLoginSuccess();
            } else {
              const errData = await res.json();
              setError(errData.error || 'Incorrect PIN. Please try again.');
              setPin('');
            }
          }
        } catch (err) {
          console.error("PIN authentication failed:", err);
          setError(err instanceof ApiRequestError ? err.message : 'Connection error. Please try again.');
          setPin('');
        } finally {
          setLoading(false);
        }
      }, 250);
    }
  };



  const isForcePin = !!localStorage.getItem('finpulse_token') && sessionStorage.getItem('finpulse_pin_verified') !== 'true';

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 sm:p-6 pt-16 sm:pt-6">
      <div
        className="absolute inset-0 bg-slate-900/60 dark:bg-night-950/80 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isForcePin) {
            onClose();
          }
        }}
      />

      <div className="relative z-10 flex w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900 shadow-2xl animate-in fade-in zoom-in-95 duration-300">

        {/* LEFT PANE: Branding */}
        <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-blue-600 dark:bg-cyan-500 p-12 md:flex">
          <div className="absolute inset-0 z-0 bg-grid opacity-20" />
          <div className="absolute -left-24 -top-24 z-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 z-0 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-5xl font-bold leading-[1.1] text-white tracking-tight">
              Smarter, AI-Driven<br />Investing.
            </h2>
          </div>
          <div className="relative z-10 mt-auto">
            <div className="mb-4 h-1.5 w-10 bg-slate-900/50 dark:bg-night-900/50" />
            <p className="text-3xl font-bold text-white tracking-tight">Equities</p>
          </div>
        </div>

        {/* RIGHT PANE: Authentication Forms */}
        <div className="relative w-full p-8 sm:p-12 md:w-1/2">
          {!isForcePin && (
            <button onClick={onClose} className="absolute right-6 top-6 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="mx-auto flex h-full max-w-sm flex-col justify-center">

            {/* STEP 1: EMAIL & OAUTH */}
            {step === 'email' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="mb-6 flex md:hidden h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 dark:bg-cyan-400 text-white dark:text-night-900 shadow-md">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <h2 className="mb-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  {isRegisterMode ? 'Create your account' : 'Welcome to FinPulse'}
                </h2>

                {/* Tab selector */}
                <div className="flex border-b border-slate-200 dark:border-white/10 mb-6">
                  <button
                    type="button"
                    onClick={() => { setIsRegisterMode(false); setError(''); }}
                    className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${!isRegisterMode
                      ? 'border-blue-600 dark:border-cyan-400 text-blue-600 dark:text-cyan-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsRegisterMode(true); setError(''); }}
                    className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${isRegisterMode
                      ? 'border-blue-600 dark:border-cyan-400 text-blue-600 dark:text-cyan-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleTraditionalSubmit} className="space-y-4 mb-6">
                  {isRegisterMode && (
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                        Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none transition-colors"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none transition-colors"
                    />
                  </div>

                  {!isRegisterMode && (
                    <div className="text-left -mt-2">
                      <button
                        type="button"
                        onClick={() => { setStep('forgot-password'); setError(''); }}
                        className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline focus:outline-none"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-blue-600 dark:bg-cyan-400 py-3 text-sm font-black uppercase tracking-wider text-white dark:text-night-950 shadow-md hover:shadow-lg transition-all hover:bg-blue-700 dark:hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </>
                    ) : (
                      isRegisterMode ? 'Create Account' : 'Sign In'
                    )}
                  </button>
                </form>

                <div className="relative flex items-center justify-center my-6">
                  <div className="absolute w-full border-t border-slate-200 dark:border-white/10" />
                  <span className="relative bg-white dark:bg-night-900 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    or
                  </span>
                </div>

                {/* Google Sign-in */}
                <button
                  type="button"
                  disabled={googleLoading || loading}
                  onClick={() => loginWithGoogle()}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {googleLoading ? 'Connecting...' : 'Continue with Google'}
                </button>

                {error && (
                  <p className="mt-4 text-sm text-rose-500 font-medium text-center animate-pulse">{error}</p>
                )}
              </div>
            )}

            {/* STEP 3: OTP VERIFICATION */}
            {step === 'otp-verification' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <button
                  onClick={() => setStep('email')}
                  className="mb-6 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  ← Back
                </button>

                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400">
                  <LockKeyhole className="h-6 w-6" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
                  Verify your email
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-10">
                  We've sent a 6-digit verification code to <span className="font-extrabold">{email}</span>. Please enter it below to {isRegisterMode ? 'complete registration' : 'sign in'}.
                </p>

                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter code"
                      className={`w-full text-center font-black rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] px-4 py-3 text-xl text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none transition-colors ${otpCode ? 'tracking-[12px] pl-[12px]' : 'tracking-normal'}`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-blue-600 dark:bg-cyan-400 py-3 text-sm font-black uppercase tracking-wider text-white dark:text-night-950 shadow-md hover:shadow-lg transition-all hover:bg-blue-700 dark:hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Verifying...
                      </>
                    ) : (
                      'Verify'
                    )}
                  </button>
                </form>

                {error && (
                  <p className="mt-4 text-sm text-rose-500 font-medium text-center animate-pulse">{error}</p>
                )}
              </div>
            )}

            {/* STEP 3.5: FORGOT PASSWORD */}
            {step === 'forgot-password' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="mb-6 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  ← Back to Login
                </button>

                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400">
                  <LockKeyhole className="h-6 w-6" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
                  Forgot Password
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                  Enter your email address and we'll send you a 6-digit verification code to reset your password.
                </p>

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-blue-600 dark:bg-cyan-400 py-3 text-sm font-black uppercase tracking-wider text-white dark:text-night-950 shadow-md hover:shadow-lg transition-all hover:bg-blue-700 dark:hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending code...
                      </>
                    ) : (
                      'Send Verification Code'
                    )}
                  </button>
                </form>

                {error && (
                  <p className="mt-4 text-sm text-rose-500 font-medium text-center animate-pulse">{error}</p>
                )}
              </div>
            )}

            {/* STEP 3.6: RESET PASSWORD */}
            {step === 'reset-password' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <button
                  type="button"
                  onClick={() => setStep('forgot-password')}
                  className="mb-6 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  ← Back
                </button>

                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400">
                  <LockKeyhole className="h-6 w-6" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
                  Reset Password
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                  Please enter the 6-digit OTP code sent to <span className="font-extrabold">{email}</span> and choose a new password.
                </p>

                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={resetPasswordOtp}
                      onChange={(e) => setResetPasswordOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className={`w-full text-center font-black rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] px-4 py-3 text-lg text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none transition-colors ${resetPasswordOtp ? 'tracking-[12px] pl-[12px]' : 'tracking-normal'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-blue-600 dark:bg-cyan-400 py-3 text-sm font-black uppercase tracking-wider text-white dark:text-night-950 shadow-md hover:shadow-lg transition-all hover:bg-blue-700 dark:hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Resetting...
                      </>
                    ) : (
                      'Reset Password & Sign In'
                    )}
                  </button>
                </form>

                {error && (
                  <p className="mt-4 text-sm text-rose-500 font-medium text-center animate-pulse">{error}</p>
                )}
              </div>
            )}

            {/* STEP 4: RESET PIN WITH OTP */}
            {step === 'reset-pin' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <button
                  onClick={() => setStep('enter-pin')}
                  className="mb-6 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  ← Back
                </button>

                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400">
                  <LockKeyhole className="h-6 w-6" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
                  Reset your PIN
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                  We've sent a 6-digit code to <span className="font-extrabold">{email}</span>. Enter the code and your new 6-digit PIN below.
                </p>

                <form onSubmit={handleResetPinSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Email OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      New 6-Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter new 6-digit PIN"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-blue-600 dark:bg-cyan-400 py-3 text-sm font-black uppercase tracking-wider text-white dark:text-night-950 shadow-md hover:shadow-lg transition-all hover:bg-blue-700 dark:hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Resetting...
                      </>
                    ) : (
                      'Reset PIN & Log In'
                    )}
                  </button>
                </form>

                {error && (
                  <p className="mt-4 text-sm text-rose-500 font-medium text-center animate-pulse">{error}</p>
                )}
              </div>
            )}

            {/* STEP 5: PROFILE SETUP */}
            {step === 'profile-setup' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
                  Set up your profile
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                  Let's personalize your FinPulse AI experience.
                </p>

                <form onSubmit={handleProfileSetupSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Display Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Bio <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about your investment journey..."
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-blue-600 dark:bg-cyan-400 py-3 text-sm font-black uppercase tracking-wider text-white dark:text-night-950 shadow-md hover:shadow-lg transition-all hover:bg-blue-700 dark:hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save & Finish Setup'
                    )}
                  </button>
                </form>

                {error && (
                  <p className="mt-4 text-sm text-rose-500 font-medium text-center animate-pulse">{error}</p>
                )}
              </div>
            )}

            {/* STEP 2: PIN ENTRY / CREATION */}
            {(step === 'set-pin' || step === 'enter-pin') && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">

                <button
                  type="button"
                  onClick={() => {
                    if (isForcePin) {
                      localStorage.removeItem('finpulse_token');
                      localStorage.removeItem('finpulse-user');
                      sessionStorage.removeItem('finpulse_pin_verified');
                      setUser({ name: 'User', email: 'user@example.com', currency: 'INR (₹)' });
                      if (onLogout) {
                        onLogout();
                      }
                      setStep('email');
                    } else {
                      setStep('email');
                    }
                  }}
                  className="mb-6 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  {isForcePin ? '← Sign Out' : '← Back'}
                </button>

                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400">
                  <LockKeyhole className="h-6 w-6" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
                  {step === 'set-pin' ? 'Set up a 6-digit PIN' : 'Enter your PIN'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-10">
                  {step === 'set-pin'
                    ? 'Create a secure PIN to quickly access your account in the future.'
                    : `Welcome back, ${email}. Enter your PIN to continue.`}
                </p>

                {/* The clever hidden input & visible boxes trick */}
                <div className="relative mb-8">
                  {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-2 space-y-2 animate-in zoom-in-95 duration-300">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-emerald-500 dark:text-emerald-400">
                        Securely Verified
                      </p>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={inputRef}
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={pin}
                        disabled={loading}
                        onChange={handlePinChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-text z-20 disabled:cursor-not-allowed"
                      />

                      <div className="flex gap-3 justify-between pointer-events-none">
                        {[...Array(6)].map((_, i) => {
                          const isFocused = pin.length === i && !loading;
                          const isFilled = pin.length > i;
                          return (
                            <div
                              key={i}
                              className={`flex h-14 w-12 items-center justify-center rounded-xl border-2 text-xl font-bold transition-all duration-200 ${
                                loading
                                  ? 'border-blue-600/40 dark:border-cyan-400/40 text-blue-600/40 dark:text-cyan-400/40 bg-slate-50/50 dark:bg-white/[0.01] scale-95'
                                  : isFocused
                                  ? 'border-blue-600 dark:border-cyan-400 text-slate-900 dark:text-white scale-105 shadow-md shadow-blue-500/10'
                                  : isFilled
                                  ? 'border-blue-500 dark:border-cyan-400/80 text-blue-600 dark:text-cyan-400 bg-blue-50/20 dark:bg-cyan-500/5'
                                  : 'border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'
                              }`}
                            >
                              {isFilled ? '•' : ''}
                            </div>
                          );
                        })}
                      </div>

                      {loading && (
                        <div className="absolute -bottom-6 left-0 right-0 flex items-center justify-center">
                          <svg className="animate-spin h-4 w-4 text-blue-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-rose-500 font-medium text-center animate-in fade-in duration-200">{error}</p>
                )}

                {step === 'enter-pin' && (
                  <button
                    type="button"
                    onClick={handleForgotPinClick}
                    className="mt-4 w-full text-center text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline"
                  >
                    Forgot PIN?
                  </button>
                )}


              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}