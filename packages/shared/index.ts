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
