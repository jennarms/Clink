import { useEffect, useRef, useState } from 'react';

const DEFAULT_DISPLAY_MS = 3500;

// Drop this into any component that needs a "Saved!" style confirmation
// after an async action. Handles showing it and auto-hiding it after a
// delay, and cleans up its timer on unmount so it never tries to update
// state after the component is gone.
//
// Usage:
//   const { visible, trigger } = useSavedConfirmation();
//   ...
//   await saveThing();
//   trigger();
//   ...
//   <SavedConfirmation show={visible} message="Background saved." />
export default function useSavedConfirmation(displayMs = DEFAULT_DISPLAY_MS) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const trigger = () => {
    setVisible(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), displayMs);
  };

  const dismiss = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
  };

  return { visible, trigger, dismiss };
}