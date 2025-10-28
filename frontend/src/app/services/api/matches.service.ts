import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '@env/environment';

/* =========================
   DTOs / Tipos de intercambio
   ========================= */
export interface ScheduleMatchDto {
  homeTeamId: number;
  awayTeamId: number;
  dateMatch: string;               // ISO UTC
  quarterDurationSeconds: number;  // p.ej. 600
  homeRosterPlayerIds?: number[];
  awayRosterPlayerIds?: number[];
}

export interface MatchListItem {
  id: number;
  dateMatch: string | null; // ISO
  status: string;
  homeTeamId?: number;
  awayTeamId?: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeFouls: number;
  awayFouls: number;
}

export interface PaginatedMatches {
  items: MatchListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StartTimerDto {
  quarterDurationSeconds?: number;
}

export interface ScoreEventItem {
  teamId: number;
  playerId?: number;
  points: number;
  dateRegister?: string; // ISO
}

export interface FoulItem {
  teamId: number;
  playerId?: number;
  dateRegister?: string; // ISO
}

export interface FinishMatchDto {
  homeScore: number;
  awayScore: number;
  homeFouls: number;
  awayFouls: number;
  scoreEvents?: ScoreEventItem[];
  fouls?: FoulItem[];
}

export interface AddScoreDto {
  teamId: number;
  points: 1 | 2 | 3;
}

export interface AdjustScoreDto {
  teamId: number;
  delta: number; // puede ser negativo
}

export interface AddFoulDto {
  teamId: number;
  playerId?: number;
  type?: string;
}

export interface AdjustFoulDto {
  teamId: number;
  delta: number; // +n / -n
}

@Injectable({ providedIn: 'root' })
export class MatchesService {
  private base = environment.matchesApiUrl;

  constructor(private http: HttpClient) {}

  /* -----------------------
     Programación y listados
     ----------------------- */
  programar(dto: ScheduleMatchDto): Observable<MatchListItem> {
    return this.http.post<any>(`${this.base}/programar`, dto).pipe(
      map(resp => this.mapToListItem(resp))
    );
  }

  list(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    teamId?: number;
    fromUtc?: string;
    toUtc?: string;
  }): Observable<PaginatedMatches> {
    const p = new URLSearchParams();
    p.set('page', String(params?.page ?? 1));
    p.set('pageSize', String(params?.pageSize ?? 10));
    if (params?.status) p.set('status', params.status);
    if (params?.teamId) p.set('teamId', String(params.teamId));
    if (params?.fromUtc) p.set('from', params.fromUtc);
    if (params?.toUtc) p.set('to', params.toUtc);

    return this.http.get<any>(`${this.base}/list?${p.toString()}`).pipe(
      map(resp => {
        const rawItems = Array.isArray(resp?.items)
          ? resp.items
          : Array.isArray(resp?.data)
            ? resp.data
            : [];

        return {
          items: rawItems.map((m: any) => this.mapToListItem(m)),
          total: resp?.total ?? resp?.totalCount ?? rawItems.length,
          page: resp?.page ?? 1,
          pageSize: resp?.pageSize ?? rawItems.length,
        } as PaginatedMatches;
      })
    );
  }

  proximos(): Observable<MatchListItem[]> {
    return this.http.get<any>(`${this.base}/proximos`).pipe(
      map(resp => {
        const arr = Array.isArray(resp) ? resp : resp?.data ?? [];
        return (arr ?? []).map((m: any) => this.mapToListItem(m));
      })
    );
  }

  rango(fromUtc: string, toUtc: string): Observable<MatchListItem[]> {
    const p = new URLSearchParams({ from: fromUtc, to: toUtc }).toString();
    return this.http.get<any[]>(`${this.base}/rango?${p}`).pipe(
      map(arr => (arr ?? []).map(m => this.mapToListItem(m)))
    );
  }

