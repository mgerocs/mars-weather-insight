import { useEffect, useRef } from "react";

export const useInactivity = (callback: () => void, timeout = 5000) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(callback, timeout);
    };

    const handleInteraction = () => {
      resetTimer();
    };

    window.addEventListener("mousemove", handleInteraction);
    window.addEventListener("mousedown", handleInteraction);
    window.addEventListener("keydown", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);
    window.addEventListener("wheel", handleInteraction);

    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("mousedown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("wheel", handleInteraction);
    };
  }, [callback, timeout]);
};
