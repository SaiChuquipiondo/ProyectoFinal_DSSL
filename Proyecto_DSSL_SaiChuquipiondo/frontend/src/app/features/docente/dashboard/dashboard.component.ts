import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocenteService } from '../../../services/docente.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h1>Dashboard Docente</h1>
      
      <div class="tabs">
        <button (click)="activeTab = 'asesor'" 
                [class.active]="activeTab === 'asesor'"
                class="tab-btn">
          Como Asesor ({{ proyectosAsesor.length }})
        </button>
        <button (click)="activeTab = 'jurado'" 
                [class.active]="activeTab === 'jurado'"
                class="tab-btn">
          Como Jurado ({{ proyectosJurado.length }})
        </button>
      </div>

      @if (activeTab === 'asesor') {
        <div class="proyectos-list">
          <h2>Proyectos como Asesor</h2>
          @if (proyectosAsesor.length === 0) {
            <p class="empty">No hay proyectos pendientes</p>
          }
          @for (proyecto of proyectosAsesor; track proyecto.id_proyecto) {
            <div class="proyecto-card">
              <h3>{{ proyecto.titulo }}</h3>
              <p><strong>Estado:</strong> {{ proyecto.estado_proyecto }}</p>
              <button class="btn-primary">Revisar</button>
            </div>
          }
        </div>
      }

      @if (activeTab === 'jurado') {
        <div class="proyectos-list">
          <h2>Proyectos como Jurado</h2>
          @if (proyectosJurado.length === 0) {
            <p class="empty">No hay proyectos pendientes</p>
          }
          @for (proyecto of proyectosJurado; track proyecto.id_proyecto) {
            <div class="proyecto-card">
              <h3>{{ proyecto.titulo }}</h3>
              <p><strong>Rol:</strong> {{ proyecto.rol_jurado }}</p>
              <button class="btn-primary">Revisar</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      color: #333;
      margin-bottom: 2rem;
    }

    h2 {
      color: #667eea;
      margin-bottom: 1rem;
    }

    .tabs {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .tab-btn {
      padding: 0.75rem 1.5rem;
      border: 2px solid #667eea;
      background: white;
      color: #667eea;
      border-radius: 5px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.3s;
    }

    .tab-btn.active {
      background: #667eea;
      color: white;
    }

    .proyectos-list {
      display: grid;
      gap: 1rem;
    }

    .proyecto-card {
      background: white;
      padding: 1.5rem;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .proyecto-card h3 {
      color: #333;
      margin-bottom: 0.5rem;
    }

    .proyecto-card p {
      color: #666;
      margin: 0.25rem 0;
    }

    .btn-primary {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 1rem;
    }

    .empty {
      color: #999;
      text-align: center;
      padding: 2rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  activeTab: 'asesor' | 'jurado' = 'asesor';
  proyectosAsesor: any[] = [];
  proyectosJurado: any[] = [];

  constructor(private docenteService: DocenteService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.docenteService.getProyectosPendientesAsesor().subscribe({
      next: (proyectos) => this.proyectosAsesor = proyectos,
      error: (err) => console.error('Error loading proyectos asesor', err)
    });
    
    this.docenteService.getProyectosPendientesJurado().subscribe({
      next: (proyectos) => this.proyectosJurado = proyectos,
      error: (err) => console.error('Error loading proyectos jurado', err)
    });
  }
}
