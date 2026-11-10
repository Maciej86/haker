import './Overlay.css';

// Pauza czasu rzeczywistego (karta ukryta, plan 01)
export function Pause({ onResume }: { onResume: () => void }) {
  return (
    <div className="ovl pause" role="dialog" aria-label="Pauza" onClick={onResume}>
      <div className="card">Pauza · kliknij, żeby wrócić do gry</div>
    </div>
  );
}
