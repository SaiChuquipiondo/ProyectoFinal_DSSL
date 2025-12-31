import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { EstudianteService } from '../../../services/estudiante.service';
import { ToastService } from '../../../services/toast.service';
import { EstudianteSidebarComponent } from '../components/estudiante-sidebar/estudiante-sidebar.component';

@Component({
  selector: 'app-subir-tesis-final',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EstudianteSidebarComponent],
  templateUrl: './subir-tesis-final.component.html',
  styleUrls: ['./subir-tesis-final.component.css']
})
export class SubirTesisFinalComponent implements OnInit {
  selectedFile: File | null = null;
  isSubmitting = false;
  proyectoInfo: any = null;
  id_proyecto: number | null = null;

  constructor(
    private estudianteService: EstudianteService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Obtener id_proyecto de query params
    this.route.queryParams.subscribe(params => {
      this.id_proyecto = params['id_proyecto'];
      if (this.id_proyecto) {
        this.cargarInfoProyecto();
      }
    });
  }

  cargarInfoProyecto(): void {
    // Obtener información del borrador aprobado
    this.estudianteService.getMisBorradores().subscribe({
      next: (borradores) => {
        const borradorAprobado = borradores.find(
          b => b.id_proyecto === Number(this.id_proyecto) && b.estado === 'APROBADO_FINAL'
        );
        
        if (borradorAprobado) {
          this.proyectoInfo = borradorAprobado;
        } else {
          this.toastService.error('No se encontró un borrador aprobado para este proyecto', 3000);
          this.router.navigate(['/estudiante/borradores']);
        }
      },
      error: (err) => {
        console.error('Error cargando proyecto', err);
        this.toastService.error('Error al cargar información del proyecto', 3000);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        this.toastService.error('Solo se permiten archivos PDF', 3000);
        event.target.value = '';
        return;
      }
      this.selectedFile = file;
    }
  }

  onSubmit(): void {
    if (!this.selectedFile) {
      this.toastService.error('Selecciona un archivo PDF', 3000);
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    formData.append('archivo', this.selectedFile);

    this.estudianteService.subirTesisFinal(formData).subscribe({
      next: () => {
        this.toastService.success('Tesis final subida exitosamente. Tu tesis ha sido registrada.', 4000);
        this.router.navigate(['/estudiante/borradores']);
      },
      error: (err) => {
        console.error('Error al subir tesis final', err);
        this.toastService.error(err.error?.message || 'Error al subir tesis final', 3000);
        this.isSubmitting = false;
      }
    });
  }


}