  getById(id: number): Observable<MatchListItem> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(
      map(m => this.mapToListItem(m))
    );
  }

  reprogramar(id: number, newDateMatchUtc: string) {
    return this.http.put(`${this.base}/${id}/reprogramar`, { newDateMatchUtc });
  }

  cancel(id: number) {
    return this.http.post(`${this.base}/${id}/cancel`, {});
  }

  suspend(id: number) {
    return this.http.post(`${this.base}/${id}/suspend`, {});
  }

  /* -------------
     Control / Live
     ------------- */

  // Alias conveniente que usa el endpoint existente /timer/start
  start(id: number, dto?: StartTimerDto) {
    return this.http.post(`${this.base}/${id}/timer/start`, dto ?? {});
  }

  startTimer(id: number, dto?: StartTimerDto) {
    return this.http.post(`${this.base}/${id}/timer/start`, dto ?? {});
  }
  pauseTimer(id: number) {
    return this.http.post(`${this.base}/${id}/timer/pause`, {});
  }
  resumeTimer(id: number) {
    return this.http.post(`${this.base}/${id}/timer/resume`, {});
  }
  resetTimer(id: number) {
    return this.http.post(`${this.base}/${id}/timer/reset`, {});
  }

  advanceQuarter(id: number) {
    return this.http.post(`${this.base}/${id}/quarters/advance`, {});
  }
  autoAdvanceQuarter(id: number) {
    return this.http.post(`${this.base}/${id}/quarters/auto-advance`, {});
  }

  /* -------
     Scores
     ------- */
  addScore(id: number, dto: AddScoreDto) {
    return this.http.post(`${this.base}/${id}/score`, dto);
  }
  adjustScore(id: number, dto: AdjustScoreDto) {
    return this.http.post(`${this.base}/${id}/score/adjust`, dto);
  }

  /* ------
     Fouls
     ------ */
  addFoul(id: number, dto: AddFoulDto) {
    return this.http.post(`${this.base}/${id}/fouls`, dto);
  }
  adjustFoul(id: number, dto: AdjustFoulDto) {
    return this.http.post(`${this.base}/${id}/fouls/adjust`, dto);
  }

  /* ---------------
     Finalizar juego
     --------------- */
  finish(id: number, dto: FinishMatchDto) {
    return this.http.post(`${this.base}/${id}/finish`, dto);
  }

  /* ----------------------
     Mapper backend -> UI
     ---------------------- */
  private mapToListItem(m: any): MatchListItem {
    const homeTeam = this.extractTeamName(m.homeTeam) ?? m.homeTeamName ?? m.homeTeam ?? '';
    const awayTeam = this.extractTeamName(m.awayTeam) ?? m.awayTeamName ?? m.awayTeam ?? '';
    const homeTeamId = m.homeTeamId ?? m.homeTeamID ?? m.home_id ?? undefined;
    const awayTeamId = m.awayTeamId ?? m.awayTeamID ?? m.away_id ?? undefined;

    return {
      id: m.id,
      dateMatch: m.dateMatchUtc ?? m.dateMatch ?? null,
      status: m.status ?? '',
      homeTeamId,
      awayTeamId,
      homeTeam: typeof homeTeam === 'string' && homeTeam.trim().length > 0
        ? homeTeam
        : homeTeamId ? `Equipo #${homeTeamId}` : '',
      awayTeam: typeof awayTeam === 'string' && awayTeam.trim().length > 0
        ? awayTeam
        : awayTeamId ? `Equipo #${awayTeamId}` : '',
      homeScore: m.homeScore ?? 0,
      awayScore: m.awayScore ?? 0,
      homeFouls: m.homeFouls ?? 0,
      awayFouls: m.awayFouls ?? 0,
    };
  }

  private extractTeamName(raw: any): string | undefined {
    if (!raw) return undefined;
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object') {
      return raw.name ?? raw.Name ?? raw.title ?? undefined;
    }
    return undefined;
  }
}
