import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private base = environment.reportsApiUrl;


  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  downloadStandings(): Observable<Blob> {
    return this.http.get(`${this.base}/standings.pdf`, {
      responseType: 'blob',
      headers: this.authHeaders(),
    });
  }

  downloadTeams(): Observable<Blob> {
    return this.http.get(`${this.base}/teams.pdf`, {
      responseType: 'blob',
      headers: this.authHeaders(),
    });
  }

  downloadPlayersByTeam(teamId: number): Observable<Blob> {
    return this.http.get(`${this.base}/teams/${teamId}/players.pdf`, {
      responseType: 'blob',
      headers: this.authHeaders(),
    });
  }

  downloadMatchesHistory(params: { from?: string; to?: string }): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params.from) httpParams = httpParams.set('from', params.from);
    if (params.to) httpParams = httpParams.set('to', params.to);

    return this.http.get(`${this.base}/matches/history.pdf`, {
      responseType: 'blob',
      params: httpParams,
      headers: this.authHeaders(),
    });
  }

  downloadMatchRoster(matchId: number): Observable<Blob> {
    return this.http.get(`${this.base}/matches/${matchId}/roster.pdf`, {
      responseType: 'blob',
      headers: this.authHeaders(),
    });
  }

  // NUEVOS
  downloadAllPlayers(): Observable<Blob> {
    return this.http.get(`${this.base}/players/all.pdf`, {
      responseType: 'blob',
      headers: this.authHeaders(),
    });
  }

  downloadStatsSummary(): Observable<Blob> {
    return this.http.get(`${this.base}/stats/summary.pdf`, {
      responseType: 'blob',
      headers: this.authHeaders(),
    });
  }
}
