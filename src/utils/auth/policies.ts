import type { UserRole } from '@models/User.model';

export type AppAction =
  | 'projects:manage'
  | 'certificates:manage'
  | 'blog:manage'
  | 'testimonials:manage'
  | 'contact:manage'
  | 'newsletter:manage'
  | 'newsletter:send'
  | 'uploads:manage'
  | 'admin:metrics'
  | 'labs:manage';

const ACTION_POLICIES: Record<AppAction, UserRole[]> = {
  'projects:manage': ['admin', 'editor'],
  'certificates:manage': ['admin', 'editor'],
  'blog:manage': ['admin', 'editor'],
  'testimonials:manage': ['admin', 'editor'],
  'contact:manage': ['admin', 'editor'],
  'newsletter:manage': ['admin'],
  'newsletter:send': ['admin'],
  'uploads:manage': ['admin', 'editor'],
  'admin:metrics': ['admin'],
  'labs:manage': ['admin', 'editor']
};

export const canPerformAction = (role: UserRole, action: AppAction): boolean => {
  const allowedRoles = ACTION_POLICIES[action];
  if (!allowedRoles) {
    return false;
  }
  return allowedRoles.includes(role);
};

export const getAllowedRoles = (action: AppAction): UserRole[] => ACTION_POLICIES[action] ?? [];
