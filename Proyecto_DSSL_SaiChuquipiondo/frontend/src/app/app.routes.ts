import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  
  // Estudiante
  {
    path: 'estudiante',
    canActivate: [authGuard, roleGuard],
    data: { role: 'ESTUDIANTE' },
    loadChildren: () => import('./features/estudiante/estudiante.routes').then(m => m.ESTUDIANTE_ROUTES)
  },
  
  // Docente (Asesor/Jurado)
  {
    path: 'docente',
    canActivate: [authGuard, roleGuard],
    data: { role: 'ASESOR' },
    loadChildren: () => import('./features/docente/docente.routes').then(m => m.DOCENTE_ROUTES)
  },
  
  // Coordinación
  {
    path: 'coordinacion',
    canActivate: [authGuard, roleGuard],
    data: { role: 'COORDINACION' },
    loadChildren: () => import('./features/coordinacion/coordinacion.routes').then(m => m.COORDINACION_ROUTES)
  },
  
  { path: '**', redirectTo: '/login' }
];
