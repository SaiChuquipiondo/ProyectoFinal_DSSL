# 🚀 Guía Completa de Implementación Frontend Angular

## ✅ Lo que ya está creado

### Models (✅ Completado)

- `user.interface.ts` - Interfaces de usuario y autenticación
- `proyecto.interface.ts` - Proyectos, borradores, tesis, sustentaciones
- `notificacion.interface.ts` - Notificaciones

### Services (✅ Completado)

- `auth.service.ts` - Autenticación completa
- `estudiante.service.ts` - API de estudiantes
- `docente.service.ts` - API de docentes (asesor + jurado)
- `coordinacion.service.ts` - API administrativa
- `notificacion.service.ts` - Gestión de notificaciones
- `websocket.service.ts` - Conexión en tiempo real

### Configuration (✅ Completado)

- `environment.ts` - URLs del backend

---

## 📋 Por Implementar

### 1. Guards y HTTP Interceptor

### 2. Componente de Login

### 3. Routing Principal

### 4. Dashboards por Rol

### 5. Componentes Shared

### 6. Configuración de App

---

## 🛡️ 1. Guards y HTTP Interceptor

### AuthGuard

**Crear:** `src/app/guards/auth.guard.ts`

```typescript
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
```

### RoleGuard

**Crear:** `src/app/guards/role.guard.ts`

```typescript
import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRole = route.data['role'];
  const user = authService.getCurrentUser();

  if (user && user.rol === expectedRole) {
    return true;
  }

  router.navigate(['/']);
  return false;
};
```

### HTTP Interceptor

**Crear:** `src/app/interceptors/auth.interceptor.ts`

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
    return next(clonedReq);
  }

  return next(req);
};
```

---

## 🔐 2. Componente de Login

**Generar componente:**

```bash
ng generate component components/login
```

### login.component.ts

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;
  error = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private websocketService: WebsocketService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.error = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        // Conectar WebSocket
        this.websocketService.connect();

        // Redirigir según rol
        const rol = response.user.rol;
        if (rol === 'ESTUDIANTE') {
          this.router.navigate(['/estudiante']);
        } else if (rol === 'ASESOR' || rol === 'JURADO') {
          this.router.navigate(['/docente']);
        } else if (rol === 'COORDINACION') {
          this.router.navigate(['/coordinacion']);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al iniciar sesión';
        this.loading = false;
      },
    });
  }
}
```

### login.component.html

```html
<div class="login-container">
  <div class="login-card">
    <h1>Sistema de Gestión de Tesis</h1>
    <h2>Iniciar Sesión</h2>

    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <div class="form-group">
        <label for="username">Usuario</label>
        <input
          type="text"
          id="username"
          formControlName="username"
          placeholder="Ingrese su usuario"
        />
      </div>

      <div class="form-group">
        <label for="password">Contraseña</label>
        <input
          type="password"
          id="password"
          formControlName="password"
          placeholder="Ingrese su contraseña"
        />
      </div>

      @if (error) {
      <div class="error-message">{{ error }}</div>
      }

      <button type="submit" [disabled]="loginForm.invalid || loading">
        @if (loading) {
        <span>Cargando...</span>
        } @else {
        <span>Iniciar Sesión</span>
        }
      </button>
    </form>
  </div>
</div>
```

### login.component.css

```css
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #333;
}

h2 {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  color: #666;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

button {
  width: 100%;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover:not(:disabled) {
  background: #5568d3;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 5px;
  margin-bottom: 1rem;
}
```

---

## 🗺️ 3. Routing Principal

### app.routes.ts

```typescript
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
    loadChildren: () =>
      import('./features/estudiante/estudiante.routes').then((m) => m.ESTUDIANTE_ROUTES),
  },

  // Docente (Asesor/Jurado)
  {
    path: 'docente',
    canActivate: [authGuard, roleGuard],
    data: { role: 'ASESOR' }, // Acepta ASESOR o JURADO
    loadChildren: () => import('./features/docente/docente.routes').then((m) => m.DOCENTE_ROUTES),
  },

  // Coordinación
  {
    path: 'coordinacion',
    canActivate: [authGuard, roleGuard],
    data: { role: 'COORDINACION' },
    loadChildren: () =>
      import('./features/coordinacion/coordinacion.routes').then((m) => m.COORDINACION_ROUTES),
  },

  { path: '**', redirectTo: '/login' },
];
```

