import type { AppId } from '../engine/types';
import type { ShopIcon } from '../engine/shop';

// Wnętrza <svg viewBox="0 0 24 24"> z misja.html (linie 450–460).
export const ICONS: Record<AppId | 'map', string> = {
  terminal: '<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M6.5 9l3.5 3-3.5 3M12 15h5"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3.5 6.5L12 13l8.5-6.5"/>',
  browser: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-3.5 4-3.5 14 0 18M12 3c3.5 4 3.5 14 0 18"/>',
  darknet: '<path d="M12 2.5l8 3.5v6c0 5-3.4 8.4-8 9.5-4.6-1.1-8-4.5-8-9.5V6z"/><circle cx="12" cy="11" r="2.4"/><path d="M12 13.4v4"/>',
  map: '<path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  plan: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 11h18M10 11v9M15 4v7"/>',
  netmap: '<rect x="9" y="2.5" width="6" height="5" rx="1"/><rect x="2.5" y="16.5" width="6" height="5" rx="1"/><rect x="15.5" y="16.5" width="6" height="5" rx="1"/><path d="M12 7.5v4.5M5.5 16.5V12h13v4.5"/>',
  wytrych: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/>',
  help: '<path d="M4 4.5h6a2 2 0 012 2V20a2 2 0 00-2-2H4zM20 4.5h-6a2 2 0 00-2 2V20a2 2 0 012-2h6z"/>',
  notes: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 11h7M9 15h7M9 19h4"/>',
  achievements: '<path d="M7 4h10v5a5 5 0 01-10 0zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3M12 14v4M8 21h8"/>',
  // [decyzja Claude'a] w makiecie nie ma tych ikon
  downloads: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M4 15v4h16v-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};

// Obiekt ICON z misja.html (linie 650–659).
export const SHOP_ICONS: Record<ShopIcon | 'lock', string> = {
  cpu: '<rect x="6" y="6" width="12" height="12" rx="1"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  ram: '<rect x="2.5" y="7" width="19" height="9" rx="1"/><path d="M6 10v3M10 10v3M14 10v3M18 10v3M5 16v2M19 16v2"/>',
  net: '<path d="M2.5 9a14 14 0 0119 0M5.5 12.5a9.5 9.5 0 0113 0M8.5 16a5 5 0 017 0"/><circle cx="12" cy="19" r="1.2"/>',
  bug: '<rect x="7.5" y="7" width="9" height="12" rx="4.5"/><path d="M9 7a3 3 0 016 0M3 12h4.5M16.5 12H21M4 7l3.5 2M20 7l-3.5 2M4 18l3.5-2M20 18l-3.5-2"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><path d="M4 4l16 16"/>',
  loop: '<path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="1.5"/><path d="M8 11V8a4 4 0 018 0v3"/>',
};

// Ikony w paskach tytułu, które w makiecie są uproszczone względem ikon pulpitu (misja.html linie 541, 567, 578).
export const WIN_ICONS: Partial<Record<AppId, string>> = {
  notes: '<path d="M6 3h9l4 4v14H6z"/>',
  darknet: '<path d="M12 2.5l8 3.5v6c0 5-3.4 8.4-8 9.5-4.6-1.1-8-4.5-8-9.5V6z"/>',
  achievements: '<path d="M7 4h10v5a5 5 0 01-10 0zM12 14v4M8 21h8"/>',
};
