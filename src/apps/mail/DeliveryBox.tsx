import { useMemo, useState } from 'react';
import type { MissionId } from '../../engine/types';
import { deliver, deliveryFiles, replyBox } from '../../engine/delivery';
import { useGame, useStore } from '../../ui/useGame';

const DIM = { color: 'var(--dim)' };

/** Pole oddania zlecenia w wątku Poczty (misja.html linie 1478–1482). */
export function DeliveryBox({ id }: { id: MissionId }) {
  const store = useStore();
  const s = useGame((x) => x);
  const box = useMemo(() => replyBox(s, id), [s, id]);
  // szkic oddania w stanie komponentu: mail.draft[id] trzyma tekst przyjęcia
  const [text, setText] = useState(() => box?.text ?? '');
  const [chosen, setChosen] = useState<string | null>(null);
  if (!box) return null;

  const files = deliveryFiles(s, id);
  const blocked = box.attach && (!chosen || !files.some((f) => f.fileId === chosen));
  const send = () => {
    store.apply(deliver(store.get(), id, text, box.attach ? chosen : null));
    setChosen(null);
  };

  return (
    <div className="reply">
      <b style={{ fontWeight: 500 }}>{box.title}</b>
      <textarea aria-label={box.title} value={text} onChange={(e) => setText(e.target.value)} />
      {box.attach ? (
        <>
          <div style={{ ...DIM, fontSize: 12 }}>Załącznik z folderu Pobrane:</div>
          <div className="atts">
            {files.length ? files.map((f) => (
              <button
                key={f.fileId}
                className={chosen === f.fileId ? 'chip on' : 'chip'}
                aria-pressed={chosen === f.fileId}
                onClick={() => setChosen(f.fileId)}
              >
                📎 {f.name}
              </button>
            )) : <span style={{ ...DIM, fontSize: 12 }}>{box.emptyAttach}</span>}
          </div>
        </>
      ) : null}
      <button className="btn" disabled={blocked} onClick={send}>{box.button}</button>{' '}
      <span style={{ ...DIM, fontSize: 11 }}>{box.cost} min gry</span>
    </div>
  );
}
