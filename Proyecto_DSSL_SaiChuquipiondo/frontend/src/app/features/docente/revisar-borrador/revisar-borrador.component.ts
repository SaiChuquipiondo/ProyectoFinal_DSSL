import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { NotificacionService } from '../../../services/notificacion.service';
import { ToastService } from '../../../services/toast.service';

interface Borrador {
  id_borrador: number;
  numero_iteracion: number;
  estado: string;
  ruta_pdf: string;
  titulo: string;
  estudiante: string;
}

@Component({
  selector: 'app-revisar-borrador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './revisar-borrador.component.html',
  styleUrls: ['./revisar-borrador.component.css']
})
export class RevisarBorradorComponent implements OnInit, OnDestroy {
  borrador: Borrador | null = null;
  loading = true;
  submitting = false;
  
  // Properties maintained for template compatibility, though simplified
  error = '';
  noLeidasCount: number = 0;
  
  estadoRevision: 'APROBADO' | 'OBSERVADO' | '' = '';
  comentarios = '';

  // Notificaciones
  notificaciones: any[] = [];
  showNotifications: boolean = false;
  cargandoNotificaciones: boolean = false;
  private noLeidasSubscription?: Subscription;
  expandedNotifications: Set<number> = new Set();
  
  private apiUrl = 'http://localhost:3000/api';
  
  esJurado = false; // Propiedad para modo jurado

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private notificacionService: NotificacionService,
    private toastService: ToastService
  ) {}
  
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    // Detectar modo jurado desde query params
    this.route.queryParams.subscribe(params => {
      this.esJurado = params['mode'] === 'jurado';
      if (id) {
        this.cargarBorrador(+id);
      }
    });

    this.initNotifications();
  }

  ngOnDestroy(): void {
    if (this.noLeidasSubscription) {
      this.noLeidasSubscription.unsubscribe();
    }
  }

  initNotifications(): void {
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
  
  cargarBorrador(id: number): void {
    this.loading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    // Seleccionar endpoint segun modo
    const endpoint = this.esJurado 
      ? `${this.apiUrl}/jurados/borrador/pendientes`
      : `${this.apiUrl}/asesor/borrador/pendientes`;

    this.http.get<any[]>(endpoint, { headers })
      .subscribe({
        next: (borradores) => {
          const borrador = borradores.find(b => b.id_borrador === id);
          if (borrador) {
            this.borrador = borrador;
          } else {
            this.error = 'Borrador no encontrado o no tienes acceso';
            this.toastService.error(this.error);
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar borrador:', err);
          this.error = 'Error al cargar el borrador';
          this.toastService.error(this.error);
          this.loading = false;
        }
      });
  }
  
  verPDF(): void {
    if (this.borrador?.ruta_pdf) {
      const pdfUrl = `http://localhost:3000/uploads/borradores/${this.borrador.ruta_pdf}`;
      window.open(pdfUrl, '_blank');
    }
  }

  // ==================== NAVBAR HELPERS ====================
  getUserFullName(): string {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return `${user.nombres || ''} ${user.apellido_paterno || ''}`.trim() || 'Docente';
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
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
  
  enviarRevision(): void {
    if (!this.estadoRevision) {
      this.toastService.warning('Debe seleccionar si aprueba u observa el borrador');
      return;
    }
    
    if (this.estadoRevision === 'OBSERVADO' && !this.comentarios.trim()) {
      this.toastService.warning('Debe proporcionar comentarios al observar el borrador');
      return;
    }
    
    this.submitting = true;
    this.error = '';
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    const body = {
      estado_revision: this.estadoRevision,
      comentarios: this.comentarios
    };
    
    const endpoint = this.esJurado
      ? `${this.apiUrl}/jurados/borrador/revisar/${this.borrador?.id_borrador}`
      : `${this.apiUrl}/asesor/borrador/revisar/${this.borrador?.id_borrador}`;
    
    this.http.post(
      endpoint,
      body,
      { headers }
    ).subscribe({
      next: () => {
        const msg = `Borrador ${this.estadoRevision === 'APROBADO' ? 'aprobado' : 'observado'} correctamente`;
        this.toastService.success(msg);
        setTimeout(() => {
          this.router.navigate(['/docente/dashboard']);
        }, 2000);
      },
      error: (err) => {
        console.error('Error al enviar revisión:', err);
        const errorMsg = err.error?.message || 'Error al enviar la revisión';
        this.toastService.error(errorMsg);
        this.submitting = false;
      }
    });
  }
}
