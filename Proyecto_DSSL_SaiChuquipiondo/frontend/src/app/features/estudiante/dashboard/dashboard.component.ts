import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { EstudianteService } from '../../../services/estudiante.service';
import { NotificacionService } from '../../../services/notificacion.service';
import { WebsocketService } from '../../../services/websocket.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  proyectos: any[] = [];
  currentUser: any;
  
  // Notificaciones
  notificaciones: any[] = [];
  notificacionesNoLeidas = 0;
  showNotificaciones = false;

  constructor(
    private estudianteService: EstudianteService,
    private authService: AuthService,
    private router: Router,
    private websocketService: WebsocketService,
    private toastService: ToastService,
    private notificacionService: NotificacionService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadData();
    this.loadNotificaciones();
    
    // Cerrar panel al hacer clic fuera
    document.addEventListener('click', () => {
      if (this.showNotificaciones) {
        this.showNotificaciones = false;
      }
    });
  }

  loadData(): void {
    this.estudianteService.getMisProyectos().subscribe({
      next: (proyectos) => this.proyectos = proyectos,
      error: (err) => console.error('Error loading proyectos', err)
    });
  }

  loadNotificaciones(): void {
    this.notificacionService.getNotificaciones(false, 20).subscribe({
      next: (data) => this.notificaciones = data.notificaciones || data,
      error: (err: any) => console.error('Error loading notificaciones', err)
    });

    this.notificacionService.contarNoLeidas().subscribe({
      next: (data) => this.notificacionesNoLeidas = data.no_leidas,
      error: (err: any) => console.error('Error counting notificaciones', err)
    });
  }

  toggleNotificaciones(): void {
    this.showNotificaciones = !this.showNotificaciones;
    console.log('Toggle notificaciones:', this.showNotificaciones);
    console.log('Notificaciones:', this.notificaciones);
    console.log('No leídas:', this.notificacionesNoLeidas);
  }

  marcarLeida(id: number): void {
    this.notificacionService.marcarComoLeida(id).subscribe({
      next: () => {
        const notif = this.notificaciones.find(n => n.id_notificacion === id);
        if (notif && !notif.leido) {
          notif.leido = true;
          this.notificacionesNoLeidas = Math.max(0, this.notificacionesNoLeidas - 1);
        }
      },
      error: (err: any) => console.error('Error marking as read', err)
    });
  }

  marcarTodasLeidas(): void {
    this.notificacionService.marcarTodasLeidas().subscribe({
      next: () => {
        this.notificaciones.forEach(n => n.leido = true);
        this.notificacionesNoLeidas = 0;
      },
      error: (err: any) => console.error('Error marking all as read', err)
    });
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
    if (rol === 'ASESOR' || rol === 'JURADO') return 'Docente';
    if (rol === 'COORDINACION') return 'Coordinador';
    return rol;
  }

  logout(): void {
    this.toastService.info('Sesión cerrada correctamente', 3000);
    this.authService.logout();
    this.websocketService.disconnect();
    this.router.navigate(['/login']);
  }
}
