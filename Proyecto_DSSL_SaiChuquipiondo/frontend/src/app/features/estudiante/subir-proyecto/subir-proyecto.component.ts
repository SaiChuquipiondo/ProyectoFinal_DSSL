import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EstudianteService } from '../../../services/estudiante.service';
import { AuthService } from '../../../services/auth.service';
import { WebsocketService } from '../../../services/websocket.service';
import { ToastService } from '../../../services/toast.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { EstudianteSidebarComponent } from '../components/estudiante-sidebar/estudiante-sidebar.component';

@Component({
  selector: 'app-subir-proyecto',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, EstudianteSidebarComponent],
  templateUrl: './subir-proyecto.component.html',
  styleUrls: ['./subir-proyecto.component.css']
})
export class SubirProyectoComponent implements OnInit {
  proyectoForm: FormGroup;
  currentUser: any;
  especialidades: any[] = [];
  asesores: any[] = [];
  selectedFile: File | null = null;
  loading = false;
  loadingAsesores = false;
  uploading = false;
  
  isEditMode = false;
  proyectoId: number | null = null;
  proyectoActual: any = null;

  constructor(
    private fb: FormBuilder,
    private estudianteService: EstudianteService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private websocketService: WebsocketService,
    private toastService: ToastService,
    private http: HttpClient
  ) {
    this.proyectoForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(255)]],
      resumen: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(1000)]],
      id_especialidad: ['', Validators.required],
      id_asesor: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadEspecialidades();
    
    this.route.queryParams.subscribe(params => {
      if (params['proyectoId']) {
        this.isEditMode = true;
        this.proyectoId = +params['proyectoId'];
        this.loadProyectoData(this.proyectoId);
      }
    });
    
    this.proyectoForm.get('id_especialidad')?.valueChanges.subscribe(idEspecialidad => {
      if (idEspecialidad) {
        this.loadAsesores(idEspecialidad);
      } else {
        this.asesores = [];
        this.proyectoForm.patchValue({ id_asesor: '' });
      }
    });
  }

  loadProyectoData(proyectoId: number): void {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/estudiante/proyectos/${proyectoId}`).subscribe({
      next: (proyecto) => {
        this.proyectoActual = proyecto;

        
        this.proyectoForm.patchValue({
          titulo: proyecto.titulo,
          resumen: proyecto.resumen,
          id_especialidad: proyecto.id_especialidad
        }, { emitEvent: false });
        
        this.loadAsesores(proyecto.id_especialidad, proyecto.id_asesor);
        
        if (proyecto.estado_asesor === 'APROBADO') {
          this.proyectoForm.get('id_asesor')?.disable();
        }
        
        if (proyecto.estado_proyecto === 'OBSERVADO_ASESOR') {
          this.proyectoForm.get('titulo')?.disable();
          this.proyectoForm.get('resumen')?.disable();
          this.proyectoForm.get('id_especialidad')?.disable();
          this.proyectoForm.get('id_asesor')?.disable();
        }

        if (proyecto.estado_proyecto === 'OBSERVADO_JURADOS') {
          this.proyectoForm.get('titulo')?.disable();
          this.proyectoForm.get('resumen')?.disable();
          this.proyectoForm.get('id_especialidad')?.disable();
          this.proyectoForm.get('id_asesor')?.disable();
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading proyecto', err);
        this.toastService.error('Error al cargar proyecto', 3000);
        this.loading = false;
        this.router.navigate(['/estudiante/proyectos']);
      }
    });
  }

  loadEspecialidades(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/especialidades`).subscribe({
      next: (data) => {
        this.especialidades = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading especialidades', err);
        this.toastService.error('Error al cargar especialidades', 3000);
        this.loading = false;
      }
    });
  }

  loadAsesores(idEspecialidad: number, preselectedId: number | null = null): void {
    this.loadingAsesores = true;
    this.asesores = [];
    if (!preselectedId) {
      this.proyectoForm.patchValue({ id_asesor: '' });
    }
    
    this.http.get<any[]>(`${environment.apiUrl}/especialidades/${idEspecialidad}/asesores`).subscribe({
      next: (data) => {
        this.asesores = data;
        this.loadingAsesores = false;
        
        if (preselectedId) {
          const exists = this.asesores.some(a => a.id_docente === preselectedId);
          if (exists) {
            this.proyectoForm.patchValue({ id_asesor: preselectedId });
          } else {
             this.proyectoForm.patchValue({ id_asesor: preselectedId });
          }
        }

        if (data.length === 0) {
          this.toastService.warning('No hay asesores disponibles para esta especialidad', 3000);
        }
      },
      error: (err) => {
        console.error('Error loading asesores', err);
        this.toastService.error('Error al cargar asesores', 3000);
        this.loadingAsesores = false;
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

      const maxSize = 10 * 1024 * 1024; 
      if (file.size > maxSize) {
        this.toastService.error('El archivo no debe superar 10MB', 3000);
        event.target.value = '';
        return;
      }

      this.selectedFile = file;
      this.toastService.info(`Archivo seleccionado: ${file.name}`, 2000);
    }
  }

  onSubmit(): void {
    
    const esResubmisionAsesor = this.proyectoActual?.estado_proyecto === 'OBSERVADO_ASESOR';
    
    if (this.proyectoForm.invalid && !esResubmisionAsesor) {
      this.toastService.warning('Por favor completa todos los campos correctamente', 3000);
      return;
    }

    if (esResubmisionAsesor && !this.selectedFile) {
      this.toastService.warning('Debes subir el proyecto corregido en PDF', 3000);
      return;
    }

    if (!this.selectedFile && !this.isEditMode) {
      this.toastService.warning('Debes seleccionar un archivo PDF', 3000);
      return;
    }

    this.uploading = true;

    const formData = new FormData();
    const formValues = this.proyectoForm.getRawValue();
    
    formData.append('titulo', formValues.titulo);
    formData.append('resumen', formValues.resumen);
    formData.append('id_especialidad', formValues.id_especialidad);
    formData.append('id_asesor', formValues.id_asesor);
    
    if (this.selectedFile) {
      formData.append('archivo', this.selectedFile);
    }

    const request = this.isEditMode && this.proyectoId
      ? this.http.put(`${environment.apiUrl}/estudiante/proyectos/${this.proyectoId}`, formData)
      : this.estudianteService.subirProyecto(formData);

    request.subscribe({
      next: (response) => {
        const mensaje = this.isEditMode 
          ? '¡Proyecto actualizado exitosamente!' 
          : '¡Proyecto subido exitosamente!';
        this.toastService.success(mensaje, 3000);
        this.uploading = false;
        setTimeout(() => {
          this.router.navigate(['/estudiante/proyectos']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error uploading proyecto', err);
        this.toastService.error(err.error?.message || 'Error al subir proyecto', 4000);
        this.uploading = false;
      }
    });
  }


}
