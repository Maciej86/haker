import { useState } from 'react';
import './Mobile.css';

export function Mobile() {
  const link = window.location.origin + import.meta.env.BASE_URL;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // schowek niedostępny: link zostaje w polu do ręcznego skopiowania
    }
  }

  return (
    <main className="mobile">
      <div className="mobile-logo">&gt;_ NeonOS</div>
      <p>Demo działa na komputerze. Otwórz ten link na komputerze z większym ekranem.</p>
      <input
        readOnly
        aria-label="Link do gry"
        value={link}
        onFocus={(e) => e.currentTarget.select()}
      />
      <button type="button" className="btn" onClick={copy}>
        {copied ? 'Skopiowano' : 'Kopiuj link'}
      </button>
    </main>
  );
}
