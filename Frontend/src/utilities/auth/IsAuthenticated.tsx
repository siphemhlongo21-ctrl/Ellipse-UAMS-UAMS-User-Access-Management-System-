import Fallback from '../../pages/auth/Fallback';
import { useAuth } from '../../context/AuthProvider';
import type { JSX } from 'react/jsx-runtime';
import type { ReactNode } from 'react';

const IsAuthenticated = ({
  fallback=<Fallback />,
  children
}: { fallback?: JSX.Element ,children: ReactNode }) => {
  const { token } = useAuth();
  const isAuthenticated = !!token

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

export default IsAuthenticated;
