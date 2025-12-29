import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { WebsocketService } from '../../services/websocket.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  error = '';
  isLoading = false; // Changed from 'loading' to 'isLoading'

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private websocketService: WebsocketService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Si el usuario ya está autenticado, redirigir a su dashboard
    if (this.authService.isLoggedIn()) {
      const user = this.authService.getCurrentUser();
      this.redirectToDashboard(user?.rol);
    }
  }

  redirectToDashboard(rol: string | undefined): void {
    if (rol === 'ESTUDIANTE') {
      this.router.navigate(['/estudiante/dashboard']);
    } else if (rol === 'ASESOR' || rol === 'JURADO') {
      this.router.navigate(['/docente']);
    } else if (rol === 'COORDINACION') {
      this.router.navigate(['/coordinacion']);
    } else {
      // Si no tiene rol válido, hacer logout
      this.authService.logout();
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.error = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.error = '';
        this.toastService.success('¡Sesión iniciada correctamente!', 3000);
        
        // Conectar WebSocket
        this.websocketService.connect();
        
        // Redirigir según el rol
        this.redirectToDashboard(response.user.rol);
      },
      error: (err) => {
        this.isLoading = false;
        
        // Verificar si es error de rate limiting (429)
        if (err.status === 429) {
          const message = err.error?.message || 'Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en 15 minutos.';
          this.error = message;
          this.toastService.warning(message, 5000);
        } 
        // Para cualquier otro error (validación, credenciales incorrectas, etc.)
        else {
          const message = 'Usuario o contraseña incorrectos';
          this.error = message;
          this.toastService.error(message, 4000);
        }
      }
    });
  }
}
