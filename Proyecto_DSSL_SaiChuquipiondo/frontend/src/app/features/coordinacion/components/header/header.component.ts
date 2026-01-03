import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { NotificacionService } from '../../../../services/notificacion.service';
import { ToastService } from '../../../../services/toast.service';
import { WebsocketService } from '../../../../services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: any;
  
  // Notificaciones
  notificaciones: any[] = [];
  noLeidasCount: number = 0;
  showNotifications: boolean = false;
  cargandoNotificaciones: boolean = false;
  private noLeidasSubscription?: Subscription;
  expandedNotifications: Set<number> = new Set();
  
  constructor(
    private authService: AuthService,
    private notificacionService: NotificacionService,
    private toastService: ToastService,
    private websocketService: WebsocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.cargarNotificaciones(); // Carga inicial
    
    // Suscribirse al contador
    this.noLeidasSubscription = this.notificacionService.noLeidas$.subscribe(
      count => this.noLeidasCount = count
    );

    // Inicializar contador
    this.notificacionService.contarNoLeidas().subscribe({
      next: res => this.noLeidasCount = res.no_leidas
    });
  }

  ngOnDestroy(): void {
    if (this.noLeidasSubscription) {
      this.noLeidasSubscription.unsubscribe();
    }
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
        console.error('Error cargando notificaciones', err);
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
        }
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
        this.toastService.success('Notificaciones marcadas como leídas', 3000);
      }
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
    return new Date(fecha).toLocaleDateString();
  }

  // ==================== USER INFO ====================
  getUserFullName(): string {
    if (!this.currentUser) return 'Usuario';
    return `${this.currentUser.nombres} ${this.currentUser.apellido_paterno}`.trim();
  }

  getUserRole(): string {
    if (!this.currentUser) return '';
    return this.currentUser.rol === 'COORDINACION' ? 'Coordinación Académica' : this.currentUser.rol;
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    const n = this.currentUser.nombres?.charAt(0) || '';
    const a = this.currentUser.apellido_paterno?.charAt(0) || '';
    return (n + a).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.websocketService.disconnect();
    this.router.navigate(['/login']);
  }
}
