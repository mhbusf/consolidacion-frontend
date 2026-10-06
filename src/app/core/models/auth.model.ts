export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  roleNames: RoleName[];
}

export interface JwtResponse {
  token: string;
  username: string;
  email: string; // ← AGREGADO: El backend sí envía el email
  roles: Role[];
  mustChangePassword: boolean;
}

export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  nombre?: string | null;
  apellido?: string | null;
  enabled: boolean;
  roles: Role[];
  mustChangePassword?: boolean;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// Helper enum para validar roles
export enum RoleName {
  SUPER_ADMIN = 'ROLE_SUPER_ADMIN',
  ADMIN = 'ROLE_ADMIN',
  USER = 'ROLE_USER',
  MENTOR = 'ROLE_MENTOR',
}

export const ROLE_OPTIONS: ReadonlyArray<{ name: RoleName; label: string }> = [
  { name: RoleName.USER, label: 'Usuario' },
  { name: RoleName.ADMIN, label: 'Administrador' },
  { name: RoleName.MENTOR, label: 'Mentor' },
  { name: RoleName.SUPER_ADMIN, label: 'Superadministrador' },
];

export function normalizeRoleNames(roleNames: readonly RoleName[]): RoleName[] {
  const roles = new Set(roleNames);
  if (roles.has(RoleName.SUPER_ADMIN)) {
    roles.add(RoleName.ADMIN);
    roles.add(RoleName.USER);
  }
  if (roles.has(RoleName.ADMIN)) roles.add(RoleName.USER);
  return ROLE_OPTIONS.map(option => option.name).filter(role => roles.has(role));
}

export function toggleRoleName(roleNames: readonly RoleName[], roleName: RoleName, checked: boolean): RoleName[] {
  const roles = new Set(roleNames);
  if (checked) {
    roles.add(roleName);
  } else {
    roles.delete(roleName);
    if (roleName === RoleName.USER) {
      roles.delete(RoleName.ADMIN);
      roles.delete(RoleName.SUPER_ADMIN);
    } else if (roleName === RoleName.ADMIN) {
      roles.delete(RoleName.SUPER_ADMIN);
    }
  }
  return normalizeRoleNames([...roles]);
}
