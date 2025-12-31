import { Routes } from '@angular/router';

export const DOCENTE_ROUTES: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DocenteDashboardComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DocenteDashboardComponent)
  },
  {
    path: 'revisar/:id',
    loadComponent: () => import('./revisar-proyecto/revisar-proyecto.component').then(m => m.RevisarProyectoComponent)
  },
  {
    path: 'borrador/revisar/:id',
    loadComponent: () => import('./revisar-borrador/revisar-borrador.component').then(m => m.RevisarBorradorComponent)
  },
  {
    path: 'evaluar/:id',
    loadComponent: () => import('./revisar-proyecto/revisar-proyecto.component').then(m => m.RevisarProyectoComponent)
  }
];
