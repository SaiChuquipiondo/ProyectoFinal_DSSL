import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NotificacionService } from '../../../services/notificacion.service';
import { Subscription } from 'rxjs';

interface ProyectoUnificado {
  id_proyecto: number;
  titulo: string;
  resumen: string;
  ruta_pdf: string;
  iteracion?: number;
  estado_proyecto?: string;
  nombre_estudiante: string;
  codigo_estudiante?: string;
  rol_jurado?: string;
  tipo: 'ASESOR' | 'JURADO';
}

@Component({
  selector: 'app-docente-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DocenteDashboardComponent implements OnInit, OnDestroy {
  // Lista unificada de todos los proyectos
  todosProyectos: ProyectoUnificado[] = [];
  
  loading = true;
  error = '';

  // Notificaciones
  notificaciones: any[] = [];
  noLeidasCount: number = 0;
  showNotifications: boolean = false;
  cargandoNotificaciones: boolean = false;
  private noLeidasSubscription?: Subscription;
  expandedNotifications: Set<number> = new Set();

  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private notificacionService: NotificacionService
  ) {}

  ngOnInit(): void {
    this.cargarTodosProyectos();
    this.cargarNotificaciones();
    
    // Suscribirse al contador de no leídas
    this.noLeidasSubscription = this.notificacionService.noLeidas$.subscribe(
      count => this.noLeidasCount = count
    );

    // Cargar contador inicial
    this.notificacionService.contarNoLeidas().subscribe({
      next: res => this.noLeidasCount = res.no_leidas,
      error: err => console.error('Error al cargar contador de notificaciones', err)
    });
  }

  ngOnDestroy(): void {
    if (this.noLeidasSubscription) {
      this.noLeidasSubscription.unsubscribe();
    }
  }

  cargarTodosProyectos(): void {
    this.loading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Cargar proyectos como asesor y jurado en paralelo
    const asesor$ = this.http.get<any[]>(`${this.apiUrl}/asesor/pendientes`, { headers });
    const jurado$ = this.http.get<any[]>(`${this.apiUrl}/jurados/pendientes`, { headers });

    // Combinar ambos observables
    import('rxjs').then(rxjs => {
      rxjs.forkJoin({
        asesor: asesor$,
        jurado: jurado$
      }).subscribe({
        next: (data) => {
          // Mapear proyectos de asesor
          const proyectosAsesor: ProyectoUnificado[] = data.asesor.map(p => ({
            ...p,
            tipo: 'ASESOR' as const
          }));

          // Mapear proyectos de jurado
          const proyectosJurado: ProyectoUnificado[] = data.jurado.map(p => ({
            ...p,
            tipo: 'JURADO' as const
          }));

          // Combinar ambas listas
          this.todosProyectos = [...proyectosAsesor, ...proyectosJurado];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar proyectos:', err);
          this.error = 'Error al cargar los proyectos';
          this.loading = false;
        }
      });
    });
  }

  getEstadoBadge(estado: string): string {
    switch (estado) {
      case 'REVISADO_FORMATO':
        return 'badge-primary';
      case 'OBSERVADO_ASESOR':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  getProyectosAsesor(): number {
    return this.todosProyectos.filter(p => p.tipo === 'ASESOR').length;
  }

  getProyectosJurado(): number {
    return this.todosProyectos.filter(p => p.tipo === 'JURADO').length;
  }

  getTipoBadge(tipo: string): string {
    return tipo === 'ASESOR' ? 'Asesor' : 'Jurado';
  }

  getTipoIcon(tipo: string): string {
    return tipo === 'ASESOR' ? 'edit' : 'users';
  }

  getRolJuradoBadge(rol: string): string {
    const badges: any = {
      'PRESIDENTE': 'Presidente',
      'SECRETARIO': 'Secretario', 
      'VOCAL': 'Vocal'
    };
    return badges[rol] || rol;
  }

  // ==================== NOTIFICACIONES ====================
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.cargarNotificaciones();
    }
  }

  cargarNotificaciones(): void {
    this.cargandoNotificaciones = true;
    this.notificacionService.getNotificaciones(false, 20).subscribe({
      next: res => {
        this.notificaciones = res.notificaciones || [];
        this.cargandoNotificaciones = false;
      },
      error: err => {
        console.error('Error al cargar notificaciones', err);
        this.cargandoNotificaciones = false;
      }
    });
  }

  toggleExpand(idNotificacion: number): void {
    if (this.expandedNotifications.has(idNotificacion)) {
      this.expandedNotifications.delete(idNotificacion);
    } else {
      this.expandedNotifications.add(idNotificacion);
    }

    const notif = this.notificaciones.find(n => n.id_notificacion === idNotificacion);
    if (notif && !notif.leida) {
      this.notificacionService.marcarComoLeida(idNotificacion).subscribe({
        next: () => {
          notif.leida = true;
          this.notificacionService.contarNoLeidas().subscribe(
            res => this.notificacionService.updateNoLeidasCount(res.no_leidas)
          );
        },
        error: err => console.error('Error al marcar como leida', err)
      });
    }
  }

  isExpanded(idNotificacion: number): boolean {
    return this.expandedNotifications.has(idNotificacion);
  }

  marcarTodasLeidas(): void {
    this.notificacionService.marcarTodasLeidas().subscribe({
      next: () => {
        this.notificaciones.forEach(n => n.leida = true);
        this.notificacionService.updateNoLeidasCount(0);
      },
      error: err => console.error('Error al marcar todas como leidas', err)
    });
  }

  getTimeAgo(fecha: string): string {
    const now = new Date();
    const then = new Date(fecha);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'Hace unos segundos';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min${minutes > 1 ? 's' : ''}`;
    const hours = Math.floor(seconds / 3600);
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    const days = Math.floor(seconds / 86400);
    if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
    const months = Math.floor(days / 30);
    return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
  }

  verPDF(rutaPdf: string): void {
    window.open(`http://localhost:3000/uploads/proyectos/${rutaPdf}`, '_blank');
  }

  getUserFullName(): string {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return `${user.nombres || ''} ${user.apellido_paterno || ''}`.trim() || 'Docente';
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}
