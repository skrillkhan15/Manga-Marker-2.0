
"use client";

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

// A helper function to determine if running on the server
const isServer = typeof window === 'undefined';

// A wrapper for JSON.parse that handles errors
function safelyParseJSON<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch (e) {
    // It's not a valid JSON string, return null
    return null;
  }
}

function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  // The `useState` initializer function will only be executed on the initial render.
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (isServer) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return initialValue;

      // Try parsing as JSON
      const parsedItem = safelyParseJSON<T>(item);
      // If parsing fails, it might be a raw string value (like for themes)
      return parsedItem !== null ? parsedItem : (item as T);
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (!isServer) {
            const storageValue = typeof valueToStore === 'object' ? JSON.stringify(valueToStore) : String(valueToStore);
            window.localStorage.setItem(key, storageValue);
        }
      } catch (error) {
         console.error(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, storedValue]
  );
  
  useEffect(() => {
    if (isServer) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        if (event.newValue) {
           try {
            const parsed = safelyParseJSON<T>(event.newValue);
            setStoredValue(parsed !== null ? parsed : (event.newValue as T));
          } catch {
             setStoredValue(event.newValue as T);
          }
        } else {
          setStoredValue(initialValue);
        }
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
