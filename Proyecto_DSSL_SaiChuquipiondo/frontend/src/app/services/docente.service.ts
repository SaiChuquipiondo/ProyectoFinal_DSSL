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
    return this.http.get<any[]>(`${this.apiUrl}/asesor/pendientes`);
  }

  revisarProyectoAsesor(idProyecto: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/asesor/proyecto/revisar/${idProyecto}`, data);
  }

  getBorradoresPendientesAsesor(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/asesor/borrador/pendientes`);
  }

  revisarBorradorAsesor(idBorrador: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/asesor/borrador/revisar/${idBorrador}`, data);
  }

  // Como Jurado
  getProyectosPendientesJurado(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/jurados/pendientes`);
  }

  revisarProyectoJurado(idProyecto: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/jurados/proyecto/revisar/${idProyecto}`, data);
  }

  getBorradoresPendientesJurado(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/jurados/borrador/pendientes`);
  }

  revisarBorradorJurado(idBorrador: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/jurados/borrador/revisar/${idBorrador}`, data);
  }
}