---

## 📱 4. Estructura de Dashboards

### Dashboard Estudiante

**Generar:**

```bash
ng generate component features/estudiante/dashboard
ng generate component features/estudiante/mis-proyectos
ng generate component features/estudiante/subir-proyecto
```

**estudiante.routes.ts**

```typescript
import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MisProyectosComponent } from './mis-proyectos/mis-proyectos.component';
import { SubirProyectoComponent } from './subir-proyecto/subir-proyecto.component';

export const ESTUDIANTE_ROUTES: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'proyectos', component: MisProyectosComponent },
  { path: 'subir-proyecto', component: SubirProyectoComponent },
];
```

**dashboard.component.ts (Estudiante)**

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EstudianteService } from '../../../services/estudiante.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <h1>Dashboard Estudiante</h1>

      <div class="cards">
        <div class="card">
          <h3>Mis Proyectos</h3>
          <p>{{ proyectos.length }} proyecto(s)</p>
          <a routerLink="/estudiante/proyectos">Ver proyectos</a>
        </div>

        <div class="card">
          <h3>Subir Proyecto</h3>
          <p>Sube un nuevo proyecto de tesis</p>
          <a routerLink="/estudiante/subir-proyecto">Subir</a>
        </div>

        <div class="card">
          <h3>Notificaciones</h3>
          <p>{{ noLeidas }} no leídas</p>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  proyectos: any[] = [];
  noLeidas = 0;

  constructor(private estudianteService: EstudianteService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.estudianteService.getMisProyectos().subscribe((proyectos) => (this.proyectos = proyectos));
  }
}
```

### Dashboard Docente

**Generar:**

```bash
ng generate component features/docente/dashboard
ng generate component features/docente/proyectos-asesor
ng generate component features/docente/proyectos-jurado
```

**docente.routes.ts**

```typescript
import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';

export const DOCENTE_ROUTES: Routes = [{ path: '', component: DashboardComponent }];
```

**dashboard.component.ts (Docente)**

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocenteService } from '../../../services/docente.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h1>Dashboard Docente</h1>

      <div class="tabs">
        <button (click)="activeTab = 'asesor'" [class.active]="activeTab === 'asesor'">
          Como Asesor ({{ proyectosAsesor.length }})
        </button>
        <button (click)="activeTab = 'jurado'" [class.active]="activeTab === 'jurado'">
          Como Jurado ({{ proyectosJurado.length }})
        </button>
      </div>

      @if (activeTab === 'asesor') {
      <div class="proyectos-list">
        <h2>Proyectos como Asesor</h2>
        @for (proyecto of proyectosAsesor; track proyecto.id_proyecto) {
        <div class="proyecto-card">
          <h3>{{ proyecto.titulo }}</h3>
          <p>Estado: {{ proyecto.estado_proyecto }}</p>
          <button (click)="revisar(proyecto)">Revisar</button>
        </div>
        }
      </div>
      } @if (activeTab === 'jurado') {
      <div class="proyectos-list">
        <h2>Proyectos como Jurado</h2>
        @for (proyecto of proyectosJurado; track proyecto.id_proyecto) {
        <div class="proyecto-card">
          <h3>{{ proyecto.titulo }}</h3>
          <p>Rol: {{ proyecto.rol_jurado }}</p>
          <button (click)="revisar(proyecto)">Revisar</button>
        </div>
        }
      </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  activeTab: 'asesor' | 'jurado' = 'asesor';
  proyectosAsesor: any[] = [];
  proyectosJurado: any[] = [];

  constructor(private docenteService: DocenteService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.docenteService
      .getProyectosPendientesAsesor()
      .subscribe((proyectos) => (this.proyectosAsesor = proyectos));
    this.docenteService
      .getProyectosPendientesJurado()
      .subscribe((proyectos) => (this.proyectosJurado = proyectos));
  }

  revisar(proyecto: any): void {
    // Abrir modal de revisión
    console.log('Revisar proyecto', proyecto);
  }
}
```

### Dashboard Coordinación

**Generar:**

```bash
ng generate component features/coordinacion/dashboard
```

