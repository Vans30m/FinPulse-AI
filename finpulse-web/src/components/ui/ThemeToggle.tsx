import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}