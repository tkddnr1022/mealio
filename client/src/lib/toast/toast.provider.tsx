'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import { ToastViewport } from '@/components/ui/Toast';

import { registerToastEnqueue } from './toast-bridge';
import { toastReducer } from './toast-reducer';
import type { ToastEnqueueInput, ToastItem, ToastVariant } from './toast.types';

function defaultDurationMs(variant: ToastVariant): number {
  switch (variant) {
    case 'error':
      return 7000;
    case 'warning':
      return 6000;
    case 'info':
      return 4500;
    case 'success':
      return 4000;
    default:
      return 5500;
  }
}

function toToastItem(input: ToastEnqueueInput, id: string): ToastItem {
  const variant = input.variant ?? 'error';
  const durationMs =
    input.durationMs !== undefined
      ? input.durationMs
      : defaultDurationMs(variant);
  return {
    id,
    variant,
    title: input.title,
    message: input.message,
    durationMs,
    dedupeKey: input.dedupeKey,
    action: input.action,
  };
}

interface ToastContextValue {
  enqueue: (input: ToastEnqueueInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({
  children,
}: ToastProviderProps): React.JSX.Element {
  const [items, dispatch] = useReducer(toastReducer, [] as ToastItem[]);

  const dismiss = useCallback((id: string) => {
    dispatch({ type: 'dismiss', id });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: 'clear' });
  }, []);

  const enqueue = useCallback((input: ToastEnqueueInput) => {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const item = toToastItem(input, id);
    dispatch({
      type: 'upsert',
      item,
      dedupeKey: input.dedupeKey,
    });
    return id;
  }, []);

  useEffect(() => {
    registerToastEnqueue(enqueue);
    return () => {
      registerToastEnqueue(null);
    };
  }, [enqueue]);

  const value = useMemo<ToastContextValue>(
    () => ({ enqueue, dismiss, clear }),
    [enqueue, dismiss, clear],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error(
      'useToast must be used within <ToastProvider>. Mount ToastProvider in root providers.',
    );
  }
  return ctx;
}
