import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  value: string;
}

export default function PasswordStrength({ value }: PasswordStrengthProps) {
  const requirements = [
    { label: "At least 8 characters", regex: /.{8,}/ },
    { label: "Uppercase letter", regex: /[A-Z]/ },
    { label: "Lowercase letter", regex: /[a-z]/ },
    { label: "Number", regex: /[0-9]/ },
    { label: "Special character", regex: /[^A-Za-z0-9]/ }
  ];

  const metCount = requirements.filter(req => req.regex.test(value)).length;
  
  const getStrengthLabel = () => {
    if (!value) return { text: 'Empty', color: 'bg-slate-200 dark:bg-white/10 text-slate-400' };
    if (metCount <= 2) return { text: 'Weak', color: 'bg-rose-500 text-white' };
    if (metCount <= 4) return { text: 'Medium', color: 'bg-amber-500 text-white' };
    return { text: 'Strong', color: 'bg-emerald-500 text-white' };
  };

  const strength = getStrengthLabel();

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-650 dark:text-slate-400">Password Strength:</span>
        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${strength.color}`}>
          {strength.text}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className={`h-full transition-all duration-300 ${
              i < metCount 
                ? metCount <= 2 
                  ? 'bg-rose-500' 
                  : metCount <= 4 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
                : ''
            }`}
          />
        ))}
      </div>

      <ul className="space-y-1.5">
        {requirements.map((req, idx) => {
          const isMet = req.regex.test(value);
          return (
            <li key={idx} className="flex items-center gap-1.5 text-xs text-slate-650 dark:text-slate-400">
              {isMet ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <X className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              )}
              <span className={isMet ? 'text-slate-900 dark:text-white font-medium' : ''}>{req.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
