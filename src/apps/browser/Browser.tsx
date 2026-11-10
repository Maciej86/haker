import { useState } from 'react';
import { HW_ITEMS, NET_ITEMS } from '../../engine/shop';
import { fmt } from '../../engine/text';
import { useGame } from '../../ui/useGame';
import { ShopList } from '../shop/ShopList';

const TABS = [
  { id: 'hw', label: 'Sprzęt', items: HW_ITEMS },
  { id: 'net', label: 'Internet', items: NET_ITEMS },
] as const;

// misja.html linie 551–563
export function Browser() {
  const money = useGame((s) => s.money);
  const [tab, setTab] = useState<'hw' | 'net'>('hw');
  const cur = TABS.find((t) => t.id === tab)!;
  return (
    <div className="shop">
      <div className="urlbar">https://<b>kiloherc.shop</b>/ulepszenia</div>
      <div className="scroll">
        <div className="shophead"><h2>Ulepszenia</h2><span>Kredyty: <b>{fmt(money)}</b> <i className="coin">¤</i></span></div>
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={t.id === tab} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        <ShopList items={cur.items} />
      </div>
    </div>
  );
}
