import React from "react";
import { Button } from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";

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