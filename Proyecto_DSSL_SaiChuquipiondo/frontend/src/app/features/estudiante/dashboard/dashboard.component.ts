import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { EstudianteService } from '../../../services/estudiante.service';
import { NotificacionService } from '../../../services/notificacion.service';
import { WebsocketService } from '../../../services/websocket.service';
import { ToastService } from '../../../services/toast.service';
import { EstudianteSidebarComponent } from '../components/estudiante-sidebar/estudiante-sidebar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, EstudianteSidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  proyectos: any[] = [];
  borradores: any[] = [];
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

  // Estadísticas
  pendientes = 0;
  completados = 0;

  loadData(): void {
    // Usamos forkJoin para esperar a que ambas peticiones terminen antes de calcular estadísticas
    // pero como no importé forkJoin, lo haré de forma encadenada o simple en el subscribe
    
    this.estudianteService.getMisProyectos().subscribe({
      next: (proyectos) => {
        this.proyectos = proyectos;
        this.calculateStats();
      },
      error: (err) => console.error('Error loading proyectos', err)
    });

    this.estudianteService.getMisBorradores().subscribe({
      next: (borradores) => {
        this.borradores = borradores;
        this.calculateStats();
      },
      error: (err) => console.error('Error loading borradores', err)
    });
  }

  calculateStats(): void {
    this.pendientes = 0;
    this.completados = 0;

    // Calcular Proyectos
    this.proyectos.forEach(p => {
      // Pendientes: Requieren acción del estudiante
      if (['OBSERVADO_FORMATO', 'OBSERVADO_ASESOR', 'OBSERVADO_JURADOS', 'PENDIENTE'].includes(p.estado_proyecto)) {
        this.pendientes++;
      }
      // Completados: Aprobados totalmente (Fase de proyecto terminada)
      if (['APROBADO_FINAL', 'APROBADO_JURADOS'].includes(p.estado_proyecto)) {
        this.completados++;
      }
    });

    // Calcular Borradores
    this.borradores.forEach(b => {
      // Pendientes
      if (['OBSERVADO', 'OBSERVADO_ASESOR', 'OBSERVADO_JURADOS', 'PENDIENTE'].includes(b.estado)) {
        this.pendientes++;
      }
      // Completados
      if (b.estado === 'APROBADO_FINAL') {
        this.completados++;
      }
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


}
