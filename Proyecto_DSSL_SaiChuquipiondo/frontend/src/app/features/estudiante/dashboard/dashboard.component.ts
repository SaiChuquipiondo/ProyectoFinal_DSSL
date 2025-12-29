import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { EstudianteService } from '../../../services/estudiante.service';
import { AuthService } from '../../../services/auth.service';
import { WebsocketService } from '../../../services/websocket.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <img src="/logo-unu.png" alt="UNU Logo">
          </div>
          <h2>SGT - UNU</h2>
          <p class="subtitle">Sistema de Gestión de Tesis</p>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/estudiante/dashboard" class="nav-item active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>Dashboard</span>
          </a>

          <a routerLink="/estudiante/proyectos" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>Mis Proyectos</span>
          </a>

          <a routerLink="/estudiante/subir" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>Subir Proyecto</span>
          </a>

          <a routerLink="/estudiante/borradores" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
              <polyline points="13 2 13 9 20 9"/>
            </svg>
            <span>Borradores</span>
          </a>

          <a routerLink="/estudiante/notificaciones" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span>Notificaciones</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="user-details">
              <p class="user-name">{{ getUserFullName() }}</p>
              <p class="user-role">{{ getUserRole() }}</p>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="content-header">
          <div>
            <h1>Dashboard</h1>
            <p class="breadcrumb">Inicio / Dashboard</p>
          </div>
        </header>

        <div class="content-body">
          <!-- Stats Cards -->
          <div class="stats-grid">
            <div class="stat-card green">
              <div class="stat-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div class="stat-info">
                <h3>{{ proyectos.length }}</h3>
                <p>Proyectos Activos</p>
              </div>
            </div>

            <div class="stat-card blue">
              <div class="stat-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                  <polyline points="13 2 13 9 20 9"/>
                </svg>
              </div>
              <div class="stat-info">
                <h3>0</h3>
                <p>Borradores</p>
              </div>
            </div>

            <div class="stat-card orange">
              <div class="stat-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="stat-info">
                <h3>0</h3>
                <p>Pendientes</p>
              </div>
            </div>

            <div class="stat-card purple">
              <div class="stat-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 11 12 14 22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>
              <div class="stat-info">
                <h3>0</h3>
                <p>Completados</p>
              </div>
            </div>
          </div>

          <!-- Action Cards -->
          <div class="action-cards">
            <div class="action-card">
              <div class="action-icon green-bg">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div class="action-content">
                <h3>Mis Proyectos</h3>
                <p>Consulta el estado de tus proyectos de tesis</p>
                <button routerLink="/estudiante/proyectos" class="btn-action">
                  Ver Proyectos
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="action-card">
              <div class="action-icon blue-bg">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div class="action-content">
                <h3>Subir Proyecto</h3>
                <p>Sube un nuevo proyecto de tesis para revisión</p>
                <button routerLink="/estudiante/subir" class="btn-action">
                  Subir Ahora
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      height: 100vh;
      width: 100%;
      background: #f5f7fa;
    }

    /* ========== SIDEBAR ========== */
    .sidebar {
      width: 280px;
      background: linear-gradient(180deg, #047857 0%, #065f46 100%);
      color: white;
      display: flex;
      flex-direction: column;
      box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
      position: fixed;
      height: 100vh;
      left: 0;
      top: 0;
      z-index: 1000;
    }

    .sidebar-header {
      padding: 2rem 1.5rem;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo {
      width: 90px;
      height: 90px;
      margin: 0 auto 1rem;
      background: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .sidebar-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .subtitle {
      font-size: 0.75rem;
      opacity: 0.9;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1.5rem 0;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.5rem;
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      transition: all 0.3s;
      border-left: 3px solid transparent;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .nav-item.active {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      border-left-color: #34d399;
    }

    .sidebar-footer {
      padding: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-details {
      flex: 1;
    }

    .user-name {
      font-weight: 600;
      font-size: 0.875rem;
    }

    .user-role {
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .logout-btn {
      width: 100%;
      margin-top: 1rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.3s;
    }

    .logout-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.3);
    }

    /* ========== MAIN CONTENT ========== */
    .main-content {
      flex: 1;
      margin-left: 280px;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .content-header {
      background: white;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .content-header h1 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .breadcrumb {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .content-body {
      padding: 2rem;
      flex: 1;
    }

    /* ========== STATS GRID ========== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
      border-left: 4px solid;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .stat-card.green {
      border-left-color: #10b981;
    }

    .stat-card.blue {
      border-left-color: #3b82f6;
    }

    .stat-card.orange {
      border-left-color: #f59e0b;
    }

    .stat-card.purple {
      border-left-color: #8b5cf6;
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-card.green .stat-icon {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .stat-card.blue .stat-icon {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }

    .stat-card.orange .stat-icon {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .stat-card.purple .stat-icon {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
    }

    .stat-info h3 {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .stat-info p {
      color: #6b7280;
      font-size: 0.875rem;
    }

    /* ========== ACTION CARDS ========== */
    .action-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .action-card {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
      transition: all 0.3s;
    }

    .action-card:hover {
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
      transform: translateY(-4px);
    }

    .action-icon {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .green-bg {
      background: linear-gradient(135deg, #047857 0%, #065f46 100%);
    }

    .blue-bg {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }

    .action-content {
      flex: 1;
    }

    .action-content h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .action-content p {
      color: #6b7280;
      margin-bottom: 1.25rem;
      line-height: 1.5;
    }

    .btn-action {
      background: linear-gradient(135deg, #047857 0%, #065f46 100%);
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s;
      font-size: 0.875rem;
    }

    .btn-action:hover {
      background: linear-gradient(135deg, #065f46 0%, #047857 100%);
      transform: translateX(4px);
    }

    /* ========== RESPONSIVE ========== */
    @media (max-width: 1024px) {
      .sidebar {
        width: 240px;
      }

      .main-content {
        margin-left: 240px;
      }
    }

    @media (max-width: 768px) {
      .dashboard-container {
        flex-direction: column;
      }

      .sidebar {
        width: 100%;
        height: auto;
        position: relative;
      }

      .main-content {
        margin-left: 0;
      }

      .stats-grid,
      .action-cards {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  proyectos: any[] = [];
  currentUser: any;

  constructor(
    private estudianteService: EstudianteService,
    private authService: AuthService,
    private router: Router,
    private websocketService: WebsocketService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadData();
  }

  loadData(): void {
    this.estudianteService.getMisProyectos().subscribe({
      next: (proyectos) => this.proyectos = proyectos,
      error: (err) => console.error('Error loading proyectos', err)
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
