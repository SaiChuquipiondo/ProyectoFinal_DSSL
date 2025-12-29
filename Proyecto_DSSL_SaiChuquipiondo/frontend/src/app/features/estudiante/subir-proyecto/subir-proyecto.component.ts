import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EstudianteService } from '../../../services/estudiante.service';
import { AuthService } from '../../../services/auth.service';
import { WebsocketService } from '../../../services/websocket.service';
import { ToastService } from '../../../services/toast.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-subir-proyecto',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './subir-proyecto.component.html',
  styleUrl: './subir-proyecto.component.css'
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

  constructor(
    private fb: FormBuilder,
    private estudianteService: EstudianteService,
    private authService: AuthService,
    private router: Router,
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
    
    // Escuchar cambios en especialidad para cargar asesores
    this.proyectoForm.get('id_especialidad')?.valueChanges.subscribe(idEspecialidad => {
      if (idEspecialidad) {
        this.loadAsesores(idEspecialidad);
      } else {
        this.asesores = [];
        this.proyectoForm.patchValue({ id_asesor: '' });
      }
    });
  }

  loadEspecialidades(): void {
    this.loading = true;
    // Obtener especialidades desde el backend
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

  loadAsesores(idEspecialidad: number): void {
    this.loadingAsesores = true;
    this.asesores = [];
    this.proyectoForm.patchValue({ id_asesor: '' });
    
    this.http.get<any[]>(`${environment.apiUrl}/especialidades/${idEspecialidad}/asesores`).subscribe({
      next: (data) => {
        this.asesores = data;
        this.loadingAsesores = false;
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
      // Validar que sea PDF
      if (file.type !== 'application/pdf') {
        this.toastService.error('Solo se permiten archivos PDF', 3000);
        event.target.value = '';
        return;
      }

      // Validar tamaño (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
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
    if (this.proyectoForm.invalid) {
      this.toastService.warning('Por favor completa todos los campos correctamente', 3000);
      return;
    }

    if (!this.selectedFile) {
      this.toastService.warning('Debes seleccionar un archivo PDF', 3000);
      return;
    }

    this.uploading = true;

    const formData = new FormData();
    formData.append('titulo', this.proyectoForm.value.titulo);
    formData.append('resumen', this.proyectoForm.value.resumen);
    formData.append('id_especialidad', this.proyectoForm.value.id_especialidad);
    formData.append('id_asesor', this.proyectoForm.value.id_asesor);
    formData.append('archivo', this.selectedFile);  // Changed from 'pdf' to 'archivo'

    this.estudianteService.subirProyecto(formData).subscribe({
      next: (response) => {
        this.toastService.success('¡Proyecto subido exitosamente!', 3000);
        this.uploading = false;
        // Redirigir a la lista de proyectos
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

  getUserFullName(): string {
    if (!this.currentUser) return 'Usuario';
    const nombres = this.currentUser.nombres || '';
    const apellido = this.currentUser.apellido_paterno || '';
    return `${nombres} ${apellido}`.trim() || 'Usuario';
  }

  getUserRole(): string {
    if (!this.currentUser) return '';
    const rol = this.currentUser.rol;
    if (rol === 'ESTUDIANTE') return 'Estudiante';
    if (rol === 'ASESOR' || rol === 'JURADO') return 'Docente';
    if (rol === 'COORDINACION') return 'Coordinador';
    return rol;
  }

  logout(): void {
    this.toastService.info('Sesión cerrada correctamente', 3000);
    this.authService.logout();
    this.websocketService.disconnect();
    this.router.navigate(['/login']);
  }
}