**coordinacion.routes.ts**

```typescript
import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';

export const COORDINACION_ROUTES: Routes = [{ path: '', component: DashboardComponent }];
```

---

## 🧩 5. Componentes Shared

### Navbar Component

**Generar:**

```bash
ng generate component components/navbar
```

**navbar.component.ts**

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificacionService } from '../../services/notificacion.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="navbar">
      <div class="nav-brand">SGT</div>

      <div class="nav-items">
        <div class="notification-bell" (click)="toggleNotifications()">
          🔔 @if (noLeidas > 0) {
          <span class="badge">{{ noLeidas }}</span>
          }
        </div>

        <div class="user-menu">
          <span>{{ user?.rol }}</span>
          <button (click)="logout()">Cerrar Sesión</button>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      .navbar {
        background: #667eea;
        color: white;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .nav-brand {
        font-size: 1.5rem;
        font-weight: bold;
      }

      .nav-items {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .notification-bell {
        position: relative;
        font-size: 1.5rem;
        cursor: pointer;
      }

      .badge {
        position: absolute;
        top: -5px;
        right: -10px;
        background: red;
        border-radius: 50%;
        padding: 2px 6px;
        font-size: 0.75rem;
      }

      button {
        background: white;
        color: #667eea;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        cursor: pointer;
      }
    `,
  ],
})
export class NavbarComponent implements OnInit {
  user: any;
  noLeidas = 0;

  constructor(
    private authService: AuthService,
    private notificacionService: NotificacionService,
    private websocketService: WebsocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();

    this.notificacionService.noLeidas$.subscribe((count) => (this.noLeidas = count));

    this.notificacionService
      .contarNoLeidas()
      .subscribe((res) => this.notificacionService.updateNoLeidasCount(res.no_leidas));
  }

  toggleNotifications(): void {
    // Abrir panel de notificaciones
  }

  logout(): void {
    this.authService.logout();
    this.websocketService.disconnect();
    this.router.navigate(['/login']);
  }
}
```

---

## ⚙️ 6. Configuración de App

### app.config.ts

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
```

### app.component.ts

```typescript
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AuthService } from './services/auth.service';
import { WebsocketService } from './services/websocket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    @if (isLoggedIn) {
    <app-navbar />
    }
    <router-outlet />
  `,
})
export class AppComponent implements OnInit {
  isLoggedIn = false;

  constructor(private authService: AuthService, private websocketService: WebsocketService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;

      if (user) {
        this.websocketService.connect();
        this.websocketService.requestNotificationPermission();
      }
    });
  }
}
```

---

## 🚀 Comandos para Generar Todo

```bash
# Guards
mkdir src/app/guards

# Interceptors
mkdir src/app/interceptors

# Login
ng generate component components/login

# Navbar
ng generate component components/navbar

# Features - Estudiante
mkdir -p src/app/features/estudiante
ng generate component features/estudiante/dashboard
ng generate component features/estudiante/mis-proyectos
ng generate component features/estudiante/subir-proyecto

# Features - Docente
mkdir -p src/app/features/docente
ng generate component features/docente/dashboard

# Features - Coordinación
mkdir -p src/app/features/coordinacion
ng generate component features/coordinacion/dashboard
```

---

## ✅ Checklist de Implementación

- [ ] Crear guards (auth.guard.ts, role.guard.ts)
- [ ] Crear interceptor (auth.interceptor.ts)
- [ ] Crear componente de login
- [ ] Configurar routing (app.routes.ts)
- [ ] Crear navbar component
- [ ] Crear dashboard estudiante
- [ ] Crear dashboard docente
- [ ] Crear dashboard coordinación
- [ ] Configurar app.config.ts
- [ ] Actualizar app.component.ts
- [ ] Probar login y navegación
- [ ] Probar WebSockets
- [ ] Verificar guards funcionan

---

## 🧪 Pruebas

1. Iniciar backend: `npm run dev`
2. Iniciar frontend: `ng serve`
3. Navegar a `http://localhost:4200`
4. Login con un usuario de prueba
5. Verificar redirección según rol
6. Verificar notificaciones en tiempo real

---

**Frontend Angular - Sistema de Gestión de Tesis** © 2025
