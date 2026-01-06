import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EstudianteService } from '../../../services/estudiante.service';
import { ToastService } from '../../../services/toast.service';
import { Router } from '@angular/router';
import { EstudianteSidebarComponent } from '../components/estudiante-sidebar/estudiante-sidebar.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-borradores',
  standalone: true,
  imports: [CommonModule, RouterModule, EstudianteSidebarComponent],
  templateUrl: './borradores.component.html',
  styleUrls: ['./borradores.component.css']
})
export class BorradoresComponent implements OnInit {
  borradores: any[] = [];
  tesisFinal: any = null;
  loading = false;

  constructor(
    private estudianteService: EstudianteService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadBorradores();
    this.loadTesisFinal();
  }

  loadBorradores(): void {
    this.loading = true;
    this.estudianteService.getMisBorradores().subscribe({
      next: (data) => {
        this.borradores = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading borradores', err);
        this.loading = false;
      }
    });
  }

  loadTesisFinal(): void {
    this.estudianteService.obtenerMiTesisFinal().subscribe({
      next: (data) => {
        this.tesisFinal = data;
      },
      error: (err) => {
        // Es normal que no exista tesis final aún
        console.log('No hay tesis final todavía');
      }
    });
  }

  getEstadoBadgeClass(estado: string): string {
    const stateMap: any = {
      'PENDIENTE': 'badge-warning',
      'OBSERVADO': 'badge-danger',
      'OBSERVADO_ASESOR': 'badge-danger',
      'OBSERVADO_JURADOS': 'badge-danger',
      'APROBADO_CORD': 'badge-info',
      'APROBADO_ASESOR': 'badge-primary',
      'APROBADO_JURADOS': 'badge-success',
      'APROBADO_FINAL': 'badge-success'
    };
    return stateMap[estado] || 'badge-secondary';
  }

  getEstadoTexto(estado: string): string {
    const textMap: any = {
      'PENDIENTE': 'PENDIENTE DE REVISIÓN',
      'OBSERVADO': 'OBSERVADO',
      'OBSERVADO_ASESOR': 'OBSERVADO POR ASESOR',
      'OBSERVADO_JURADOS': 'OBSERVADO POR JURADOS',
      'APROBADO_CORD': 'FORMATO APROBADO',
      'APROBADO_ASESOR': 'APROBADO POR ASESOR',
      'APROBADO_JURADOS': 'APROBADO POR JURADOS',
      'APROBADO_FINAL': 'APROBADO - LISTO PARA SUSTENTACIÓN'
    };
    return textMap[estado] || estado;
  }

  verPDF(rutaPdf: string): void {
    window.open(`${environment.wsUrl}/uploads/borradores/${rutaPdf}`, '_blank');
  }

  verPDFTesis(rutaPdf: string): void {
    window.open(`${environment.wsUrl}/uploads/tesis_final/${rutaPdf}`, '_blank');
  }


}
