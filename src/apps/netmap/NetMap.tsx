import { useState } from 'react';
import type { GameState, StepResult } from '../../engine/types';
import { step } from '../../engine/types';
import { focusMission, missionDef } from '../../engine/missions';
import { clearFilter, isTarget, matchNode, netNodes, toggleCross } from '../../engine/network';
import { notesView } from '../../engine/desktop';
import { typeInTerminal } from '../../engine/help';
import { BRANCHES } from '../../world/tower';
import { useGame, useStore } from '../../ui/useGame';
import { NodeButton } from './NodeButton';
import { NodeDetail, SideBlock, type SideActions } from './NodeDetail';
import '../misc.css';
import './netmap.css';

export function netmapTitle(s: GameState): string {
  return `NetMap 1.0 · schemat sieci${s.net.scanned ? ' · za skrzynką S1' : ''}`;
}

// misja.html linie 500–521 (HTML) i 1026–1055 (renderNet, renderDet)
export function NetMap() {
  const s = useGame((x) => x);
  const store = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const net = s.net;
  const all = netNodes(s);
  const overlay = missionDef(focusMission(s))?.network;
  const side = overlay?.side?.(s) ?? {};
  const found = overlay?.targetFound?.(s) ?? false;
  const now = Math.floor(s.t / 60) % 24;
  const actions: SideActions = {
    type: (cmd) => store.apply(typeInTerminal(store.get(), cmd)),
    act: (f: (x: GameState) => StepResult) => store.apply(f(store.get())),
  };
  const node = net.scanned ? all.find((n) => n.ip === sel) : undefined;

  return (
    <div className="netwrap">
      <div className="netmap">
        <div className="netcost">
          <span>NetMap rysuje wynik <b style={{ color: 'var(--acc)' }}>scan</b> z Terminala.</span>
          <span>Oglądanie, skreślanie i filtry: <b>za darmo</b></span>
          <span>Sprawdzenie (<b style={{ color: 'var(--acc)' }}>probe</b>): <b>6 min gry · 3 min urządzenia</b></span>
        </div>
        {net.filter ? (
          <div className="filt">
            Filtr z Terminala: <code>scan {net.filter.txt}</code> · pasuje {all.filter((n) => matchNode(n, net.filter)).length} z {all.length}
            <button onClick={() => store.apply(step(clearFilter(store.get())))}>wyczyść</button>
          </div>
        ) : null}
        {!net.scanned ? (
          <div className="empty">Brak danych.<br />Połącz się z urządzeniem i wpisz w Terminalu <b style={{ color: 'var(--acc)' }}>scan</b>.</div>
        ) : (
          <div className="tree">
            <div className="s1box">S1<small>PODSŁUCH-1</small><small>Poznań-Centrum</small></div>
            <div className="branches">
              {BRANCHES.filter(([k]) => all.some((n) => n.net === k)).map(([k, label]) => {
                const [head, ...rest] = label.split(' · ');
                return (
                  <div className="br" key={k}>
                    <h4><b>{head}</b> · {rest.join(' · ')}</h4>
                    <div className="nodes">
                      {all.filter((n) => n.net === k).map((n) => (
                        <NodeButton key={n.ip} n={n} now={now} onSelect={() => setSel(n.ip)} look={{
                          checked: net.checked.includes(n.ip),
                          target: isTarget(s, n),
                          crossed: net.crossed.includes(n.ip),
                          match: net.filter ? matchNode(n, net.filter) : null,
                          sel: sel === n.ip,
                        }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className="netside">
        {net.scanned ? (
          <div className="det">
            {side.top ? <SideBlock side={side.top} actions={actions} className="netdone" /> : null}
            {node || !side.top ? (
              <NodeDetail
                n={node} now={now}
                checked={!!node && net.checked.includes(node.ip)}
                target={!!node && isTarget(s, node)}
                crossed={!!node && net.crossed.includes(node.ip)}
                hideActs={found}
                onCross={() => node && store.apply(step(toggleCross(store.get(), node.ip)))}
                onProbe={() => node && actions.type(`probe ${node.ip}`)}
              />
            ) : null}
          </div>
        ) : <div className="det" />}
        <div><h3>Twoja wiedza z rozpoznania</h3>
          <div>{notesView(s).cards.map((c) => (
            <div className="clue" key={c.id}><span className="src">{c.src}</span><span dangerouslySetInnerHTML={{ __html: c.html }} /></div>
          ))}</div>
        </div>
        <div><h3>Kształt = odcisk portów</h3>
          <div className="legend"><span><b>◆</b>serwer</span><span><b>●</b>komputer</span><span><b>■</b>router, sterownik</span><span><b>▲</b>drukarka</span><span><b>◉</b>kamera</span></div>
        </div>
        <div><h3>Moduły NetMap</h3>
          <div className="mods">
            <span className="on">✓ Kształt (odcisk portów)<small>w zestawie</small></span>
            <span className="on">✓ Aktywność dobowa<small>w demo za darmo</small></span>
            <span className="lk">🔒 Porty i usługi<small>sklep · 400 ¤</small></span>
            <span className="lk">🔒 Wersje oprogramowania<small>Darknet</small></span>
          </div>
        </div>
        <div><h3>Podpowiedzi</h3>
          {side.hints ? <SideBlock side={side.hints} actions={actions} btnClass="hintbtn" /> : <div />}
        </div>
      </div>
    </div>
  );
}
