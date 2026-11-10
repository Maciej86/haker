import { DARK_ITEMS } from '../../engine/shop';
import { ShopList } from '../shop/ShopList';

// misja.html linie 565–574
export function Darknet() {
  return (
    <div className="shop">
      <div className="urlbar">onion://<b>czarnyrynek7q</b>/oferty</div>
      <div className="scroll">
        <div className="shophead"><h2>Oferty graczy</h2><span style={{ color: 'var(--dim)' }}>Ceny ustalają sprzedający</span></div>
        <ShopList items={DARK_ITEMS} red />
        <p className="note">Sprzedaż własnych programów odblokujesz po misji 3. Twoje narzędzia trafią na tę listę pod Twoim pseudonimem.</p>
      </div>
    </div>
  );
}
