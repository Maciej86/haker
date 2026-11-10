import type { Skill } from '../../engine/types';
import { toolsCount } from '../../engine/shop';
import { fmt, fmtSkill } from '../../engine/text';
import { useSkillFlash } from '../../ui/GainBubble';
import { Card } from '../../ui/Card';
import { Meter } from '../../ui/Meter';
import { useGame } from '../../ui/useGame';
import { StageCard } from './StageCard';

// misja.html linie 463–479 i 673–674
export function PlayerPanel() {
  const s = useGame((x) => x);
  const flash = useSkillFlash();
  const need = s.lvl * 200;
  return (
    <aside id="hud" aria-label="Twój profil">
      <StageCard />
      <div className="card who">
        <span className="avatar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 21c0-5 3.6-8 8-8s8 3 8 8M7 11V8a5 5 0 0110 0v3" /><path d="M9.5 10.5h1M13.5 10.5h1" />
          </svg>
        </span>
        <div style={{ flex: 1 }}>
          <b>ghost <span style={{ color: 'var(--dim)', fontWeight: 400 }}>poziom {s.lvl}</span></b>
          <Meter value={Math.min(1, s.xp / need)} />
          <small>{s.xp} / {need} XP</small>
        </div>
      </div>
      <Card title="Umiejętności">
        <div id="skills">
          {(Object.entries(s.skills) as [Skill, number][]).map(([sk, v]) => (
            <div key={sk} className={flash === sk ? 'skill up' : 'skill'}>
              <span>{sk}</span><Meter value={v / 5} /><span>{fmtSkill(v)}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Zasoby">
        <div className="res"><span><i className="coin">¤</i>Kredyty</span><b>{fmt(s.money)}</b></div>
        <div className="res">
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" strokeWidth="1.8">
              <path d="M14.5 6.5a4 4 0 00-5.2 5.2L3.5 17.5 6.5 20.5l5.8-5.8a4 4 0 005.2-5.2L15 12l-3-3z" />
            </svg>Narzędzia
          </span>
          <b>{toolsCount(s)}</b>
        </div>
      </Card>
      <Card title="Sprzęt">
        <div className="res"><span>Procesor</span><b>{s.hw.cpu.toLocaleString('pl-PL')} GHz</b></div>
        <div className="res"><span>Pamięć</span><b>{s.hw.ram} GB</b></div>
        <div className="res"><span>Łącze</span><b>{s.hw.net} Mb/s</b></div>
      </Card>
    </aside>
  );
}
