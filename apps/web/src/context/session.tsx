'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { authClient } from '@/src/utils/authClient';

export const SessionContext = createContext<{
  session: Session | null;
}>({
  session: null,
});

export type Session = Awaited<ReturnType<typeof authClient.getSession>>;

export const SessionProvidor = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const currentSession = await authClient.getSession();
      setSession(currentSession);
    };

    fetchSession();
  }, []);

  return (
    <SessionContext.Provider value={{ session }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  return useContext(SessionContext).session?.data;
};
