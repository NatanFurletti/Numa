import { useEffect, useState } from 'react';

import { useHistory } from '@/store/history';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

const STORES = [useSettings, useProgress, useHistory];

const allHydrated = () => STORES.every((store) => store.persist.hasHydrated());

/** true quando os dados salvos no aparelho já foram carregados nos stores. */
export function useStoresReady(): boolean {
  const [ready, setReady] = useState(allHydrated);

  useEffect(() => {
    if (ready) return;
    const check = () => {
      if (allHydrated()) setReady(true);
    };
    const unsubscribes = STORES.map((store) => store.persist.onFinishHydration(check));
    check();
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [ready]);

  return ready;
}
