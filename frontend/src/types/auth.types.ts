export interface User {
  id: number;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  college?: string;
  branch?: string;
  semester?: number;
}

export interface AuthResponse {
  token: string;
  tokenType?: string;
  refreshToken?: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  college?: string;
  branch?: string;
  semester?: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string>;
}
