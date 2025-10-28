import React, { createContext, useEffect, useState, useContext } from 'react';

import { fetchTheme as apiGetTheme, setTheme as apiSetTheme } from '../api/requests';

const ThemeContext = createContext();

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

export function useTheme() {
  return useContext(ThemeContext);
}