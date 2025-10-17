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