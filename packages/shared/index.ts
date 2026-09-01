export interface MessageType {
  _id?: string;
  text: string;
  createdAt?: string;
}

export interface RegisterRequest {
  name: string;
  surname: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
}

export interface RegisterErrorResponse {
  error: string;
}

export interface UserResponse {
  id: string;
  name: string;
  surname: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserResponse;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface AuthErrorResponse {
  error: string;
}
