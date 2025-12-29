import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificacionService } from '../../services/notificacion.service';
import { WebsocketService } from '../../services/websocket.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  user: any;
  noLeidas = 0;

  constructor(
    private authService: AuthService,
    private notificacionService: NotificacionService,
    private websocketService: WebsocketService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    
    this.notificacionService.noLeidas$.subscribe(
      count => this.noLeidas = count
    );

    this.notificacionService.contarNoLeidas().subscribe(
      res => this.notificacionService.updateNoLeidasCount(res.no_leidas)
    );
  }

  logout(): void {
    this.toastService.info('Sesión cerrada correctamente', 3000);
    this.authService.logout();
    this.websocketService.disconnect();
    this.router.navigate(['/login']);
  }
}
