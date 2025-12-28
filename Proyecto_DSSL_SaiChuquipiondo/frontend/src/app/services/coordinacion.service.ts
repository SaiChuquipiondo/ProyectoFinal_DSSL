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

  validarAsesor(idProyecto: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/proyecto/${idProyecto}/validar-asesor`, data);
  }

  asignarJurados(idProyecto: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/proyecto/${idProyecto}/asignar-jurados`, data);
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
