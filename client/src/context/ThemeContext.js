/**
 * ThemeContext and Provider
 *
 * Provides global light/dark theme state management for the app.
 * Fetches the user’s saved theme preference from the backend on load
 * and synchronizes changes with both the API and the document’s data attribute.
 *
 * @module ThemeContext
 */

import React, { createContext, useEffect, useState, useContext } from 'react';

import { fetchTheme as apiGetTheme, setTheme as apiSetTheme } from '../api/requests';

const ThemeContext = createContext();

/**
 * ThemeProvider Component
 *
 * Wraps the app in a context provider that manages the current UI theme
 * ("light" or "dark") and persists changes via API requests.
 *
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - The child components that should have access to the theme context.
 *
 * @example
 * return (
 *   <ThemeProvider>
 *     <App />
 *   </ThemeProvider>
 * );
 *
 * @description
 * On mount, this component:
 *  - Fetches the user's saved theme using `apiGetTheme()`.
 *  - Updates the `data-bs-theme` attribute on the document body for Bootstrap styling.
 *
 * The `toggleTheme` function switches between "light" and "dark", updates the backend
 * using `apiSetTheme()`, and updates the page theme instantly.
 *
 * @returns {JSX.Element} A context provider for managing and toggling app themes.
 */
export function ThemeProvider({ children}) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const data = await apiGetTheme();
        setTheme(data.theme);
        document.body.setAttribute("data-bs-theme", data.theme);
      } catch (err) {
        console.error("Error fetching theme:", err);
      }
    };

    fetchTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    try {
      await apiSetTheme(newTheme);
      setTheme(newTheme);
      document.body.setAttribute("data-bs-theme", newTheme);
    } catch (err) {
      console.error("Error setting theme:", err);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom Hook: useTheme
 *
 * Provides access to the current theme and the theme toggle function
 * from anywhere within the `ThemeProvider` context.
 *
 * @function
 * @example
 * const { theme, toggleTheme } = useTheme();
 *
 * @returns {{ theme: string, toggleTheme: () => Promise<void> }}
 * Returns the current theme ("light" or "dark") and an async function to toggle it.
 */
export function useTheme() {
  return useContext(ThemeContext);
}