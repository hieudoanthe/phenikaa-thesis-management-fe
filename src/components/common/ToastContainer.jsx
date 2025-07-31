import React, { useState, useEffect } from "react";
import Toast from "./Toast";

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => {
      const newToasts = [...prev, { id, message, type, duration }];
      return newToasts.length > 3 ? newToasts.slice(1) : newToasts;
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearOldToasts = () => {
    setToasts((prev) => prev.filter((t) => Date.now() - t.id < 3500));
  };

  useEffect(() => {
    const timer = setTimeout(clearOldToasts, 3500);
    return () => clearTimeout(timer);
  }, [toasts]);

  useEffect(() => {
    // Expose addToast globally
    window.addToast = addToast;

    return () => {
      delete window.addToast;
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 32,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column-reverse",
        gap: 16,
        maxWidth: 550,
      }}
    >
      {toasts
        .slice()
        .reverse()
        .map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
    </div>
  );
};

export default ToastContainer;
