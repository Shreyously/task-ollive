import { useMemo } from 'react';

import { getOrCreateSessionId } from '../lib/session';

export function useSessionId(): string {
  return useMemo(() => getOrCreateSessionId(), []);
}
