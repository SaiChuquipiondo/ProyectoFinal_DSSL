import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SustentacionService } from '../../../services/sustentacion.service';
import { ToastService } from '../../../services/toast.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-tesis-finales',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './tesis-finales.component.html',
  styleUrl: './tesis-finales.component.css'
})
export class TesisFinalesComponent implements OnInit {
  tesis: any[] = [];
  loading = false;
  generandoResolucion: { [key: number]: boolean } = {};
  
  // Modal programación
  showModal = false;
  tesisSeleccionada: any = null;
  programandoSustentacion = false;
  formSustentacion = {
    fecha_hora: '',
    modalidad: 'PRESENCIAL',
    lugar: ''
  };

  constructor(
    private sustentacionService: SustentacionService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarTesis();
  }

  cargarTesis(): void {
    this.loading = true;
    this.sustentacionService.listarTesisFinales().subscribe({
      next: (data) => {
        this.tesis = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando tesis', err);
        this.toastService.error('Error al cargar tesis finales', 3000);
        this.loading = false;
      }
    });
  }

  generarResolucion(idProyecto: number): void {
    if (confirm('¿Está seguro de generar la resolución de sustentación?')) {
      this.generandoResolucion[idProyecto] = true;
      
      this.sustentacionService.generarResolucion(idProyecto).subscribe({
        next: (res) => {
          this.toastService.success(
            `Resolución ${res.numero_resolucion} generada exitosamente`,
            4000
          );
          this.generandoResolucion[idProyecto] = false;
          this.cargarTesis();
        },
        error: (err) => {
          console.error('Error generando resolución', err);
          this.toastService.error(
            err.error?.message || 'Error al generar resolución',
            3000
          );
          this.generandoResolucion[idProyecto] = false;
        }
      });
    }
  }

  abrirModalProgramacion(tesis: any): void {
    this.tesisSeleccionada = tesis;
    this.showModal = true;
    // Reset form
    this.formSustentacion = {
      fecha_hora: '',
      modalidad: 'PRESENCIAL',
      lugar: ''
    };
  }

  cerrarModal(): void {
    this.showModal = false;
    this.tesisSeleccionada = null;
  }

  programarSustentacion(): void {
    if (!this.formSustentacion.fecha_hora) {
      this.toastService.error('Debe seleccionar fecha y hora', 3000);
      return;
    }

    this.programandoSustentacion = true;

    this.sustentacionService.programarSustentacion(
      this.tesisSeleccionada.id_proyecto,
      this.formSustentacion
    ).subscribe({
      next: () => {
        this.toastService.success('Sustentación programada exitosamente', 4000);
        this.programandoSustentacion = false;
        this.cerrarModal();
        this.cargarTesis();
      },
      error: (err) => {
        console.error('Error programando sustentación', err);
        this.toastService.error(
          err.error?.message || 'Error al programar sustentación',
          3000
        );
        this.programandoSustentacion = false;
      }
    });
  }

  verPDF(rutaPdf: string): void {
    window.open(`${environment.wsUrl}/uploads/tesis/${rutaPdf}`, '_blank');
  }

  descargarResolucion(idResolucion: number): void {
    window.open(`${environment.apiUrl}/sustentacion/descargar/${idResolucion}`, '_blank');
  }

  // ======================
  // REGISTRO DE RESULTADOS
  // ======================
  showResultadoModal = false;
  registrandoResultado = false;
  generandoActa: { [key: number]: boolean } = {};
  
  formResultado = {
    nota: null as number | null,
    dictamen: 'APROBADO',
    observaciones: ''
  };

  abrirModalResultado(tesis: any): void {
    this.tesisSeleccionada = tesis;
    this.showResultadoModal = true;
    this.formResultado = {
      nota: null,
      dictamen: 'APROBADO',
      observaciones: ''
    };
  }

  cerrarModalResultado(): void {
    this.showResultadoModal = false;
    this.tesisSeleccionada = null;
  }

  registrarResultado(): void {
    if (!this.formResultado.dictamen) {
      this.toastService.error('Debe seleccionar un dictamen', 3000);
      return;
    }

    this.registrandoResultado = true;

    // Convert string to number if needed (though ngModel handles it usually)
    const payload = {
      ...this.formResultado,
      nota: this.formResultado.nota ? Number(this.formResultado.nota) : null
    };

    this.sustentacionService.registrarResultado(
      this.tesisSeleccionada.id_sustentacion,
      payload
    ).subscribe({
      next: () => {
        this.toastService.success('Resultado registrado exitosamente', 4000);
        this.registrandoResultado = false;
        this.cerrarModalResultado();
        this.cargarTesis();
      },
      error: (err) => {
        console.error('Error registrando resultado', err);
        this.toastService.error(
          err.error?.message || 'Error al registrar resultado',
          3000
        );
        this.registrandoResultado = false;
      }
    });
  }

  generarActa(idSustentacion: number): void {
    if (confirm('¿Confirma generar el Acta de Sustentación?')) {
      this.generandoActa[idSustentacion] = true;
      
      this.sustentacionService.generarActa(idSustentacion).subscribe({
        next: () => {
          this.toastService.success('Acta generada exitosamente', 4000);
          this.generandoActa[idSustentacion] = false;
          this.cargarTesis();
        },
        error: (err) => {
          console.error('Error generando acta', err);
          this.toastService.error(
            err.error?.message || 'Error al generar acta',
            3000
          );
          this.generandoActa[idSustentacion] = false;
        }
      });
    }
  }

  descargarActa(idActa: number): void {
    window.open(`${environment.apiUrl}/sustentacion/descargar-acta/${idActa}`, '_blank');
  }
}
