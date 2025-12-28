import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoordinacionService } from '../../../services/coordinacion.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h1>Dashboard Coordinación</h1>
      <p class="subtitle">Panel administrativo del sistema</p>
      
      <div class="stats">
        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-value">{{ proyectosPendientes.length }}</div>
          <div class="stat-label">Proyectos Pendientes</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-value">{{ borradoresPendientes.length }}</div>
          <div class="stat-label">Borradores Pendientes</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🎓</div>
          <div class="stat-value">{{ sustentacionesProgramadas.length }}</div>
          <div class="stat-label">Sustentaciones Programadas</div>
        </div>
      </div>

      <div class="sections">
        <div class="section">
          <h2>Proyectos Pendientes de Validación</h2>
          @if (proyectosPendientes.length === 0) {
            <p class="empty">No hay proyectos pendientes</p>
          }
          @for (proyecto of proyectosPendientes; track proyecto.id_proyecto) {
            <div class="item-card">
              <h3>{{ proyecto.titulo }}</h3>
              <p><strong>Estudiante:</strong> {{ proyecto.nombre_estudiante }}</p>
              <p><strong>Estado:</strong> {{ proyecto.estado_proyecto }}</p>
              <div class="actions">
                <button class="btn-primary">Validar</button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    h1 {
      color: #333;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #666;
      margin-bottom: 2rem;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .stat-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .section {
      margin-bottom: 2rem;
    }

    .section h2 {
      color: #667eea;
      margin-bottom: 1rem;
    }

    .item-card {
      background: white;
      padding: 1.5rem;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 1rem;
    }

    .item-card h3 {
      color: #333;
      margin-bottom: 0.5rem;
    }

    .item-card p {
      color: #666;
      margin: 0.25rem 0;
    }

    .actions {
      margin-top: 1rem;
    }

    .btn-primary {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 5px;
      cursor: pointer;
    }

    .empty {
      color: #999;
      text-align: center;
      padding: 2rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  proyectosPendientes: any[] = [];
  borradoresPendientes: any[] = [];
  sustentacionesProgramadas: any[] = [];

  constructor(private coordinacionService: CoordinacionService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.coordinacionService.getProyectosPendientes().subscribe({
      next: (proyectos) => this.proyectosPendientes = proyectos,
      error: (err) => console.error('Error loading proyectos', err)
    });
    
    this.coordinacionService.getBorradoresPendientes().subscribe({
      next: (borradores) => this.borradoresPendientes = borradores,
      error: (err) => console.error('Error loading borradores', err)
    });
    
    this.coordinacionService.getSustentacionesProgramadas().subscribe({
      next: (sustentaciones) => this.sustentacionesProgramadas = sustentaciones,
      error: (err) => console.error('Error loading sustentaciones', err)
    });
  }
}
