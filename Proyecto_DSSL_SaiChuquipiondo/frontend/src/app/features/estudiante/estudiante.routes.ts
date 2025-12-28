import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';

export const ESTUDIANTE_ROUTES: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'proyectos', component: DashboardComponent }, // Placeholder
  { path: 'subir', component: DashboardComponent }, // Placeholder
];
