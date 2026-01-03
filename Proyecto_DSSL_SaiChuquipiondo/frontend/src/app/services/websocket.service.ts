import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { NotificacionService } from './notificacion.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket | null = null;

  constructor(
    private authService: AuthService,
    private notificacionService: NotificacionService
  ) {}

  connect(): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.socket = io(environment.wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connected', (data) => {

    });

    this.socket.on('nueva_notificacion', (notificacion) => {

      // Emitir notificación
      this.showNotification(notificacion);
      // Actualizar contador
      this.notificacionService.contarNoLeidas().subscribe(
        res => this.notificacionService.updateNoLeidasCount(res.no_leidas)
      );
    });

    this.socket.on('actualizar_contador', (data) => {
      this.notificacionService.updateNoLeidasCount(data.no_leidas);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión WebSocket:', error.message);
    });

    this.socket.on('disconnect', () => {
      console.warn('⚠️ WebSocket desconectado');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private showNotification(notificacion: any): void {
    // Mostrar notificación del navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notificacion.titulo, {
        body: notificacion.mensaje,
        icon: '/favicon.ico'
      });
    }
  }

  requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}
