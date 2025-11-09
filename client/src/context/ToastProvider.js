/**
 * Toast Context and Provider
 *
 * Provides a global system for displaying Bootstrap toasts (temporary notification popups)
 * across the application. Toasts automatically fade after a short delay and can also
 * be manually dismissed.
 *
 * @module ToastProvider
 */
import React, { createContext, useContext, useState } from "react";
import { Toast, ToastContainer } from "react-bootstrap";

const ToastContext = createContext();

/**
 * useToasts Hook
 *
 * Accesses the toast context to show notifications from anywhere in the app.
 *
 * @function
 * @example
 * const { addToast } = useToasts();
 * addToast("Saved successfully!", "success");
 *
 * @returns {{ addToast: (message: string, variant?: string, delay?: number) => void }}
 * Provides a function to trigger toasts with optional variant and delay.
 */
export const useToasts = () => useContext(ToastContext);

/**
 * ToastProvider Component
 *
 * Wraps the application and renders a ToastContainer that displays temporary
 * notification popups. Supports message variants (`success`, `error`, `info`) and
 * automatic fade-out with manual dismiss capability.
 *
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - The app components that should have access to the toast system.
 *
 * @example
 * return (
 *   <ToastProvider>
 *     <App />
 *   </ToastProvider>
 * );
 *
 * @description
 * - Maintains an array of active toasts in component state.
 * - Each toast automatically disappears after its `delay` duration or can be closed by the user.
 * - Fade-out animation duration is defined by `FADE_DURATION` for a smooth visual transition.
 *
 * @returns {JSX.Element} A React context provider that manages and displays toast notifications.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const FADE_DURATION = 300;

  const addToast = (message, variant = "info", delay = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, variant, delay, show: true }]);
  };

  const requestCloseToast = (id) => {
    setToasts(prev =>
      prev.map(t => (t.id === id ? { ...t, show: false } : t))
    );
    setTimeout(() => removeToast(id), FADE_DURATION);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer
        className="p-3"
        position="bottom-end"
        style={{ zIndex: 10 }}
      >
        {toasts.map(toast => {
          const variant =
            toast.variant === "success" ? "success" :
            toast.variant === "error"   ? "danger"  :
                                          "secondary";
          const textClass = variant === "secondary" ? "" : "text-white";

          return (
            <Toast
              key={toast.id}
              show={toast.show}
              onClose={() => requestCloseToast(toast.id)}
              autohide
              delay={toast.delay}
              bg={variant}
              className={textClass}
              style={{ minWidth: "250px", marginBottom: "10px" }}
              animation
            >
              <Toast.Body>{toast.message}</Toast.Body>
            </Toast>
          );
        })}
      </ToastContainer>
    </ToastContext.Provider>
  );
}