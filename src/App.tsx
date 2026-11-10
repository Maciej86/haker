import { Mobile } from './screens/mobile/Mobile';
import { useIsNarrow } from './ui/useIsNarrow';

export default function App() {
  const narrow = useIsNarrow();
  // Stan gry żyje poza Reactem, więc przełączenie ekranu go nie gubi.
  return narrow ? <Mobile /> : <div data-testid="game" />;
}
