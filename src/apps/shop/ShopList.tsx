import type { ShopItem } from '../../engine/shop';
import { buy } from '../../engine/shop';
import { fmt } from '../../engine/text';
import { useGame, useStore } from '../../ui/useGame';
import { SHOP_ICONS } from '../icons';
import './Shop.css';

// misja.html linie 833–842
export function ShopList({ items, red }: { items: ShopItem[]; red?: boolean }) {
  const store = useStore();
  const owned = useGame((s) => s.owned);
  return (
    <div className={red ? 'list red' : 'list'}>
      {items.map((it) => {
        const own = !it.multi && owned.includes(it.id);
        return (
          <div key={it.id} className={own ? 'row owned' : 'row'}>
            <span className="tile">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" dangerouslySetInnerHTML={{ __html: SHOP_ICONS[it.icon] }} />
            </span>
            <div><h4>{it.name}</h4><p>{it.desc}</p></div>
            <span className="price">{it.price ? <><i className="coin">¤</i>{fmt(it.price)}</> : null}</span>
            {/* Stan czytany przy kliknięciu: podwójny klik nie kupi rzeczy jednorazowej drugi raz. */}
            <button className={red ? 'btn red' : 'btn'} disabled={own} onClick={() => store.apply(buy(store.get(), it.id))}>
              {own ? 'Masz' : 'Kup'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
