import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notificacion } from '../models/notificacion.interface';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private apiUrl = `${environment.apiUrl}/notificaciones`;
  private noLeidasSubject = new BehaviorSubject<number>(0);
  public noLeidas$ = this.noLeidasSubject.asObservable();

  constructor(private http: HttpClient) {}

  getNotificaciones(soloNoLeidas = false, limit = 50): Observable<any> {
    return this.http.get(`${this.apiUrl}?solo_no_leidas=${soloNoLeidas}&limit=${limit}`);
  }

  contarNoLeidas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/no-leidas/contar`);
  }

  marcarComoLeida(idNotificacion: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idNotificacion}/marcar-leida`, {});
  }

  marcarTodasLeidas(): Observable<any> {
    return this.http.put(`${this.apiUrl}/marcar-todas-leidas`, {});
  }

  updateNoLeidasCount(count: number): void {
    this.noLeidasSubject.next(count);
  }
}
