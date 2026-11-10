// Rozmowa z przechodniem przy szafce (wyjazd.tpl.html 377–401). [decyzja] zawsze 4 odpowiedzi.
import type { TalkKind } from '../../engine/trip';
import { TALKER } from '../../world/trip/talk';
import { TRIP_TEXT } from '../../world/trip/texts';

export type TalkView = {
  q: string; first: boolean; good: number; mid: number;
  opts: [TalkKind, string][];
  ans: null | { you: string; react: string; end: 'ok' | 'fled' | null; badge: string | null };
};

const bars = (n: number) => '▮'.repeat(n) + '▯'.repeat(2 - n);

function Face() {
  return (
    <svg viewBox="0 0 60 60" width="56" height="56">
      <circle cx="30" cy="30" r="29" style={{ fill: 'var(--trip-bubble)', stroke: 'var(--red)' }} />
      <circle cx="30" cy="24" r="10" style={{ fill: 'var(--trip-avatar)' }} />
      <path d="M12 54c2-12 10-17 18-17s16 5 18 17" style={{ fill: 'var(--trip-avatar)' }} />
      <path d="M21 21h18" strokeWidth="2" style={{ stroke: 'var(--trip-label)' }} />
    </svg>
  );
}

type Props = { v: TalkView; social: string; onPick: (o: [TalkKind, string]) => void; onNext: () => void };

export function Talk({ v, social, onPick, onNext }: Props) {
  const a = v.ans;
  return (
    <div className="talk">
      <div className="tk">
        <div className="who"><Face /><div>
          <span className="k">{v.first ? TRIP_TEXT.talkAlarm : TRIP_TEXT.talkPlain}</span><br />
          <b>{TALKER.name}</b><br /><span className="wsub">{TALKER.sub}</span>
        </div></div>
        <div className="bubble">{v.q}</div>
        <div className="meters">
          <span>przekonany <b className="mg">{bars(v.good)}</b></span>
          <span>podejrzliwy <b className="mm">{bars(v.mid)}</b></span>
          <span className="soc">Social {social} · 4 odpowiedzi</span>
        </div>
        {a ? (
          <>
            <div className="you">{TRIP_TEXT.youSaid(a.you)}</div>
            {a.react ? <div className={`bubble ${a.end === 'fled' ? 'bad' : a.end === 'ok' ? 'okb' : ''}`}>{a.react}</div> : null}
            {a.end === 'ok' ? <div className="res okr">{TRIP_TEXT.talkOk}</div> : a.end === 'fled' ? <div className="res badr">{TRIP_TEXT.talkFled}</div> : null}
            {a.badge ? <div className="gain">{a.badge}</div> : null}
            <div className="tnext">
              <button className={`btn ${a.end === 'fled' ? 'red' : 'pri'}`} onClick={onNext}>
                {a.end === 'ok' ? TRIP_TEXT.talkBtn.ok : a.end === 'fled' ? TRIP_TEXT.talkBtn.fled : TRIP_TEXT.talkBtn.next}
              </button>
            </div>
          </>
        ) : (
          <div className="ans">
            {v.opts.map((o, i) => <button key={i} className="a" onClick={() => onPick(o)}><span>{i + 1}</span>{o[1]}</button>)}
          </div>
        )}
      </div>
    </div>
  );
}
