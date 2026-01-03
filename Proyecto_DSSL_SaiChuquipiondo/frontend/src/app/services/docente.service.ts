import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocenteService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Como Asesor
  getProyectosPendientesAsesor(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/asesor/proyectos-pendientes`);
  }

  revisarProyectoAsesor(idProyecto: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/asesor/proyecto/${idProyecto}/revisar`, data);
  }

  getBorradoresPendientesAsesor(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/asesor/borradores-pendientes`);
  }

  revisarBorradorAsesor(idBorrador: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/asesor/borrador/${idBorrador}/revisar`, data);
  }

  // Como Jurado
  getProyectosPendientesJurado(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/jurados/proyectos-pendientes`);
  }

  revisarProyectoJurado(idProyecto: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/jurados/proyecto/${idProyecto}/revisar`, data);
  }

  getBorradoresPendientesJurado(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/jurados/borradores-pendientes`);
  }

  revisarBorradorJurado(idBorrador: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/jurados/borrador/${idBorrador}/revisar`, data);
  }
}
