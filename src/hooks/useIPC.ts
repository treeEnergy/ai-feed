import { useCallback, useEffect } from 'react';

declare global {
  interface Window {
    electronAPI?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, cb: (...args: any[]) => void) => () => void;
    };
  }
}

export function useIPCInvoke() {
  return useCallback(
    <T = any>(channel: string, ...args: any[]): Promise<T> => {
      if (!window.electronAPI) return Promise.resolve(undefined as T);
      return window.electronAPI.invoke(channel, ...args);
    },
    []
  );
}

export function useIPCListener(channel: string, callback: (...args: any[]) => void) {
  useEffect(() => {
    if (!window.electronAPI?.on) return;
    const unsub = window.electronAPI.on(channel, callback);
    return unsub;
  }, [channel, callback]);
}
