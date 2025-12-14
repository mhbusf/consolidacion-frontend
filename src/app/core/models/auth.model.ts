export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface JwtResponse {
  token: string;
  username: string;
  email: string; // ← AGREGADO: El backend sí envía el email
  roles: Role[];
}

export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  enabled: boolean;
  roles: Role[];
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// Helper enum para validar roles
export enum RoleName {
  ADMIN = 'ROLE_ADMIN',
  USER = 'ROLE_USER',
}
