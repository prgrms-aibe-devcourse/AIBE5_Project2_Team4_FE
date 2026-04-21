export type UserRole = 'ROLE_USER' | 'ROLE_FREELANCER' | 'ROLE_ADMIN';

export interface User {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  roleCode: UserRole;
  active: boolean;
  phone?: string;
  intro?: string;
  bio?: string;
  avatar?: string;
  verified?: boolean;
}

interface UserShape {
  userId?: number | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  roleCode?: string | null;
  active?: boolean | null;
  activeYn?: boolean | null;
  phone?: string | null;
  intro?: string | null;
}

function resolveRole(input: UserShape): UserRole {
  const candidate = input.roleCode ?? input.role;
  if (candidate === 'ROLE_FREELANCER' || candidate === 'ROLE_ADMIN') {
    return candidate;
  }

  return 'ROLE_USER';
}

export function normalizeUser(input: UserShape): User {
  const role = resolveRole(input);
  const intro = input.intro?.trim() || undefined;

  return {
    userId: Number(input.userId ?? 0),
    name: input.name?.trim() || '',
    email: input.email?.trim() || '',
    role,
    roleCode: role,
    active: input.active ?? input.activeYn ?? true,
    phone: input.phone?.trim() || undefined,
    intro,
    bio: intro,
  };
}
