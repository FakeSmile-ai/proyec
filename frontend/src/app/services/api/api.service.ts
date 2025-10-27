import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;
  private matchesBase = environment.matchesApiUrl;
  private teamsBase = environment.teamsApiUrl;

  getMatch(id: number) {
    return this.http.get<any>(`${this.matchesBase}/${id}`);
  }

  //SCORE
  createScore(id: number, body: { teamId: number; points: 1|2|3; playerId?: number }) {
    return this.http.post(`${this.matchesBase}/${id}/score`, body);
  }
  adjustScore(id: number, body: { teamId: number; delta: number }) {
    return this.http.post(`${this.matchesBase}/${id}/score/adjust`, body);
  }

  //FOULS
  addFoul(id: number, body: { teamId: number; playerId?: number; type?: string }) {
    return this.http.post(`${this.matchesBase}/${id}/fouls`, body);
  }
  adjustFoul(id: number, body: { teamId: number; delta: number }) {
    return this.http.post(`${this.matchesBase}/${id}/fouls/adjust`, body);
  }

  //TIMER
  startTimer(id: number, body?: { quarterDurationSeconds?: number }) {
    return this.http.post(`${this.matchesBase}/${id}/timer/start`, body ?? {});
  }
  pauseTimer(id: number)  { return this.http.post(`${this.matchesBase}/${id}/timer/pause`, {}); }
  resumeTimer(id: number) { return this.http.post(`${this.matchesBase}/${id}/timer/resume`, {}); }
  resetTimer(id: number)  { return this.http.post(`${this.matchesBase}/${id}/timer/reset`, {}); }

  // Quarter
  advanceQuarter(id: number) { return this.http.post(`${this.matchesBase}/${id}/quarters/advance`, {}); }
  autoAdvanceQuarter(id: number) { return this.http.post(`${this.matchesBase}/${id}/quarters/auto-advance`, {}); }

  // New game
  newGame(body: { homeName: string; awayName: string; quarterDurationSeconds?: number }) {
    return this.http.post<any>(`${this.matchesBase}/new`, body);
  }
  newGameByTeams(body: { homeTeamId: number; awayTeamId: number; quarterDurationSeconds?: number }) {
    return this.http.post<any>(`${this.matchesBase}/new-by-teams`, body);
  }

  // Teams
  listTeams() {
    return this.http.get<Array<{ id: number; name: string; color?: string; playersCount: number }>>(
      `${this.teamsBase}`
    );
  }
  createTeam(body: { name: string; color?: string; players: { number?: number; name: string }[] }) {
    return this.http.post(this.teamsBase, body);
  }

  getStandings() {
    return this.http.get<Array<{ id: number; name: string; color?: string; wins: number }>>(
      `${this.base}/standings`
    );
  }



}
