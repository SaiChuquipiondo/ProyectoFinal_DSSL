import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProyectosListComponent } from './proyectos/proyectos-list.component';
import { SubirProyectoComponent } from './subir-proyecto/subir-proyecto.component';
import { SubirBorradorComponent } from './subir-borrador/subir-borrador.component';
import { BorradoresComponent } from './borradores/borradores.component';
import { SubirTesisFinalComponent } from './subir-tesis-final/subir-tesis-final.component';

export const ESTUDIANTE_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'proyectos', component: ProyectosListComponent },
  { path: 'subir', component: SubirProyectoComponent },
  { path: 'subir-borrador', component: SubirBorradorComponent },
  { path: 'borradores', component: BorradoresComponent },
  { path: 'subir-tesis-final', component: SubirTesisFinalComponent },
  { path: 'notificaciones', component: DashboardComponent }, // Placeholder
];
