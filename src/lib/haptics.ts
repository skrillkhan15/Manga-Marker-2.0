
"use client";

/**
 * Triggers a short haptic feedback vibration on supported devices.
 * This is intended for subtle feedback on user actions.
 */
export const triggerHapticFeedback = () => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      // A short vibration (50ms) is good for quick feedback
      navigator.vibrate(50);
    } catch (e) {
      console.warn("Haptic feedback failed.", e);
    }
  }
};
