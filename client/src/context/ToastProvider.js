import React, { createContext, useContext, useState } from "react";
import { Toast, ToastContainer } from "react-bootstrap";

const ToastContext = createContext();

export const useToasts = () => useContext(ToastContext);

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