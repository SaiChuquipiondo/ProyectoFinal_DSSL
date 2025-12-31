import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EstudianteService } from '../../../services/estudiante.service';
import { ToastService } from '../../../services/toast.service';
import { EstudianteSidebarComponent } from '../components/estudiante-sidebar/estudiante-sidebar.component';

@Component({
  selector: 'app-subir-borrador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EstudianteSidebarComponent],
  templateUrl: './subir-borrador.component.html',
  styleUrls: ['./subir-borrador.component.css']
})
export class SubirBorradorComponent implements OnInit {
  proyectos: any[] = [];
  selectedProyecto: number | null = null;
  selectedFile: File | null = null;
  isSubmitting = false;
  isCorrectionMode = false;
  borradorObservado: any = null;

  constructor(
    private estudianteService: EstudianteService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // 1. Cargar proyectos aprobados
    this.estudianteService.getMisProyectos().subscribe({
      next: (proyectos) => {
        this.proyectos = proyectos.filter((p: any) => p.estado_proyecto === 'APROBADO_FINAL');
        
        // 2. Cargar borradores para verificar si hay alguno observado
        this.checkBorradoresObservados();
      },
      error: (err) => {
        console.error('Error loading proyectos', err);
        this.toastService.error('Error al cargar proyectos', 3000);
      }
    });
  }

  checkBorradoresObservados(): void {
    this.estudianteService.getMisBorradores().subscribe({
      next: (borradores) => {
        // Buscar borrador observado (por coord, asesor o jurados)
        const observado = borradores.find(b => 
          b.estado === 'OBSERVADO' || 
          b.estado === 'OBSERVADO_ASESOR' || 
          b.estado === 'OBSERVADO_JURADOS'
        );
        
        if (observado) {
          this.isCorrectionMode = true;
          this.borradorObservado = observado;
          this.selectedProyecto = observado.id_proyecto;
          
 const mensajes: any = {
            'OBSERVADO': 'Tienes un borrador observado por coordinación.',
            'OBSERVADO_ASESOR': 'Tienes un borrador observado por tu asesor.',
            'OBSERVADO_JURADOS': 'Tienes un borrador observado por los jurados.'
          };
          
          this.toastService.info(
            mensajes[observado.estado] + ' Sube el archivo corregido para actualizarlo.', 
            5000
          );
        }
      },
      error: (err) => console.error('Error checking borradores', err)
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
    if (!this.selectedProyecto) {
      this.toastService.error('Selecciona un proyecto', 3000);
      return;
    }

    if (!this.selectedFile) {
      this.toastService.error('Selecciona un archivo PDF', 3000);
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    formData.append('archivo', this.selectedFile);

    if (this.isCorrectionMode && this.borradorObservado) {
      // MODO CORRECCIÓN
      this.estudianteService.corregirBorrador(this.borradorObservado.id_borrador, formData).subscribe({
        next: () => {
          this.toastService.success('Borrador corregido y actualizado exitosamente', 4000);
          this.handleSuccess();
        },
        error: (err) => this.handleError(err)
      });
    } else {
      // MODO NUEVO BORRADOR
      formData.append('id_proyecto', this.selectedProyecto.toString());
      this.estudianteService.subirBorrador(formData).subscribe({
        next: () => {
          this.toastService.success('Borrador subido exitosamente', 4000);
          this.handleSuccess();
        },
        error: (err) => this.handleError(err)
      });
    }
  }

  handleSuccess(): void {
    this.isSubmitting = false;
    this.router.navigate(['/estudiante/borradores']); // Redirigir a "Mis Borradores"
  }

  handleError(err: any): void {
    console.error('Error al subir/corregir borrador', err);
    this.toastService.error(err.error?.message || 'Error al procesar el borrador', 3000);
    this.isSubmitting = false;
  }


}
