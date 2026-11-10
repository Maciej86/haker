import { achievementView } from '../../engine/achievements';
import { useGame } from '../../ui/useGame';
import { useProfile } from '../../ui/useProfile';
import { Meter } from '../../ui/Meter';
import { SHOP_ICONS } from '../icons';
import '../misc.css';

// misja.html linie 846–858
export function Achievements() {
  const s = useGame((x) => x);
  const { profile } = useProfile();
  return (
    <div className="achs">
      {achievementView(s, profile).map((a) => (
        <div key={a.id} className={['ach', a.done && 'done', a.locked && 'lock'].filter(Boolean).join(' ')}>
          <span className="medal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
              dangerouslySetInnerHTML={{ __html: SHOP_ICONS[a.locked ? 'lock' : 'key'] }} />
          </span>
          <div>
            <h4>{a.title}</h4><p>{a.desc}</p>
            {a.progress ? <Meter value={a.progress[0] / a.progress[1]} /> : null}
          </div>
          <span className="st">{a.status}</span>
        </div>
      ))}
    </div>
  );
}
