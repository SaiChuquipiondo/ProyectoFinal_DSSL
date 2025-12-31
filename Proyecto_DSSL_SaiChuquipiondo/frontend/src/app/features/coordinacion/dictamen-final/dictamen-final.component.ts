import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CoordinacionService } from '../../../services/coordinacion.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-dictamen-final',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dictamen-final.component.html',
  styleUrl: './dictamen-final.component.css'
})
export class DictamenFinalComponent implements OnInit {
  borradores: any[] = [];
  loading = false;
  emitiendoDictamen: { [key: number]: boolean } = {};

  constructor(
    private coordinacionService: CoordinacionService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarBorradores();
  }

  cargarBorradores(): void {
    this.loading = true;
    this.coordinacionService.getBorradoresAprobadosJurados().subscribe({
      next: (data) => {
        this.borradores = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando borradores', err);
        this.toastService.error('Error al cargar borradores aprobados', 3000);
        this.loading = false;
      }
    });
  }

  emitirDictamen(borrador: any): void {
    if (confirm(`¿Confirma emitir dictamen final para "${borrador.titulo}"?\n\nEsto autorizará al estudiante a preparar su tesis final.`)) {
      this.emitiendoDictamen[borrador.id_borrador] = true;
      
      const formData = new FormData();
      this.coordinacionService.dictamenBorrador(borrador.id_borrador, formData).subscribe({
        next: () => {
          this.toastService.success(
            'Dictamen final emitido exitosamente. El estudiante ha sido notificado.',
            4000
          );
          this.emitiendoDictamen[borrador.id_borrador] = false;
          this.cargarBorradores();
        },
        error: (err) => {
          console.error('Error emitiendo dictamen', err);
          this.toastService.error(
            err.error?.message || 'Error al emitir dictamen final',
            3000
          );
          this.emitiendoDictamen[borrador.id_borrador] = false;
        }
      });
    }
  }
}
