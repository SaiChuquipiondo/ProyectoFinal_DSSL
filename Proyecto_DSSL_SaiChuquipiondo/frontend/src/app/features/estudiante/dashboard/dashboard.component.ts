import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EstudianteService } from '../../../services/estudiante.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <h1>Dashboard Estudiante</h1>
      <p class="welcome">Bienvenido al sistema de gestión de tesis</p>
      
      <div class="cards">
        <div class="card">
          <div class="card-icon">📄</div>
          <h3>Mis Proyectos</h3>
          <p class="card-count">{{ proyectos.length }} proyecto(s)</p>
          <button routerLink="/estudiante/proyectos" class="btn-primary">Ver proyectos</button>
        </div>
        
        <div class="card">
          <div class="card-icon">📤</div>
          <h3>Subir Proyecto</h3>
          <p class="card-desc">Sube un nuevo proyecto de tesis</p>
          <button routerLink="/estudiante/subir" class="btn-primary">Subir</button>
        </div>
      </div>
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
      margin-bottom: 0.5rem;
    }

    .welcome {
      color: #666;
      margin-bottom: 2rem;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .card {
      background: white;
      padding: 1.5rem;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
      transition: transform 0.2s;
    }

    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .card-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .card h3 {
      color: #667eea;
      margin-bottom: 0.5rem;
    }

    .card-count {
      font-size: 1.5rem;
      font-weight: bold;
      color: #333;
      margin: 0.5rem 0;
    }

    .card-desc {
      color: #666;
      margin: 0.5rem 0 1rem;
    }

    .btn-primary {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 5px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.3s;
    }

    .btn-primary:hover {
      background: #5568d3;
    }
  `]
})
export class DashboardComponent implements OnInit {
  proyectos: any[] = [];

  constructor(private estudianteService: EstudianteService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.estudianteService.getMisProyectos().subscribe({
      next: (proyectos) => this.proyectos = proyectos,
      error: (err) => console.error('Error loading proyectos', err)
    });
  }
}
