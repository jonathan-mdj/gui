import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener token del servicio de autenticación
    const token = this.authService.getToken();
    
    // Clonar la request y añadir el token si existe
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Continuar con la request y manejar errores
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en interceptor:', error);
        
        // Si es error 401 (No autorizado), cerrar sesión
        if (error.status === 401) {
          console.log('Token expirado o inválido, cerrando sesión...');
          this.authService.logout();
          // No necesitas navegar aquí porque logout() ya lo hace
        }
        
        // Si es error 403 (Forbidden), mostrar mensaje
        if (error.status === 403) {
          console.log('Acceso denegado - Permisos insuficientes');
          // Aquí puedes mostrar un mensaje toast o modal
        }
        
        // Si es error de conexión (0 o 500), mostrar mensaje
        if (error.status === 0 || error.status >= 500) {
          console.log('Error de conexión con el servidor');
          // Aquí puedes mostrar un mensaje de error de conexión
        }
        
        return throwError(() => error);
      })
    );
  }
}