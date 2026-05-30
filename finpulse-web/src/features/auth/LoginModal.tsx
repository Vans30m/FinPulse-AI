import { useState, useEffect, useRef } from 'react';
import { X, LayoutDashboard, LockKeyhole } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

type AuthStep = 'email' | 'set-pin' | 'enter-pin';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log("Google Login Success!", tokenResponse);
      // For now, we will simulate success and push them to the PIN setup
      // Later, you will send tokenResponse.access_token to your backend
      setEmail('google_user@gmail.com'); // Mock email
      setStep('set-pin'); 
    },
    onError: () => setError('Google Login Failed. Please try again.'),
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('email');
      setEmail('');
      setPin('');
      setError('');
    }
  }, [isOpen]);

  // Focus the hidden PIN input when stepping into PIN modes
  useEffect(() => {
    if (step === 'set-pin' || step === 'enter-pin') {
      inputRef.current?.focus();
    }
  }, [step]);

  if (!isOpen) return null;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Simulate backend check: Does this user already have a PIN on this device?
    const savedPin = localStorage.getItem(`finpulse_pin_${email}`);
    
    if (savedPin) {
      setStep('enter-pin');
    } else {
      setStep('set-pin');
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 6) {
      setPin(val);
      setError('');
    }


    
    // Auto-submit when 6 digits are entered
    if (val.length === 6) {
      if (step === 'set-pin') {
        localStorage.setItem(`finpulse_pin_${email}`, val);
        onLoginSuccess();
      } else if (step === 'enter-pin') {
        const savedPin = localStorage.getItem(`finpulse_pin_${email}`);
        if (val === savedPin) {
          onLoginSuccess();
        } else {
          setError('Incorrect PIN. Please try again.');
          setPin(''); // Reset on failure
        }
      }
    }
  };
  

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-night-950/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

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
          <button onClick={onClose} className="absolute right-6 top-6 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex h-full max-w-sm flex-col justify-center">
            
            {/* STEP 1: EMAIL & OAUTH */}
            {step === 'email' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="mb-6 flex md:hidden h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 dark:bg-cyan-400 text-white dark:text-night-900 shadow-md">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <h2 className="mb-10 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Welcome to FinPulse
                </h2>

                {/* 3. ATTACH THE ONCLICK TO THE GOOGLE BUTTON */}
                <button 
                  type="button"
                  onClick={() => loginWithGoogle()} 
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>

                
              </div>
            )}

            {/* STEP 2: PIN ENTRY / CREATION */}
            {(step === 'set-pin' || step === 'enter-pin') && (
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
                  {step === 'set-pin' ? 'Set up a 6-digit PIN' : 'Enter your PIN'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-10">
                  {step === 'set-pin' 
                    ? 'Create a secure PIN to quickly access your account in the future.' 
                    : `Welcome back, ${email}. Enter your PIN to continue.`}
                </p>

                {/* The clever hidden input & visible boxes trick */}
                <div className="relative mb-8">
                  <input
                    ref={inputRef}
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={handlePinChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-text z-20"
                  />
                  
                  <div className="flex gap-3 justify-between pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                      <div 
                        key={i}
                        className={`flex h-14 w-12 items-center justify-center rounded-xl border-2 text-xl font-bold transition-colors ${
                          pin.length === i 
                            ? 'border-blue-600 dark:border-cyan-400 text-slate-900 dark:text-white' 
                            : pin.length > i
                              ? 'border-slate-800 dark:border-white bg-slate-800 dark:bg-white text-white dark:text-night-900'
                              : 'border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'
                        }`}
                      >
                        {pin.length > i ? '•' : ''}
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-rose-500 font-medium text-center animate-pulse">{error}</p>
                )}

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}