import { useCallback, useMemo, useRef, useState } from 'react';
import { Toast } from '@/components/ui/Toast';
import { ToastContext } from './context/toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const notify = useCallback((next: string) => {
    setMessage(next);
    setVisible(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setVisible(false), 2600);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast message={message} visible={visible} />
    </ToastContext.Provider>
  );
}

