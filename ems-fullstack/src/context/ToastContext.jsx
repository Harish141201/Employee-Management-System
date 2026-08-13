import { useCallback, useEffect, useState } from 'react'
import ToastContext from './toastContextInstance'

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const dismiss = useCallback(id => setToasts(current => current.filter(toast => toast.id !== id)), [])
    const showToast = useCallback((message, type = 'success') => {
        const id = `${Date.now()}-${Math.random()}`
        setToasts(current => [...current, { id, message, type }])
        window.setTimeout(() => dismiss(id), 4200)
    }, [dismiss])

    useEffect(() => () => setToasts([]), [])

    return <ToastContext.Provider value={{ showToast, dismiss }}>
        {children}
        <div className="toast-stack" aria-live="polite" aria-atomic="true">
            {toasts.map(toast => <div className={`ph-toast ph-toast--${toast.type}`} key={toast.id} role="status"><i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : toast.type === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-x-circle-fill'}`}></i><span>{toast.message}</span><button onClick={() => dismiss(toast.id)} aria-label="Dismiss notification"><i className="bi bi-x"></i></button></div>)}
        </div>
    </ToastContext.Provider>
}
