import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CoordinacionService } from '../../../services/coordinacion.service';
import { SustentacionService } from '../../../services/sustentacion.service';
import { HeaderComponent } from '../components/header/header.component';
import { AuthService } from '../../../services/auth.service';
import { WebsocketService } from '../../../services/websocket.service';
import { ToastService } from '../../../services/toast.service';
import { NotificacionService } from '../../../services/notificacion.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  proyectosPendientes: any[] = [];
  proyectosPendientesFiltrados: any[] = [];
  borradoresPendientes: any[] = [];
  sustentacionesProgramadas: any[] = [];
  proyectosAprobadosJurados: any[] = [];
  borradoresAprobadosJurados: any[] = [];
  tesisPendientesResolucion: any[] = [];
  currentUser: any;

  // Notificaciones
  notificaciones: any[] = [];
  noLeidasCount: number = 0;
  showNotifications: boolean = false;
  cargandoNotificaciones: boolean = false;
  private noLeidasSubscription?: Subscription;
  expandedNotifications: Set<number> = new Set();

  // Modales y estados
  showModalDetalles: boolean = false;
  showModalRechazo: boolean = false;
  showModalAsesor: boolean = false;
  showModalJurados: boolean = false;
  proyectoSeleccionado: any = null;
  detallesProyecto: any = null;
  cargandoDetalles: boolean = false;
  motivoRechazo: string = '';

  // Asignación de jurados
  docentesDisponibles: any[] = [];
  cargandoDocentes: boolean = false;
  juradoPresidente: number | null = null;
  juradoSecretario: number | null = null;
  juradoVocal: number | null = null;

  // Tesis Finales Management
  generandoResolucion: { [key: number]: boolean } = {};
  programandoSustentacion = false;
  showModalProgramacion = false; // Renamed to avoid confusion if other modals exist
  showModalResultado = false;
  registrandoResultado = false;
  generandoActa: { [key: number]: boolean } = {};
  
  tesisSeleccionadaSustentacion: any = null; // Renamed to distinguish from projects

  formSustentacion = {
    fecha_hora: '',
    modalidad: 'PRESENCIAL',
    lugar: ''
  };

  formResultado = {
    nota: null as number | null,
    dictamen: 'APROBADO',
    observaciones: ''
  };

  // Filtros
  filtroEstadoProyecto: string = '';
  filtroEstadoAsesor: string = '';
  filtroBusqueda: string = '';

  constructor(
    private coordinacionService: CoordinacionService,
    private sustentacionService: SustentacionService,
    private authService: AuthService,
    private router: Router,
    private websocketService: WebsocketService,
    private toastService: ToastService,
    private notificacionService: NotificacionService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadData();
    this.cargarNotificaciones();
    
    // Suscribirse al contador de no leídas
    this.noLeidasSubscription = this.notificacionService.noLeidas$.subscribe(
      count => this.noLeidasCount = count
    );

    // Cargar contador inicial
    this.notificacionService.contarNoLeidas().subscribe({
      next: res => this.noLeidasCount = res.no_leidas,
      error: err => console.error('Error al cargar contador de notificaciones', err)
    });
  }

  ngOnDestroy(): void {
    if (this.noLeidasSubscription) {
      this.noLeidasSubscription.unsubscribe();
    }
  }

  loadData(): void {
    this.coordinacionService.getProyectosPendientes().subscribe({
      next: (proyectos) => {
        this.proyectosPendientes = proyectos;
        this.aplicarFiltros();
      },
      error: (err) => console.error('Error loading proyectos', err)
    });
    
    this.coordinacionService.getBorradoresPendientes().subscribe({
      next: (borradores) => this.borradoresPendientes = borradores,
      error: (err) => console.error('Error loading borradores pendientes', err)
    });
    
    this.coordinacionService.getSustentacionesProgramadas().subscribe({
      next: (sustentaciones) => this.sustentacionesProgramadas = sustentaciones,
      error: (err) => console.error('Error loading sustentaciones', err)
    });

    this.sustentacionService.listarTesisFinales().subscribe({
      next: (tesis) => {
        console.log('Tesis cargadas:', tesis);
        this.tesisPendientesResolucion = tesis; // Mostrar todas, incluidas las que ya tienen acta
      },
      error: (err) => console.error('Error loading tesis finales', err)
    });

    this.coordinacionService.getProyectosAprobadosJurados().subscribe({
      next: (proyectos) => this.proyectosAprobadosJurados = proyectos,
      error: (err) => console.error('Error loading proyectos aprobados por jurados', err)
    });

    this.coordinacionService.getBorradoresAprobadosJurados().subscribe({
      next: (borradores) => this.borradoresAprobadosJurados = borradores,
      error: (err) => console.error('Error loading borradores aprobados por jurados', err)
    });
  }

  // ==================== NOTIFICACIONES ====================
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.cargarNotificaciones();
    }
  }

  cargarNotificaciones(): void {
    this.cargandoNotificaciones = true;
    this.notificacionService.getNotificaciones(false, 20).subscribe({
      next: res => {
        this.notificaciones = res.notificaciones || [];
        this.cargandoNotificaciones = false;
      },
      error: err => {
        console.error('Error al cargar notificaciones', err);
        this.cargandoNotificaciones = false;
      }
    });
  }

  toggleExpand(idNotificacion: number): void {
    if (this.expandedNotifications.has(idNotificacion)) {
      this.expandedNotifications.delete(idNotificacion);
    } else {
      this.expandedNotifications.add(idNotificacion);
    }

    const notif = this.notificaciones.find(n => n.id_notificacion === idNotificacion);
    if (notif && !notif.leida) {
      this.notificacionService.marcarComoLeida(idNotificacion).subscribe({
        next: () => {
          notif.leida = true;
          this.notificacionService.contarNoLeidas().subscribe(
            res => this.notificacionService.updateNoLeidasCount(res.no_leidas)
          );
        },
        error: err => console.error('Error al marcar como leida', err)
      });
    }
  }

  isExpanded(idNotificacion: number): boolean {
    return this.expandedNotifications.has(idNotificacion);
  }

  marcarTodasLeidas(): void {
    this.notificacionService.marcarTodasLeidas().subscribe({
      next: () => {
        this.notificaciones.forEach(n => n.leida = true);
        this.notificacionService.updateNoLeidasCount(0);
        this.toastService.success('Todas las notificaciones marcadas como leidas', 3000);
      },
      error: err => console.error('Error al marcar todas como leidas', err)
    });
  }

  // ==================== GESTIÓN DE PROYECTOS ====================
  verDetalles(proyecto: any): void {
    this.proyectoSeleccionado = proyecto;
    this.cargandoDetalles = true;
    this.showModalDetalles = true;

    this.coordinacionService.getProyectoDetalles(proyecto.id_proyecto).subscribe({
      next: (detalles) => {
        this.detallesProyecto = detalles;
        this.cargandoDetalles = false;
      },
      error: (err) => {
        console.error('Error al cargar detalles', err);
        this.toastService.error('Error al cargar detalles del proyecto', 3000);
        this.cargandoDetalles = false;
        this.showModalDetalles = false;
      }
    });
  }

  cerrarModalDetalles(): void {
    this.showModalDetalles = false;
    this.detallesProyecto = null;
    this.proyectoSeleccionado = null;
  }

  aprobarProyecto(idProyecto: number): void {
    if (!confirm('¿Confirmar la aprobación de este proyecto?')) return;

    this.coordinacionService.aprobarFormato(idProyecto).subscribe({
      next: () => {
        this.toastService.success('Proyecto aprobado correctamente', 3000);
        this.cerrarModalDetalles();
        this.loadData();
      },
      error: (err) => {
        console.error('Error al aprobar proyecto', err);
        this.toastService.error('Error al aprobar el proyecto', 3000);
      }
    });
  }

  mostrarModalRechazo(proyecto: any): void {
    this.proyectoSeleccionado = proyecto;
    this.motivoRechazo = '';
    this.showModalRechazo = true;
    if (this.showModalDetalles) {
      this.cerrarModalDetalles();
    }
  }

  cerrarModalRechazo(): void {
    this.showModalRechazo = false;
    this.motivoRechazo = '';
    this.proyectoSeleccionado = null;
  }

  rechazarProyecto(): void {
    if (!this.motivoRechazo || this.motivoRechazo.trim() === '') {
      this.toastService.error('Debe especificar el motivo del rechazo', 3000);
      return;
    }

    if (!this.proyectoSeleccionado) return;

    this.coordinacionService.rechazarFormato(this.proyectoSeleccionado.id_proyecto, this.motivoRechazo).subscribe({
      next: () => {
        this.toastService.success('Proyecto rechazado. Se notificó al estudiante.', 3000);
        this.cerrarModalRechazo();
        this.loadData();
      },
      error: (err) => {
        console.error('Error al rechazar proyecto', err);
        this.toastService.error('Error al rechazar el proyecto', 3000);
      }
    });
  }

  mostrarModalAsesor(proyecto: any): void {
    this.proyectoSeleccionado = proyecto;
    this.showModalAsesor = true;
    if (this.showModalDetalles) {
      this.cerrarModalDetalles();
    }
  }

  cerrarModalAsesor(): void {
    this.showModalAsesor = false;
    this.proyectoSeleccionado = null;
  }

  aprobarAsesor(): void {
    if (!this.proyectoSeleccionado) return;

    this.coordinacionService.aprobarAsesor(this.proyectoSeleccionado.id_proyecto).subscribe({
      next: () => {
        this.toastService.success('Asesor aprobado correctamente', 3000);
        this.cerrarModalAsesor();
        this.loadData();
      },
      error: (err) => {
        console.error('Error al aprobar asesor', err);
        this.toastService.error('Error al aprobar el asesor', 3000);
      }
    });
  }

  rechazarAsesor(): void {
    if (!confirm('¿Confirmar el rechazo del asesor propuesto?')) return;
    if (!this.proyectoSeleccionado) return;

    this.coordinacionService.rechazarAsesor(this.proyectoSeleccionado.id_proyecto).subscribe({
      next: () => {
        this.toastService.success('Asesor rechazado. Se notificó al estudiante y al docente.', 3000);
        this.cerrarModalAsesor();
        this.loadData();
      },
      error: (err) => {
        console.error('Error al rechazar asesor', err);
        this.toastService.error('Error al rechazar el asesor', 3000);
      }
    });
  }

  // ==================== ASIGNACIÓN DE JURADOS ====================
  mostrarModalJurados(proyecto: any): void {
    this.proyectoSeleccionado = proyecto;
    this.showModalJurados = true;
    this.juradoPresidente = null;
    this.juradoSecretario = null;
    this.juradoVocal = null;
    this.cargarDocentesPorEspecialidad(proyecto.id_especialidad, proyecto.id_asesor);
  }

  cargarDocentesPorEspecialidad(idEspecialidad: number, idAsesor: number): void {
    this.cargandoDocentes = true;
    this.http.get<any[]>(`${environment.apiUrl}/especialidades/${idEspecialidad}/asesores`).subscribe({
      next: (docentes) => {
        this.docentesDisponibles = docentes.filter(d => d.id_docente !== idAsesor);
        this.cargandoDocentes = false;
        if (this.docentesDisponibles.length < 3) {
          this.toastService.warning('No hay suficientes docentes en esta especialidad para asignar jurados', 4000);
        }
      },
      error: (err) => {
        console.error('Error cargando docentes', err);
        this.toastService.error('Error al cargar docentes', 3000);
        this.cargandoDocentes = false;
      }
    });
  }

  asignarJurados(): void {
    if (!this.juradoPresidente || !this.juradoSecretario || !this.juradoVocal) {
      this.toastService.warning('Debe seleccionar los 3 jurados', 3000);
      return;
    }

    if (this.juradoPresidente === this.juradoSecretario || 
        this.juradoPresidente === this.juradoVocal || 
        this.juradoSecretario === this.juradoVocal) {
      this.toastService.error('Los jurados deben ser diferentes', 3000);
      return;
    }

    const data = {
      presidente: this.juradoPresidente,
      secretario: this.juradoSecretario,
      vocal: this.juradoVocal
    };

    this.coordinacionService.asignarJurados(this.proyectoSeleccionado.id_proyecto, data).subscribe({
      next: () => {
        this.toastService.success('Jurados asignados correctamente', 3000);
        this.cerrarModalJurados();
        this.loadData();
      },
      error: (err) => {
        console.error('Error asignando jurados', err);
        this.toastService.error(err.error?.message || 'Error al asignar jurados', 4000);
      }
    });
  }

  cerrarModalJurados(): void {
    this.showModalJurados = false;
    this.proyectoSeleccionado = null;
    this.docentesDisponibles = [];
    this.juradoPresidente = null;
    this.juradoSecretario = null;
    this.juradoVocal = null;
  }

  get docentesParaPresidente(): any[] {
    return this.docentesDisponibles.filter(d => 
      d.id_docente !== this.juradoSecretario && 
      d.id_docente !== this.juradoVocal
    );
  }

  get docentesParaSecretario(): any[] {
    return this.docentesDisponibles.filter(d => 
      d.id_docente !== this.juradoPresidente && 
      d.id_docente !== this.juradoVocal
    );
  }

  get docentesParaVocal(): any[] {
    return this.docentesDisponibles.filter(d => 
      d.id_docente !== this.juradoPresidente && 
      d.id_docente !== this.juradoSecretario
    );
  }

  onPresidenteChange(): void {
    if (this.juradoPresidente === this.juradoSecretario) {
      this.juradoSecretario = null;
    }
    if (this.juradoPresidente === this.juradoVocal) {
      this.juradoVocal = null;
    }
  }

  onSecretarioChange(): void {
    if (this.juradoSecretario === this.juradoPresidente) {
      this.juradoPresidente = null;
    }
    if (this.juradoSecretario === this.juradoVocal) {
      this.juradoVocal = null;
    }
  }

  onVocalChange(): void {
    if (this.juradoVocal === this.juradoPresidente) {
      this.juradoPresidente = null;
    }
    if (this.juradoVocal === this.juradoSecretario) {
      this.juradoSecretario = null;
    }
  }

  // ==================== DICTAMEN FINAL ====================
  emitirDictamen(proyecto: any): void {
    if (!confirm(`¿Confirmar dictamen para aprobar el proyecto "${proyecto.titulo}" y permitir la presentación del borrador de tesis?`)) {
      return;
    }

    this.coordinacionService.dictamenFinal(proyecto.id_proyecto).subscribe({
      next: () => {
        this.toastService.success('Dictamen emitido correctamente. El estudiante puede proceder a subir el borrador de tesis.', 4000);
        this.loadData();
      },
      error: (err) => {
        console.error('Error al emitir dictamen', err);
        this.toastService.error(err.error?.message || 'Error al emitir el dictamen', 3000);
      }
    });
  }

  // ==================== VALIDACIÓN FORMATO BORRADOR ====================
  validarFormatoBorrador(borrador: any, aprobado: boolean): void {
    const mensaje = aprobado
      ? `¿Aprobar formato del borrador "${borrador.titulo}" versión #${borrador.numero_iteracion}?`
      : `¿Rechazar formato del borrador "${borrador.titulo}" versión #${borrador.numero_iteracion}?`;

    if (!confirm(mensaje)) {
      return;
   }

    const data = { aprobado: aprobado };

    this.coordinacionService.revisarFormatoBorrador(borrador.id_borrador, data).subscribe({
      next: () => {
        const accion = aprobado ? 'aprobado' : 'rechazado';
        this.toastService.success(`Formato del borrador ${accion} correctamente.`, 4000);
        this.loadData();
      },
      error: (err: any) => {
        console.error('Error al validar formato de borrador', err);
        this.toastService.error(err.error?.message || 'Error al validar el formato', 3000);
      }
    });
  }

  // ==================== DICTAMEN BORRADOR ====================
  emitirDictamenBorrador(borrador: any): void {
    if (!confirm(`¿Confirmar dictamen para aprobar el borrador de la tesis "${borrador.titulo}" y permitir la programación de sustentación?`)) {
      return;
    }

    const formData = new FormData();
    this.coordinacionService.dictamenBorrador(borrador.id_borrador, formData).subscribe({
      next: () => {
        this.toastService.success('Dictamen de borrador emitido correctamente. El estudiante puede programar su sustentación.', 4000);
        this.loadData();
      },
      error: (err: any) => {
        console.error('Error al emitir dictamen de borrador', err);
        this.toastService.error(err.error?.message || 'Error al emitir el dictamen', 3000);
      }
    });
  }

  // ==================== FILTROS ====================
  aplicarFiltros(): void {
    let proyectos = [...this.proyectosPendientes];

    if (this.filtroEstadoProyecto) {
      proyectos = proyectos.filter(p => p.estado_proyecto === this.filtroEstadoProyecto);
    }

    if (this.filtroEstadoAsesor) {
      proyectos = proyectos.filter(p => p.estado_asesor === this.filtroEstadoAsesor);
    }

    if (this.filtroBusqueda) {
      const busqueda = this.filtroBusqueda.toLowerCase();
      proyectos = proyectos.filter(p => 
        p.nombre_estudiante?.toLowerCase().includes(busqueda) ||
        p.titulo?.toLowerCase().includes(busqueda)
      );
    }

    this.proyectosPendientesFiltrados = proyectos;
  }

  limpiarFiltros(): void {
    this.filtroEstadoProyecto = '';
    this.filtroEstadoAsesor = '';
    this.filtroBusqueda = '';
    this.aplicarFiltros();
  }

  onFiltroCambio(): void {
    this.aplicarFiltros();
  }

  getTimeAgo(fecha: string): string {
    const now = new Date();
    const then = new Date(fecha);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'Hace unos segundos';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min${minutes > 1 ? 's' : ''}`;
    const hours = Math.floor(seconds / 3600);
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    const days = Math.floor(seconds / 86400);
    if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
    const months = Math.floor(days / 30);
    return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
  }

  // ==================== UTILIDADES ====================
  getUserFullName(): string {
    if (!this.currentUser) return 'Coordinador';
    const nombres = this.currentUser.nombres || '';
    const apellido = this.currentUser.apellido_paterno || '';
    return `${nombres} ${apellido}`.trim() || 'Coordinador';
  }

  getUserRole(): string {
    if (!this.currentUser) return 'Coordinación Académica';
    const rol = this.currentUser.rol;
    if (rol === 'COORDINACION') return 'Coordinación Académica';
    return rol;
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'C';
    const nombres = this.currentUser.nombres || '';
    const apellido = this.currentUser.apellido_paterno || '';
    const initial1 = nombres.charAt(0).toUpperCase();
    const initial2 = apellido.charAt(0).toUpperCase();
    return initial1 + initial2 || 'C';
  }

  getCurrentDate(): string {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('es-ES', options);
  }

  getTotalPendientes(): number {
    return this.proyectosPendientes.length + this.borradoresPendientes.length + this.tesisPendientesResolucion.length;
  }

  logout(): void {
    this.toastService.info('Sesión cerrada correctamente', 3000);
    this.authService.logout();
    this.websocketService.disconnect();
    this.router.navigate(['/login']);
  }

  // ==================== TESIS FINALES ====================

  verPDF(rutaPdf: string): void {
    window.open(`${environment.wsUrl}/uploads/tesis_final/${rutaPdf}`, '_blank');
  }

  verResolucion(rutaPdf: string): void {
    window.open(`${environment.wsUrl}/uploads/resoluciones/${rutaPdf}`, '_blank');
  }

  generarResolucion(idProyecto: number): void {
    if (confirm('¿Está seguro de generar la resolución de sustentación?')) {
      this.generandoResolucion[idProyecto] = true;
      
      this.sustentacionService.generarResolucion(idProyecto).subscribe({
        next: (res) => {
          this.toastService.success(`Resolución ${res.numero_resolucion} generada exitosamente`, 4000);
          this.generandoResolucion[idProyecto] = false;
          this.loadData();
        },
        error: (err) => {
          console.error('Error generando resolución', err);
          this.toastService.error(err.error?.message || 'Error al generar resolución', 3000);
          this.generandoResolucion[idProyecto] = false;
        }
      });
    }
  }

  descargarResolucion(idResolucion: number): void {
    window.open(`${environment.apiUrl}/sustentacion/descargar/${idResolucion}`, '_blank');
  }

  // --- Programación Sustentación ---
  
  abrirModalProgramacion(tesis: any): void {
    this.tesisSeleccionadaSustentacion = tesis;
    this.showModalProgramacion = true;
    this.formSustentacion = {
      fecha_hora: '',
      modalidad: 'PRESENCIAL',
      lugar: ''
    };
  }

  cerrarModalProgramacion(): void {
    this.showModalProgramacion = false;
    this.tesisSeleccionadaSustentacion = null;
  }

  programarSustentacion(): void {
    if (!this.formSustentacion.fecha_hora) {
      this.toastService.error('Debe seleccionar fecha y hora', 3000);
      return;
    }

    this.programandoSustentacion = true;

    this.sustentacionService.programarSustentacion(
      this.tesisSeleccionadaSustentacion.id_proyecto,
      this.formSustentacion
    ).subscribe({
      next: () => {
        this.toastService.success('Sustentación programada exitosamente', 4000);
        this.programandoSustentacion = false;
        this.cerrarModalProgramacion();
        this.loadData();
      },
      error: (err) => {
        console.error('Error programando sustentación', err);
        this.toastService.error(err.error?.message || 'Error al programar sustentación', 3000);
        this.programandoSustentacion = false;
      }
    });
  }

  // --- Registro de Resultados ---

  abrirModalResultado(tesis: any): void {
    this.tesisSeleccionadaSustentacion = tesis;
    this.showModalResultado = true;
    this.formResultado = {
      nota: null,
      dictamen: 'APROBADO',
      observaciones: ''
    };
  }

  cerrarModalResultado(): void {
    this.showModalResultado = false;
    this.tesisSeleccionadaSustentacion = null;
  }

  registrarResultado(): void {
    if (!this.formResultado.dictamen) {
      this.toastService.error('Debe seleccionar un dictamen', 3000);
      return;
    }

    this.registrandoResultado = true;

    const payload = {
      ...this.formResultado,
      nota: this.formResultado.nota ? Number(this.formResultado.nota) : null
    };

    this.sustentacionService.registrarResultado(
      this.tesisSeleccionadaSustentacion.id_sustentacion,
      payload
    ).subscribe({
      next: () => {
        this.toastService.success('Resultado registrado exitosamente', 4000);
        this.registrandoResultado = false;
        this.cerrarModalResultado();
        this.loadData();
      },
      error: (err) => {
        console.error('Error registrando resultado', err);
        this.toastService.error(err.error?.message || 'Error al registrar resultado', 3000);
        this.registrandoResultado = false;
      }
    });
  }

  // --- Actas ---

  generarActa(idSustentacion: number): void {
    if (confirm('¿Generar el Acta de Sustentación ahora?')) {
      this.generandoActa[idSustentacion] = true;
      
      this.sustentacionService.generarActa(idSustentacion).subscribe({
        next: (res: any) => {
          this.toastService.success(`Acta N° ${res.numero_acta} generada correctamente`, 4000);
          this.generandoActa[idSustentacion] = false;
          this.loadData();

          if (res.archivo) {
            const url = `${environment.wsUrl}/uploads/actas/${res.archivo}`;
            window.open(url, '_blank');
          }
        },
        error: (err) => {
          console.error('Error generando acta', err);
          this.toastService.error(err.error?.message || 'Error al generar acta', 3000);
          this.generandoActa[idSustentacion] = false;
        }
      });
    }
  }

  descargarActa(idActa: number): void {
    window.open(`${environment.apiUrl}/sustentacion/descargar-acta/${idActa}`, '_blank');
  }


  verActa(rutaActa: string): void {
    window.open(`${environment.wsUrl}/uploads/actas/${rutaActa}`, '_blank');
  }
}
