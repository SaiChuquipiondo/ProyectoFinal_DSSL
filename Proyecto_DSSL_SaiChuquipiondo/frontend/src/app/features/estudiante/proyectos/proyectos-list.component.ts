import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { EstudianteService } from '../../../services/estudiante.service';
import { AuthService } from '../../../services/auth.service';
import { WebsocketService } from '../../../services/websocket.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-proyectos-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './proyectos-list.component.html',
  styleUrl: './proyectos-list.component.css'
})
export class ProyectosListComponent implements OnInit {
  proyectos: any[] = [];
  currentUser: any;
  loading = true;

  constructor(
    private estudianteService: EstudianteService,
    private authService: AuthService,
    private router: Router,
    private websocketService: WebsocketService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadProyectos();
  }

  loadProyectos(): void {
    this.loading = true;
    this.estudianteService.getMisProyectos().subscribe({
      next: (data) => {
        this.proyectos = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading proyectos', err);
        this.toastService.error('Error al cargar proyectos', 3000);
        this.loading = false;
      }
    });
  }

  getEstadoClase(estado: string): string {
    const estadoMap: any = {
      'PENDIENTE': 'badge-warning',
      'OBSERVADO_FORMATO': 'badge-error',
      'REVISADO_FORMATO': 'badge-info',
      'APROBADO_ASESOR': 'badge-success',
      'ASIGNADO_JURADOS': 'badge-info',
      'OBSERVADO_JURADOS': 'badge-error',
      'APROBADO_JURADOS': 'badge-success',
      'APROBADO_FINAL': 'badge-success'
    };
    return estadoMap[estado] || 'badge-default';
  }

  getEstadoAsesorClase(estado: string): string {
    const estadoMap: any = {
      'SIN_ASESOR': 'badge-default',
      'PROPUESTO': 'badge-warning',
      'APROBADO': 'badge-success',
      'RECHAZADO': 'badge-error'
    };
    return estadoMap[estado] || 'badge-default';
  }

  verPDF(rutaPdf: string): void {
    window.open(`http://localhost:3000/uploads/proyectos/${rutaPdf}`, '_blank');
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
