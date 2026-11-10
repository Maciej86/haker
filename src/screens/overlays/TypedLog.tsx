import { useEffect, useState } from 'react';

// misja.html linia 1626: kolejne linie co 350 ms
export function TypedLog({ lines }: { lines: string[] }) {
  const [n, setN] = useState(0);
  const key = lines.join('\n');
  useEffect(() => {
    setN(0);
    const ids = lines.map((_, i) => setTimeout(() => setN(i + 1), 350 * (i + 1)));
    return () => ids.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return <pre>{lines.slice(0, n).join('\n')}</pre>;
}
