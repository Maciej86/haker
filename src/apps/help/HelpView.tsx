import { useEffect } from 'react';
import type { GameState } from '../../engine/types';
import { HELP_INTRO, helpBadge, helpGroups, helpInsert, progsFor } from '../../engine/help';
import './help.css';

export type HelpViewProps = {
  state: GameState;
  onType: (cmd: string) => void;
  onSeen: () => void;
};

export function HelpView({ state, onType, onSeen }: HelpViewProps) {
  const badge = helpBadge(state);
  useEffect(() => {
    if (badge) onSeen();
  }, [badge, onSeen]);

  return (
    <div className="help">
      <p className="help-intro">{HELP_INTRO}</p>
      {helpGroups(state).map(({ group, unlocked, isNew, key }) => (
        <div key={key}>
          <h4>{unlocked ? group.title : `${group.title} · ${group.need ?? 'Odblokujesz później'}`}</h4>
          {group.entries.map((e) => (
            <div key={e.cmd} className={unlocked ? 'cmd' : 'cmd lk'}>
              <span>
                <code dangerouslySetInnerHTML={{ __html: e.cmd }} />
                {unlocked && isNew ? <span className="new">nowe</span> : null}
              </span>
              <span>
                {e.desc}
                {e.cost ? <small>{e.cost}</small> : null}
              </span>
              {unlocked ? <button onClick={() => onType(helpInsert(e))}>Wpisz</button> : <span />}
            </div>
          ))}
        </div>
      ))}
      <h4>Programy na pulpicie</h4>
      {progsFor(state).map(([name, desc]) => (
        <div key={name} className="prog">
          <b>{name}</b>
          <span>{desc}</span>
        </div>
      ))}
    </div>
  );
}
