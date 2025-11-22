/**
 * Cross-platform haptic feedback helper.
 * Uses the Vibration API when available and no-ops on unsupported devices/browsers.
 */
export const hapticFeedback = {
  light: () => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([20, 20, 20]);
    }
  },
};
