import { memo } from 'react';
import { rng } from '../../engine/rng';

type Win = { x: number; y: number };

// [decyzja Claude'a] stałe ziarno: tapeta wygląda zawsze tak samo (misja.html linie 1653–1655).
function lights(): [Win[], Win[]] {
  const r = rng(7);
  const acc: Win[] = [];
  const coin: Win[] = [];
  for (let i = 0; i < 260; i++) {
    const w = { x: (r() * 1200) | 0, y: (60 + r() * 330) | 0 };
    (r() < 0.85 ? acc : coin).push(w);
  }
  return [acc, coin];
}
const [ACC, COIN] = lights();

const rects = (list: Win[]) => list.map((w, i) => <rect key={i} x={w.x} y={w.y} width="4" height="6" />);

// misja.html linie 422–434
export const Wallpaper = memo(function Wallpaper() {
  return (
    <div id="wall" aria-hidden="true">
      <svg viewBox="0 0 1200 400" preserveAspectRatio="none">
        <g style={{ fill: 'var(--bld)' }}>
          <rect x="0" y="180" width="70" height="220" /><rect x="60" y="120" width="90" height="280" /><rect x="150" y="210" width="60" height="190" />
          <rect x="205" y="60" width="110" height="340" /><rect x="315" y="160" width="70" height="240" /><rect x="380" y="100" width="95" height="300" />
          <rect x="470" y="200" width="80" height="200" /><rect x="545" y="30" width="120" height="370" /><rect x="660" y="140" width="85" height="260" />
          <rect x="740" y="90" width="100" height="310" /><rect x="835" y="190" width="70" height="210" /><rect x="900" y="70" width="120" height="330" />
          <rect x="1015" y="150" width="90" height="250" /><rect x="1100" y="110" width="100" height="290" />
        </g>
        <g style={{ fill: 'var(--acc)' }} opacity=".28">{rects(ACC)}</g>
        <g style={{ fill: 'var(--coin)' }} opacity=".3">{rects(COIN)}</g>
      </svg>
    </div>
  );
});
