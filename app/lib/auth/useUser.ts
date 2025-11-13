import { useMatches } from '@remix-run/react';

export type UserClaims = {
  sub: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  tid?: string;
  roles?: string[];
};

type RootLoaderData = {
  isAuthenticated: boolean;
  user?: UserClaims;
};

export function useUser(): UserClaims | null {
  const matches = useMatches();
  const root = matches.find((m) => m.id === 'root');
  const data = root?.data as RootLoaderData | undefined;

  return (data?.user as UserClaims | undefined) ?? null;
}

export function useIsAuthenticated(): boolean {
  const matches = useMatches();
  const root = matches.find((m) => m.id === 'root');
  const data = root?.data as RootLoaderData | undefined;

  return Boolean(data?.isAuthenticated);
}
