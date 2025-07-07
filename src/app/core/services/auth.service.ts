import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  message: string;
  user: {
    id: number;
    username: string;
    role_id: number;
  };
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
}

export interface ApiResponse {
  message: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:5001'; // Puerto del auth_service
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private readonly currentUserSubject = new BehaviorSubject<any>(null);
  public readonly currentUser$ = this.currentUserSubject.asObservable();

  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {
    this.checkAuthStatus();
  }

  /**
   * Verifica si el usuario está autenticado al inicializar el servicio
   */
  private checkAuthStatus(): void {
    const token = this.getToken();
    const user = this.getUser();
    
    if (token && user) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  /**
   * Realizar login del usuario
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials, { headers })
      .pipe(
        map(response => {
          if (response.token) {
            // Guardar token y usuario en localStorage
            this.setToken(response.token);
            this.setUser(response.user);
            
            // Actualizar subjects
            this.currentUserSubject.next(response.user);
            this.isAuthenticatedSubject.next(true);
          }
          return response;
        }),
        catchError(error => {
          console.error('Error en login:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Registrar nuevo usuario
   */
  register(userData: RegisterRequest): Observable<ApiResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<ApiResponse>(`${this.API_URL}/register`, userData, { headers })
      .pipe(
        catchError(error => {
          console.error('Error en registro:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Cerrar sesión del usuario
   */
  logout(): void {
    // Limpiar localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    // Actualizar subjects
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    // Redirigir al login
    this.router.navigate(['/auth/login']);
  }

  /**
   * Obtener token del localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Guardar token en localStorage
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Obtener usuario del localStorage
   */
  getUser(): any {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Guardar usuario en localStorage
   */
  private setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  /**
   * Obtener headers con autorización
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(roleId: number): boolean {
    const user = this.getCurrentUser();
    return user && user.role_id === roleId;
  }

  /**
   * Verificar si el usuario es admin
   */
  isAdmin(): boolean {
    return this.hasRole(1); // 1 = admin según tu backend
  }

  /**
   * Verificar si el usuario es manager
   */
  isManager(): boolean {
    return this.hasRole(3); // 3 = manager según tu backend
  }

  /**
   * Verificar si el usuario es user normal
   */
  isUser(): boolean {
    return this.hasRole(2); // 2 = user según tu backend
  }

  /**
   * Método para validar si el token es válido (opcional)
   */
  validateToken(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token found'));
    }

    return this.http.get(`${this.API_URL}/validate-token`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Token validation failed:', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }
}