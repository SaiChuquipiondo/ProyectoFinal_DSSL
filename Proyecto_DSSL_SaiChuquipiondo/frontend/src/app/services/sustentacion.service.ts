import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SustentacionService {
  private apiUrl = `${environment.apiUrl}/sustentacion`;

  constructor(private http: HttpClient) {}

  // Listar tesis finales
  listarTesisFinales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tesis-finales`);
  }

  // Generar resolución
  generarResolucion(idProyecto: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/resolucion/${idProyecto}`, {});
  }

  // Descargar resolución
  descargarResolucion(idResolucion: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/descargar/${idResolucion}`, {
      responseType: 'blob'
    });
  }

  // Programar sustentación
  programarSustentacion(idProyecto: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/programar/${idProyecto}`, data);
  }

  // Registrar resultado
  registrarResultado(idSustentacion: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registrar-resultado/${idSustentacion}`, data);
  }

  // Generar acta
  generarActa(idSustentacion: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/generar-acta/${idSustentacion}`, {});
  }
}
