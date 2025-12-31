import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';
import { WebsocketService } from '../../../../services/websocket.service';

@Component({
  selector: 'app-estudiante-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './estudiante-sidebar.component.html',
  styleUrls: ['./estudiante-sidebar.component.css']
})
export class EstudianteSidebarComponent implements OnInit {
  currentUser: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private websocketService: WebsocketService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  getUserFullName(): string {
    if (!this.currentUser) return 'Usuario';
    const nombres = this.currentUser.nombres || '';
    const apellido = this.currentUser.apellido_paterno || '';
    return `${nombres} ${apellido}`.trim() || 'Usuario';
  }

  getUserRole(): string {
    if (!this.currentUser) return '';
    const rol = this.currentUser.rol;
    if (rol === 'ESTUDIANTE') return 'Estudiante';
    return rol;
  }

  logout(): void {
    this.toastService.info('Sesión cerrada correctamente', 3000);
    this.authService.logout();
    this.websocketService.disconnect();
    this.router.navigate(['/login']);
  }
}
