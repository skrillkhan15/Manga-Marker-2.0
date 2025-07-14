
"use client";

import * as React from 'react';
import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import * as CryptoJS from 'crypto-js';

const PIN_KEY = 'mangamarks-auth-pin';
const LOCK_ENABLED_KEY = 'mangamarks-auth-lock-enabled';
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function useAuthLock() {
  const [isLocked, setIsLocked] = useState(true);
  const inactivityTimer = useInactivityTimer(() => setIsLocked(true));

  const isLockEnabled = useLocalStorage(LOCK_ENABLED_KEY, (value) => {
    if (value === null) return false; // Default to disabled
    const isEnabled = value === 'true';
    if (!isEnabled) {
      setIsLocked(false); // If lock is disabled, unlock the app
    }
    return isEnabled;
  });

  const isPinSet = useLocalStorage(PIN_KEY, (value) => !!value);

  const unlockApp = useCallback(async (pin: string) => {
    if (!isLockEnabled) return true;

    const storedPinHash = localStorage.getItem(PIN_KEY);
    if (!storedPinHash) return false;

    const success = await verifyPin(pin, storedPinHash);
    if (success) {
      setIsLocked(false);
      inactivityTimer.reset();
    }
    return success;
  }, [isLockEnabled, inactivityTimer]);

  const setPin = useCallback(async (pin: string) => {
    const hashedPin = await hashPin(pin);
    localStorage.setItem(PIN_KEY, hashedPin);
    setIsLocked(false);
    inactivityTimer.reset();
    _dispatchEvent(PIN_KEY, hashedPin);
  }, [inactivityTimer]);
  
  const changePin = useCallback(async (newPin: string) => {
    const hashedPin = await hashPin(newPin);
    localStorage.setItem(PIN_KEY, hashedPin);
    _dispatchEvent(PIN_KEY, hashedPin);
  }, []);

  const setIsLockEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem(LOCK_ENABLED_KEY, String(enabled));
    if (enabled && !isPinSet) {
      // If enabling lock but no PIN is set, force lock to start setup
      setIsLocked(true);
    } else if (!enabled) {
      // If disabling, make sure app is unlocked
      setIsLocked(false);
    }
    _dispatchEvent(LOCK_ENABLED_KEY, String(enabled));
  }, [isPinSet]);

  const checkPin = useCallback(async (pin: string) => {
    const storedPinHash = localStorage.getItem(PIN_KEY);
    if (!storedPinHash) return false;
    return await verifyPin(pin, storedPinHash);
  }, []);
  
  const resetApp = useCallback(() => {
    Object.keys(localStorage).forEach(key => {
        if(key.startsWith('mangamarks-')) {
            localStorage.removeItem(key);
        }
    });
    // Dispatch events to update other hooks/tabs
    _dispatchEvent(PIN_KEY, null);
    _dispatchEvent(LOCK_ENABLED_KEY, 'false');
    window.location.reload();
  }, []);

  useEffect(() => {
    // Lock the app on initial load if the lock is enabled
    if (isLockEnabled && isPinSet) {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
  }, []); // Run only on mount


  return { isLocked, isLockEnabled, setIsLockEnabled, unlockApp, setPin, changePin, resetApp, isPinSet, checkPin };
}


// --- Helper Hooks & Functions ---

function useInactivityTimer(onTimeout: () => void) {
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(onTimeout, INACTIVITY_TIMEOUT);
  }, [onTimeout]);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, reset));

    reset(); // Start the timer on mount

    return () => {
      events.forEach(event => window.removeEventListener(event, reset));
      cleanup();
    };
  }, [reset, cleanup]);

  return { reset };
}


async function hashPin(pin: string): Promise<string> {
    const salt = CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);
    const hash = CryptoJS.PBKDF2(pin, salt, {
        keySize: 512 / 32,
        iterations: 1000
    }).toString(CryptoJS.enc.Hex);
    return salt + hash;
}

async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
    const salt = storedHash.substring(0, 32);
    const hashToCompare = storedHash.substring(32);
    const hash = CryptoJS.PBKDF2(pin, salt, {
        keySize: 512 / 32,
        iterations: 1000
    }).toString(CryptoJS.enc.Hex);
    return hash === hashToCompare;
}


// A simple pub/sub implementation for cross-tab state synchronization
const _subscribers = new Set<(key: string, value: any) => void>();

function _subscribe(callback: (key: string, value: any) => void) {
  _subscribers.add(callback);
  return () => _subscribers.delete(callback);
}

function _dispatchEvent(key: string, value: any) {
  window.localStorage.setItem(key, value); // Ensure the value is set for other tabs
  _subscribers.forEach(cb => cb(key, value));
}

// Custom hook to use localStorage and sync with other tabs
function useLocalStorage(key: string, selector: (value: string | null) => any) {
  const getSnapshot = () => selector(localStorage.getItem(key));
  
  const getServerSnapshot = () => selector(null);

  const subscribe = useCallback((callback: () => void) => {
    const cb = (k: string) => {
      if (k === key) {
        callback();
      }
    };
    return _subscribe(cb);
  }, [key]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
