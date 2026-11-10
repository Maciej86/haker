// Karta „Zaplanuj wyjazd” po kliknięciu budynku (mapa-miasta.html 623–628).
import type { Tenant } from '../../world/city/types';

type Props = { title: string; tenants: Tenant[]; msg: string | null; onCancel: () => void; onPlan: () => void };

export function GoCard({ title, tenants, msg, onCancel, onPlan }: Props) {
  return (
    <div className="gocard" role="dialog" aria-label={title}>
      <h4>{title}</h4>
      <ul>{tenants.length ? tenants.map((t, i) => <li key={i}><span>{t.f || ''}</span>{t.n}</li>) : <li>pusty</li>}</ul>
      <p className="note">Wyjazd zajmuje czas gry, a komputer jest zablokowany do powrotu. Zły adres to stracony czas i pieniądze.</p>
      <div className="row">
        {msg ? (
          <><span className="msg">{msg}</span><button onClick={onCancel}>OK</button></>
        ) : (
          <><button onClick={onCancel}>Anuluj</button><button className="pri" onClick={onPlan}>▶ Zaplanuj wyjazd tutaj</button></>
        )}
      </div>
    </div>
  );
}
