export interface User {
  id_usuario: number;
  id_persona: number;
  rol: 'ESTUDIANTE' | 'ASESOR' | 'JURADO' | 'COORDINACION';
  id_estudiante?: number;
  id_docente?: number;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}
