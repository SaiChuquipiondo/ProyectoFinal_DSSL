import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CoordinacionService {
  private apiUrl = `${environment.apiUrl}/coordinacion`;

  constructor(private http: HttpClient) {}

  // Proyectos
  getProyectosPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/proyectos-pendientes`);
  }

  validarFormato(idProyecto: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/proyecto/${idProyecto}/validar-formato`, data);
  }

  // Obtener detalles completos de un proyecto
  getProyectoDetalles(idProyecto: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/proyecto/detalles/${idProyecto}`);
  }

  // Aprobar formato del proyecto
  aprobarFormato(idProyecto: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/proyecto/revisar-formato/${idProyecto}`, { aprobado: true });
  }

  // Rechazar formato del proyecto con motivo
  rechazarFormato(idProyecto: number, motivo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/proyecto/revisar-formato/${idProyecto}`, { aprobado: false, motivo });
  }

  // Aprobar asesor propuesto
  aprobarAsesor(idProyecto: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/proyecto/validar-asesor/${idProyecto}`, { aprobado: true });
  }

  // Rechazar asesor propuesto
  rechazarAsesor(idProyecto: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/proyecto/validar-asesor/${idProyecto}`, { aprobado: false });
  }

  validarAsesor(idProyecto: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/proyecto/validar-asesor/${idProyecto}`, data);
  }

  asignarJurados(idProyecto: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/proyecto/asignar-jurados/${idProyecto}`, data);
  }

  // Borradores
  getBorradoresPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/borradores-pendientes`);
  }

  revisarFormatoBorrador(idBorrador: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/borrador/${idBorrador}/revisar-formato`, data);
  }

  // Sustentación
  getSustentacionesProgramadas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sustentaciones-programadas`);
  }

  programarSustentacion(idProyecto: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sustentacion/programar/${idProyecto}`, data);
  }

  registrarResultado(idSustentacion: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sustentacion/registrar-resultado/${idSustentacion}`, data);
  }

  generarResolucion(idProyecto: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/sustentacion/generar-resolucion/${idProyecto}`, {});
  }

  generarActa(idSustentacion: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/sustentacion/generar-acta/${idSustentacion}`, {});
  }
}
