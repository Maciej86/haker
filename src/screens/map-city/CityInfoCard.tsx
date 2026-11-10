// Karta miasta lub dzielnicy w lewym górnym rogu (#city, mapa-miasta.html 559–571), tryb app=1: bez „◎ pokaż cel”.
import { CITY_BLURB, DISTRICT_META, TIER_META } from '../../world/city/meta';
import type { DistrictKey } from '../../world/city/types';

type Props = {
  tab: 'nt' | 'leszno' | 'poznan';
  dist: DistrictKey | null;
  airport: boolean;
  onCity: () => void;
  onSign: () => void;
};

export function CityInfoCard({ tab, dist, airport, onCity, onSign }: Props) {
  if (tab !== 'poznan') {
    const T = TIER_META[tab];
    return <div className="citybox"><b>{T.label}</b> <span className="dim">· {T.tag}</span><p>{T.blurb}</p></div>;
  }
  if (!dist) {
    return <div className="citybox"><b>{CITY_BLURB.title}</b> <span className="dim">· {CITY_BLURB.tag}</span><p>{CITY_BLURB.text}</p></div>;
  }
  const D = DISTRICT_META[dist];
  return (
    <div className="citybox">
      <div className="crumb"><a onClick={onCity}>Poznań</a> › <b>{D.name}</b> <span className="dim">· {D.tag}</span></div>
      <p>{D.blurb}</p>
      {airport ? <p className="txt">✈ Drogowskaz na lotnisko stoi na wschodnim końcu al. Wojska Polskiego.</p> : null}
      <div className="btns">
        <button className="cbtn" onClick={onCity}>← cały Poznań</button>
        {airport ? <button className="cbtn" onClick={onSign}>pokaż drogowskaz</button> : null}
        <button className="cbtn" disabled>✈ lotnisko · niedostępne w demo</button>
      </div>
    </div>
  );
}
