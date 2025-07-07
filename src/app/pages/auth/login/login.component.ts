import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { MessagesModule } from 'primeng/messages';
import { CommonModule } from '@angular/common';
import { AuthService, LoginRequest } from '../../../core/services/auth.service';
// Importación corregida para Message
//import { Message } from 'primeng/api';

interface Message {
  severity?: string;
  summary?: string;
  detail?: string;
  id?: any;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    MessageModule,
    MessagesModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  messages: Message[] = [];
  returnUrl: string;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    // Obtener URL de retorno
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  ngOnInit(): void {
    // Limpiar mensajes al iniciar
    this.messages = [];
    
    // Si el usuario ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.messages = [];

      const loginData: LoginRequest = {
        username: this.loginForm.value.email, // El backend espera 'username'
        password: this.loginForm.value.password
      };

      this.authService.login(loginData).subscribe({
        next: (response) => {
          this.isLoading = false;
          
          // Mostrar mensaje de éxito
          this.messages = [
            { severity: 'success', summary: 'Éxito', detail: 'Sesión iniciada correctamente' }
          ];

          // Redirigir después de un breve delay
          setTimeout(() => {
            this.router.navigate([this.returnUrl]);
          }, 1000);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error en login:', error);
          
          // Mostrar mensaje de error
          let errorMessage = 'Error al iniciar sesión';
          
          if (error.error?.error) {
            errorMessage = error.error.error;
          } else if (error.status === 0) {
            errorMessage = 'Error de conexión con el servidor';
          } else if (error.status === 401) {
            errorMessage = 'Credenciales inválidas';
          } else if (error.status >= 500) {
            errorMessage = 'Error interno del servidor';
          }

          this.messages = [
            { severity: 'error', summary: 'Error', detail: errorMessage }
          ];
        }
      });
    } else {
      this.markFormGroupTouched();
      this.messages = [
        { severity: 'warn', summary: 'Atención', detail: 'Por favor complete todos los campos requeridos' }
      ];
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getters para acceder fácilmente a los controles
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get rememberMe() {
    return this.loginForm.get('rememberMe');
  }

  // Método para navegar al registro
  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  // Método para navegar a recuperar contraseña
  goToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }
}