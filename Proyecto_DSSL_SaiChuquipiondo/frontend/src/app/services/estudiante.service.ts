import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Proyecto } from '../models/proyecto.interface';

@Injectable({
  providedIn: 'root'
})
export class EstudianteService {
  private apiUrl = `${environment.apiUrl}/estudiante`;

  constructor(private http: HttpClient) {}

  // Proyectos
  subirProyecto(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/proyecto/subir`, formData);
  }

  getMisProyectos(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${this.apiUrl}/mis-proyectos`);
  }

  elegirAsesor(idProyecto: number, idAsesor: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/proyecto/${idProyecto}/elegir-asesor`, {
      id_asesor: idAsesor
    });
  }

  // Borradores
  subirBorrador(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/borrador/subir`, formData);
  }

  corregirBorrador(idBorrador: number, formData: FormData): Observable<any> {
    return this.http.patch(`${this.apiUrl}/borrador/${idBorrador}/corregir`, formData);
  }

  getMisBorradores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mis-borradores`);
  }

  // Tesis Final
  subirTesisFinal(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/tesis-final`, formData);
  }

  obtenerMiTesisFinal(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tesis-final`);
  }

  // Resoluciones
  getMisResoluciones(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mis-resoluciones`);
  }

  // Acta
  getMiActa(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mi-acta`);
  }
}
