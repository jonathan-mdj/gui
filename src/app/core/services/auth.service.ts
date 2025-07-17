//auth.services.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  message: string;
  user: {
    id: number;
    username: string;
    role_id: number;
  };
}

export interface RegisterResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:4000/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';
  
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Observable para el estado de autenticación
  public isAuthenticated$ = this.currentUserSubject.pipe(
    map(user => {
      if (!user) return false;
      const token = this.getToken();
      return !!token && !this.isTokenExpired(token);
    })
  );

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {
    // Cargar datos del usuario desde localStorage al inicializar
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userData = localStorage.getItem(this.USER_KEY);
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.clearStorage();
      }
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials, { headers })
      .pipe(
        tap(response => {
          // Guardar token y datos del usuario
          localStorage.setItem(this.TOKEN_KEY, response.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
          
          // Actualizar el subject
          this.currentUserSubject.next(response.user);
          
          console.log('Login successful:', response);
        })
      );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<RegisterResponse>(`${this.API_URL}/register`, userData, { headers })
      .pipe(
        tap(response => {
          console.log('Registration successful:', response);
        })
      );
  }

  logout(): void {
    this.clearStorage();
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  // Método para verificar si el usuario es admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    // Asumiendo que role_id = 1 es admin (ajusta según tu lógica)
    return user && user.role_id === 1;
  }

  // Observable para verificar si es admin
  public isAdmin$ = this.currentUser$.pipe(
    map(user => user && user.role_id === 1)
  );

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): any {
    const userData = localStorage.getItem(this.USER_KEY);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
  }

  // Método para refrescar el token (opcional)
  refreshToken(): Observable<any> {
    // Implementar si necesitas refresh token
    return new Observable();
  }

  // Método para obtener información del usuario actual
  getUserInfo(): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get(`${this.API_URL}/user`, { headers });
  }
}