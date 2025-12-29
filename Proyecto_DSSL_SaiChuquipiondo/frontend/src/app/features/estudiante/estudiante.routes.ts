import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProyectosListComponent } from './proyectos/proyectos-list.component';
import { SubirProyectoComponent } from './subir-proyecto/subir-proyecto.component';

export const ESTUDIANTE_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'proyectos', component: ProyectosListComponent },
  { path: 'subir', component: SubirProyectoComponent },
  { path: 'borradores', component: DashboardComponent }, // Placeholder
  { path: 'notificaciones', component: DashboardComponent }, // Placeholder
];
