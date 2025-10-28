// src/app/core/services/tournaments.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import {
  TournamentSummary,
  TournamentViewModel,
  UpdateMatchRequest
} from '../../pages/tournaments/tournaments.models';

@Injectable({ providedIn: 'root' })
export class TournamentsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.tournamentsApiUrl;

  listTournaments(): Promise<TournamentSummary[]> {
    return firstValueFrom(
      this.http.get<TournamentSummary[]>(this.base)
    );
  }

  getTournament(id: string): Promise<TournamentViewModel> {
    return firstValueFrom(
      this.http.get<TournamentViewModel>(`${this.base}/${id}`)
    );
  }

  updateMatch(
    tournamentId: string,
    matchId: string,
    payload: UpdateMatchRequest
  ): Promise<TournamentViewModel> {
    return firstValueFrom(
      this.http.patch<TournamentViewModel>(
        `${this.base}/${tournamentId}/matches/${matchId}`,
        payload
      )
    );
  }
}
