import React from "react";
import { Button } from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";

/**
 * A button component that toggles between light and dark themes.
 *
 * This component uses the application's ThemeContext to switch themes dynamically.
 * It updates the button label and icon based on the current theme, displaying
 * "Dark Mode" when in light mode and "Light Mode" when in dark mode.
 *
 * @component
 * @example
 * return (
 *   <ThemeToggleButton />
 * )
 *
 * @returns {JSX.Element} A themed button allowing users to toggle between light and dark modes.
 */
function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant={theme === "light" ? "outline-dark" : "outline-light"}
      onClick={toggleTheme}
    >
      {theme === "light" ? (
        <>
          <i className="bi bi-moon-fill me-1"></i> Dark Mode
        </>
      ) : (
        <>
          <i className="bi bi-sun-fill me-1"></i> Light Mode
        </>
      )}
    </Button>
  );
}

export default ThemeToggleButton;