import { useRef, useState } from 'react';

// A button that requires two clicks to fire - first click turns it into
// "sure?" for a couple seconds, second click actually confirms. Avoids
// native confirm() popups while still preventing accidental deletes.
export default function ConfirmButton({ onConfirm, className = '', confirmClassName = '', confirmLabel = 'sure?', children }) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef(null);

  function handleClick() {
    if (confirming) {
      clearTimeout(timerRef.current);
      setConfirming(false);
      onConfirm();
    } else {
      setConfirming(true);
      timerRef.current = setTimeout(() => setConfirming(false), 2500);
    }
  }

  return (
    <button type="button" onClick={handleClick} className={confirming ? (confirmClassName || className) : className}>
      {confirming ? confirmLabel : children}
    </button>
  );
}
