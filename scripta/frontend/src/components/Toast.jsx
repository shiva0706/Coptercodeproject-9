import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

const STYLES = {
  success: 'border-moss text-moss',
  error: 'border-clay text-clay',
  info: 'border-scripta text-scripta',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // action is optional: { label, onClick } - renders a small button inside
  // the toast (e.g. "undo") that dismisses the toast when clicked.
  const showToast = useCallback((message, type = 'info', action = null) => {
    const id = Date.now() + Math.random();
    setToasts((cur) => [...cur, { id, message, type, action }]);
    setTimeout(() => {
      setToasts((cur) => cur.filter((t) => t.id !== id));
    }, action ? 5000 : 3200);
    return id;
  }, []);

  function dismiss(id) {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 font-label">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`journal-page rounded-lg px-4 py-2.5 border-2 shadow-lg text-sm rotate-[-0.5deg] flex items-center gap-3 ${STYLES[t.type] || STYLES.info}`}
          >
            <span>{t.message}</span>
            {t.action && (
              <button
                onClick={() => { t.action.onClick(); dismiss(t.id); }}
                className="underline decoration-dotted hover:decoration-solid shrink-0"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Usage: const showToast = useToast(); showToast('Draft saved', 'success');
// With undo: showToast('Moved to Jul 14', 'success', { label: 'undo', onClick: () => ... });
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}