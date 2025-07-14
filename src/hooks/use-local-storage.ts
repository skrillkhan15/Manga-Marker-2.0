
"use client";

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

// A helper function to determine if running on the server
const isServer = typeof window === 'undefined';

// A wrapper for JSON.parse that handles errors
function safelyParseJSON<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error("Failed to parse JSON from localStorage", e);
    return fallback;
  }
}

function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  // The `useState` initializer function will only be executed on the initial render.
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (isServer) {
      return initialValue;
    }
    const item = window.localStorage.getItem(key);
    return safelyParseJSON(item, initialValue);
  });

  // The `setValue` function is now stable and doesn't depend on `storedValue`
  // from its closure, preventing stale state issues. It uses the function
  // form of a state setter to get the latest state.
  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);

      // Save to local storage
      if (!isServer) {
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
          console.error(`Error setting localStorage key "${key}":`, error);
        }
      }
    },
    [key, storedValue] // storedValue is needed for the function form of setter
  );
  
  // This effect synchronizes the state if the localStorage is changed in another tab.
  useEffect(() => {
    if (isServer) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        setStoredValue(safelyParseJSON(event.newValue, initialValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);


  return [storedValue, setValue];
}

export default useLocalStorage;
