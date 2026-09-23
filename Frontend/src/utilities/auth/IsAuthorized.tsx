import type { JSX } from 'react/jsx-runtime';
import { useAuth } from '../../context/AuthProvider';
import Fallback from '../../pages/auth/Fallback';
import type { ReactNode } from 'react';

const IsAuthorized = ({
  roles,
  permissions,
  fallback=<Fallback />,
  children
}: {roles?: string[], permissions?: string[], fallback?: JSX.Element, children: ReactNode}) => {
  const { session } = useAuth();
  const userRoles = session?.roles;
  const userPermissions = session?.permissions;
  const normalizedUserRoles = new Set(
    userRoles?.map((role) => role.trim().toUpperCase().replace(/[\s-]+/g, '_')),
  );
  const hasRole = roles?.some((role) =>
    normalizedUserRoles.has(role.trim().toUpperCase().replace(/[\s-]+/g, '_')),
  ) ?? false;
  const hasPermission = permissions?.some((permission) => userPermissions?.includes(permission)) ?? false;
  const isAuthorized = hasRole || hasPermission;

  if (isAuthorized) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

export default IsAuthorized;