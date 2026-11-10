import { useCallback } from 'react';
import { markHelpSeen, typeInTerminal } from '../../engine/help';
import { useGame, useStore } from '../../ui/useGame';
import { HelpView } from './HelpView';

export function HelpApp() {
  const store = useStore();
  const state = useGame((s) => s);
  const onType = useCallback((cmd: string) => store.apply(typeInTerminal(store.get(), cmd)), [store]);
  const onSeen = useCallback(() => store.apply(markHelpSeen(store.get())), [store]);
  return <HelpView state={state} onType={onType} onSeen={onSeen} />;
}
