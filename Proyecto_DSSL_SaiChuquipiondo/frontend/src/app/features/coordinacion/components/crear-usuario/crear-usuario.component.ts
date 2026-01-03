import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { CoordinacionService } from '../../../../services/coordinacion.service';

@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './crear-usuario.component.html',
  styleUrls: ['./crear-usuario.component.css']
})
export class CrearUsuarioComponent {
  formData = {
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    dni: '',
    correo: '',
    celular: '',
    direccion: '',
    fecha_nacimiento: '',
    sexo: 'M',
    username: '',
    password: '',
    rol: 'ESTUDIANTE',
    codigo_estudiante: '',
    fecha_egreso: ''
  };

  loading = false;
  error = '';
  success = '';

  constructor(
    private coordinacionService: CoordinacionService,
    private router: Router
  ) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.success = '';

    const payload = {
      ...this.formData,
      telefono: this.formData.celular 
    };

    this.coordinacionService.crearUsuario(payload).subscribe({
      next: () => {
        this.success = 'Usuario creado exitosamente.';
        this.resetForm();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error al crear usuario';
      }
    }).add(() => this.loading = false);
  }

  resetForm() {
    this.formData = {
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      dni: '',
      correo: '',
      celular: '',
      direccion: '',
      fecha_nacimiento: '',
      sexo: 'M',
      username: '',
      password: '',
      rol: 'ESTUDIANTE',
      codigo_estudiante: '',
      fecha_egreso: ''
    };
  }
}
