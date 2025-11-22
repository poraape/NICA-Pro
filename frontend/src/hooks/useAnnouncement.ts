import { useEffect, useRef } from "react";

/**
 * Provides a polite live region announcer for screen readers.
 */
export const useAnnouncement = () => {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const region = document.createElement("div");
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    region.style.position = "absolute";
    region.style.left = "-9999px";
    region.style.top = "-9999px";

    document.body.appendChild(region);
    liveRegionRef.current = region;

    return () => {
      region.remove();
    };
  }, []);

  const announce = (message: string) => {
    if (!liveRegionRef.current) return;
    liveRegionRef.current.textContent = "";
    window.requestAnimationFrame(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = message;
      }
    });
  };

  return { announce };
};
