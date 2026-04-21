'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
    theme: 'dark',
    toggleTheme: () => { },
    setTheme: () => { },
});

// Theme cycle order
const THEMES = ['dark', 'light', 'treasure'];

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('dark');
    const [mounted, setMounted] = useState(false);

    // Load theme from localStorage on mount
    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem('anqa-theme');
        if (savedTheme && THEMES.includes(savedTheme)) {
            setTheme(savedTheme);
        } else {
            setTheme('dark');
        }
    }, []);

    // Apply theme to document
    useEffect(() => {
        if (mounted) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('anqa-theme', theme);
        }
    }, [theme, mounted]);

    // Cycle through themes: dark -> light -> treasure -> dark
    const toggleTheme = () => {
        setTheme(prev => {
            const currentIndex = THEMES.indexOf(prev);
            const nextIndex = (currentIndex + 1) % THEMES.length;
            return THEMES[nextIndex];
        });
    };

    // Prevent flash of wrong theme
    if (!mounted) {
        return null;
    }

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

export default ThemeContext;

