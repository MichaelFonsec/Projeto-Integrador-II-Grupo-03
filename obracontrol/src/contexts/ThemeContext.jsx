import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('obracontrol_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch {
      // Ignora erro no localStorage
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem('obracontrol_theme', theme);
    } catch {
      // Ignora erro no localStorage
    }

    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    if (theme === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    } else {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
