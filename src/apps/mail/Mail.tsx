import { useState } from 'react';
import type { MissionId } from '../../engine/types';
import { defaultThread, mailThreads, markRead, sendAccept, setDraft, threadStatus } from '../../engine/mail';
import { BUSY_NOTE, missionDef } from '../../engine/missions';
import { dayVars } from '../../engine/clock';
import { fill, fmt } from '../../engine/text';
import { useGame, useStore } from '../../ui/useGame';
import { useHiddenMail } from './delayed';
import './Mail.css';

const DIM = { color: 'var(--dim)' };

// misja.html linie 548, 1471–1485 i 1849–1862
export function Mail() {
  const store = useStore();
  const s = useGame((x) => x);
  const isHidden = useHiddenMail();
  const [picked, setPicked] = useState<MissionId | null>(null);
  const threads = mailThreads(s);
  const id = threads.some((t) => t.id === picked) ? picked : defaultThread(s);

  const pick = (t: MissionId) => {
    setPicked(t);
    store.apply(markRead(store.get(), t));
  };

  return (
    <div className="mail">
      <ul id="mail-list">
        {threads.map((t) => (
          <li key={t.id}>
            <button className={t.unread ? 'unread' : undefined} aria-current={t.id === id} onClick={() => pick(t.id)}>
              <span className="from">{t.from}</span>
              <span className="subj">{t.subject}</span>
            </button>
          </li>
        ))}
      </ul>
      <article className="msg" id="mail-msg">{id ? <Thread id={id} hidden={isHidden} /> : null}</article>
    </div>
  );
}

function Thread({ id, hidden }: { id: MissionId; hidden: (thread: string, html: string) => boolean }) {
  const store = useStore();
  const s = useGame((x) => x);
  const { offer, giver } = missionDef(id);
  const status = threadStatus(s, id);
  const vars = dayVars(s);
  const draft = s.mail.draft[id] ?? offer.acceptReply;

  return (
    <>
      <h2>{offer.subject}</h2>
      <div className="meta">{giver.name}, {fill(offer.when, vars)}</div>
      {offer.body.map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: fill(p, vars) }} />)}
      <div className="reward">
        <span className="sum"><i className="coin">¤</i>{fmt(offer.reward)}</span>
        <span className="lvl">{offer.levelLabel}</span>
        {status === 'blocked' ? <button className="btn" disabled>{BUSY_NOTE.button}</button>
          : status === 'open' ? <span style={{ ...DIM, fontSize: 12 }}>odpowiedz, żeby przyjąć</span>
          : <button className="btn" disabled>{status === 'done' ? 'Zakończone' : 'Przyjęte'}</button>}
      </div>
      {(s.mail.threads[id] ?? []).filter((m) => !hidden(id, m.html)).map((m, i) => (
        <div key={i} className={m.bad ? 'inbox bad' : 'inbox'}>
          <b>{m.from}</b> <span style={DIM}>{m.when}</span><br />
          {/* HTML z gry; tekst gracza silnik już przepuścił przez esc() */}
          <span dangerouslySetInnerHTML={{ __html: m.html }} />
          {m.attachment ? <><br />📎 {m.attachment}</> : null}
        </div>
      ))}
      {/* plan 11: <DeliveryBox id={id} /> gdy canDeliver(s, id) */}
      {status === 'blocked' ? (
        <div className="inbox">
          <b style={{ color: 'var(--coin)' }}>{BUSY_NOTE.title}</b><br /><span style={DIM}>{BUSY_NOTE.body}</span>
        </div>
      ) : null}
      {status === 'open' ? (
        <div className="reply">
          {/* [decyzja Claude'a] makieta: „Odpowiedz Kubie”; bez celownika w danych oferty bierzemy imię */}
          <b style={{ fontWeight: 500 }}>Odpowiedz {giver.name}</b>
          <textarea value={draft} onChange={(e) => store.apply(setDraft(store.get(), id, e.target.value))} />
          <button className="btn" onClick={() => store.apply(sendAccept(store.get(), id, draft))}>Wyślij i przyjmij zlecenie</button>{' '}
          <span style={{ ...DIM, fontSize: 11 }}>{offer.acceptCost} min gry</span>
        </div>
      ) : null}
    </>
  );
}
