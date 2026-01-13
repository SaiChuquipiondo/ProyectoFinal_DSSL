import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { DocenteService } from '../../../services/docente.service';

interface Proyecto {
  id_proyecto: number;
  titulo: string;
  resumen: string;
  ruta_pdf: string;
  iteracion: number;
  estado_proyecto: string;
  nombre_estudiante: string;
  codigo_estudiante: string;
}

@Component({
  selector: 'app-revisar-proyecto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './revisar-proyecto.component.html',
  styleUrls: ['./revisar-proyecto.component.css']
})
export class RevisarProyectoComponent implements OnInit {
  proyecto: Proyecto | null = null;
  loading = true;
  submitting = false;
  error = '';
  successMessage = '';
  
  estadoRevision: 'APROBADO' | 'OBSERVADO' | '' = '';
  comentarios = '';
  
  private apiUrl = environment.apiUrl;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private docenteService: DocenteService
  ) {}
  
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarProyecto(+id);
    }
  }
  
  cargarProyecto(id: number): void {
    this.loading = true;
    const esJurado = this.router.url.includes('/evaluar');
    const observable = esJurado 
      ? this.docenteService.getProyectosPendientesJurado() 
      : this.docenteService.getProyectosPendientesAsesor();
    
    observable.subscribe({
        next: (proyectos) => {
          const proyecto = proyectos.find(p => p.id_proyecto === id);
          if (proyecto) {
            this.proyecto = proyecto;
          } else {
            this.error = 'Proyecto no encontrado';
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar proyecto:', err);
          this.error = 'Error al cargar el proyecto';
          this.loading = false;
        }
      });
  }
  
  verPDF(): void {
    if (this.proyecto?.ruta_pdf) {
      const pdfUrl = `${environment.wsUrl}/uploads/proyectos/${this.proyecto.ruta_pdf}`;
      window.open(pdfUrl, '_blank');
    }
  }
  
  enviarRevision(): void {
    if (!this.estadoRevision) {
      this.error = 'Debe seleccionar si aprueba u observa el proyecto';
      return;
    }
    
    if (this.estadoRevision === 'OBSERVADO' && !this.comentarios.trim()) {
      this.error = 'Debe proporcionar comentarios al observar el proyecto';
      return;
    }
    
    this.submitting = true;
    this.error = '';
    
    const body = {
      estado_revision: this.estadoRevision,
      comentarios: this.comentarios
    };

    
    const esJurado = this.router.url.includes('/evaluar');
    const observable = esJurado 
      ? this.docenteService.revisarProyectoJurado(this.proyecto!.id_proyecto, body)
      : this.docenteService.revisarProyectoAsesor(this.proyecto!.id_proyecto, body);
    
    observable.subscribe({
      next: () => {
        this.successMessage = `Proyecto ${this.estadoRevision === 'APROBADO' ? 'aprobado' : 'observado'} correctamente`;
        setTimeout(() => {
          this.router.navigate(['/docente/dashboard']);
        }, 2000);
      },
      error: (err) => {
        console.error('Error al enviar revisión:', err);
        this.error = err.error?.message || 'Error al enviar la revisión';
        this.submitting = false;
      }
    });
  }
}
