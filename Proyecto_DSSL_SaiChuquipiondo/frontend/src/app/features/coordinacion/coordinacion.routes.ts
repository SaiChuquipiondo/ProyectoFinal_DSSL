import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TesisFinalesComponent } from './tesis-finales/tesis-finales.component';
import { DictamenFinalComponent } from './dictamen-final/dictamen-final.component';

export const COORDINACION_ROUTES: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'tesis-finales', component: TesisFinalesComponent },
  { path: 'dictamen-final', component: DictamenFinalComponent },
  { 
    path: 'crear-usuario', 
    loadComponent: () => import('./components/crear-usuario/crear-usuario.component').then(m => m.CrearUsuarioComponent)
  },
];
