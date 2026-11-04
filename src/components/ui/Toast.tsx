import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { en } from '../../i18n/en';
import { Icon } from './Icon';

type ToastTone = 'error' | 'info' | 'success';
interface ToastItem { id: number; message: string; tone: ToastTone; }
type Notify = (message: string, tone?: ToastTone) => void;
const ToastContext = createContext<Notify | null>(null);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const sequence = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);
  const notify = useCallback<Notify>((message, tone = 'error') => {
    const id = ++sequence.current;
    setToasts((items) => [...items.slice(-3), { id, message, tone }]);
    timers.current.set(id, setTimeout(() => { dismiss(id); }, 6000));
  }, [dismiss]);
  useEffect(() => {
    const active = timers.current;
    return () => { active.forEach(clearTimeout); active.clear(); };
  }, []);
  return <ToastContext.Provider value={notify}>
    {children}
    <div className="toast-region" aria-live="polite" aria-relevant="additions text">
      {toasts.map((toast) => <div key={toast.id} className={`toast toast-${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
        <Icon name={toast.tone === 'success' ? 'check' : 'info'} size={20} />
        <span>{toast.message}</span>
        <button className="icon-button" aria-label={en.toast.dismiss} onClick={() => { dismiss(toast.id); }}><Icon name="close" /></button>
      </div>)}
    </div>
  </ToastContext.Provider>;
}
export function useToast(): Notify {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
