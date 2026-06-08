import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    // Determine direction BEFORE we change the theme
    // Light -> Dark: Drops from the Top ('down')
    // Dark -> Light: Rises from the Bottom ('up')
    const direction = theme === 'light' ? 'down' : 'up';

    const transition = document.startViewTransition(() => {
      setTheme(nextTheme);
    });

    transition.ready.then(() => {
      const createZigZag = (baseY: number, dir: 'down' | 'up', toothHeight = 4, numTeeth = 20) => {
        const points = [];
        const step = 100 / (numTeeth * 2);

        if (dir === 'down') {
          // Drops from Top. Anchor the top corners.
          points.push('0% 0%', '100% 0%');
          for (let i = 0; i <= numTeeth * 2; i++) {
            const x = 100 - (i * step); // Draw right to left
            const y = baseY - (i % 2 === 0 ? 0 : toothHeight);
            points.push(`${x}% ${y}%`);
          }
        } else {
          // Rises from Bottom. Anchor the bottom corners.
          points.push('100% 100%', '0% 100%');
          for (let i = 0; i <= numTeeth * 2; i++) {
            const x = i * step; // Draw left to right
            const y = baseY + (i % 2 === 0 ? 0 : toothHeight);
            points.push(`${x}% ${y}%`);
          }
        }
        return `polygon(${points.join(', ')})`;
      };

      // Push the start coordinates safely OFF-SCREEN to prevent flashing bugs
      const startBaseY = direction === 'down' ? -10 : 110;
      const endBaseY = direction === 'down' ? 120 : -20;

      document.documentElement.animate(
        {
          clipPath: [
            createZigZag(startBaseY, direction),
            createZigZag(endBaseY, direction)
          ],
        },
        {
          duration: 1500, // SLOWED DOWN: Now takes 1.5 full seconds
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}