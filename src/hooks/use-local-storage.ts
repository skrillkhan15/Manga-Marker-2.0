
"use client";

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

// A helper function to determine if running on the server
const isServer = typeof window === 'undefined';

// A wrapper for JSON.parse that handles errors
function safelyParseJSON<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    // Check if the value is likely a JSON object/array before parsing
    if (json.startsWith('{') || json.startsWith('[')) {
      return JSON.parse(json);
    }
    // If it's not a JSON object/array string, it might be a simple string or number
    // But our use case for JSON is objects/arrays. Let's return the raw value if it's not what we expect.
    // The type assertion might be tricky here, so we will be careful.
    // For this app's purpose, non-JSON values are not expected for complex types.
    // However, the theme is a simple string. The logic in the hook will handle this.
    return JSON.parse(json);
  } catch (e) {
    // If parsing fails, it's likely a raw string.
    // Let's return it as-is, but the type system expects T.
    // This is a trade-off. Let's assume for this app that if it's not valid JSON,
    // it's a raw string that got stored.
    return json as unknown as T;
  }
}

function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  // The `useState` initializer function will only be executed on the initial render.
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (isServer) {
      return initialValue;
    }
    const item = window.localStorage.getItem(key);
    // For simple strings, JSON.parse will fail. We need to handle this.
    if (item === null) return initialValue;
    
    // The theme is stored as a raw string ("mint", "dark", etc.) not a JSON string.
    // Other values (bookmarks) are stored as JSON strings.
    // We try to parse, and if it fails, we assume it's a raw string.
    try {
        return JSON.parse(item);
    } catch {
        return item as T; // For raw strings like theme
    }
  });

  // The `setValue` function is now stable and doesn't depend on `storedValue`
  // from its closure, preventing stale state issues. It uses the function
  // form of a state setter to get the latest state.
  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      setStoredValue(prevState => {
        const valueToStore = value instanceof Function ? value(prevState) : value;
         // Save to local storage
        if (!isServer) {
            try {
              // Only stringify if it's an object, not for simple strings.
              const storageValue = typeof valueToStore === 'string' ? valueToStore : JSON.stringify(valueToStore);
              window.localStorage.setItem(key, storageValue);
            } catch (error) {
              console.error(`Error setting localStorage key "${key}":`, error);
            }
        }
        return valueToStore;
      });
    },
    [key]
  );
  
  // This effect synchronizes the state if the localStorage is changed in another tab.
  useEffect(() => {
    if (isServer) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch {
          setStoredValue(event.newValue as T);
        }
      } else if (event.key === key && event.newValue === null) {
        setStoredValue(initialValue);
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
