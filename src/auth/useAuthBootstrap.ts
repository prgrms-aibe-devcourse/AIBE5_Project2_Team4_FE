import { useEffect, useState } from 'react';
import { AUTH_USER_EVENT, bootstrapAuthSession, getCurrentUser, isAuthBootstrapped } from './authSession';
import type { User } from './user';

export function useAuthBootstrap(): { ready: boolean; user: User | null } {
  const [ready, setReady] = useState(isAuthBootstrapped());
  const [user, setUser] = useState<User | null>(getCurrentUser());

  useEffect(() => {
    const sync = () => setUser(getCurrentUser());
    void bootstrapAuthSession().finally(() => {
      setReady(true);
      sync();
    });

    window.addEventListener(AUTH_USER_EVENT, sync);
    return () => window.removeEventListener(AUTH_USER_EVENT, sync);
  }, []);

  return { ready, user };
}
