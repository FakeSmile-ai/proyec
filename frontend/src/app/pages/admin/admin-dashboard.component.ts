import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthenticationService } from '@app/services/api/authentication.service';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { MatchesService, MatchListItem } from '@app/services/api/matches.service';
import { TeamService } from '@app/services/api/team.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, ReactiveFormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  private auth = inject(AuthenticationService);
  private router = inject(Router);
  private matchesSvc = inject(MatchesService);
  private teamSvc = inject(TeamService);
  private fb = inject(FormBuilder);

  /** ID de partido por defecto para los accesos rápidos */
  matchId: number | null = null;

  /** Estado del menú de logout */
  logoutOpen = false;

  @ViewChild('logoutWrap') logoutWrap?: ElementRef<HTMLElement>;

  private readonly defaultQuarter = 600;

  readonly scheduleForm = this.fb.group({
    homeTeamId: [null as number | null, Validators.required],
    awayTeamId: [null as number | null, Validators.required],
    dateMatchLocal: ['', Validators.required],
    quarterDurationSeconds: [this.defaultQuarter, [Validators.required, Validators.min(60)]],
  });

  readonly teams = signal<{ id: number; name: string }[]>([]);
  readonly upcoming = signal<MatchListItem[]>([]);
  readonly loadingTeams = signal<boolean>(false);
  readonly loadingUpcoming = signal<boolean>(false);
  readonly scheduling = signal<boolean>(false);

  readonly teamLookup = computed(() => {
    const map = new Map<number, string>();
    for (const team of this.teams()) {
      map.set(team.id, team.name);
    }
    return map;
  });

  /** Alterna el menú de logout */
  toggleLogout(event?: MouseEvent): void {
    event?.stopPropagation();
    this.logoutOpen = !this.logoutOpen;
  }

  /** Cierra el menú si se hace clic fuera del área */
  @HostListener('document:click', ['$event'])
  closeIfClickOutside(event: MouseEvent): void {
    if (!this.logoutOpen || !this.logoutWrap) return;
    if (!this.logoutWrap.nativeElement.contains(event.target as Node)) {
      this.logoutOpen = false;
    }
  }

  /** Cierra sesión y redirige al login */
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  /** Verifica si el usuario es administrador */
  get isAdmin(): boolean {
    try {
      return this.auth.isAdmin();
    } catch {
      return false;
    }
  }

  ngOnInit(): void {
    this.loadTeams();
    this.loadUpcoming();
  }

  get sameTeamsSelected(): boolean {
    const { homeTeamId, awayTeamId } = this.scheduleForm.value;
    return homeTeamId != null && awayTeamId != null && homeTeamId === awayTeamId;
  }

  get scheduleDisabled(): boolean {
    return this.scheduleForm.invalid || this.sameTeamsSelected || this.scheduling();
  }

  programar(): void {
    if (this.scheduleDisabled) return;

    const { homeTeamId, awayTeamId, dateMatchLocal, quarterDurationSeconds } = this.scheduleForm.value;
    const isoDate = this.toUtcIso(dateMatchLocal ?? '');
    if (!isoDate || homeTeamId == null || awayTeamId == null) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Completa todos los campos y elige equipos distintos.'
      });
      return;
    }

    const duration = Math.max(Number(quarterDurationSeconds ?? this.defaultQuarter) || this.defaultQuarter, 60);

    this.scheduling.set(true);
    this.matchesSvc.programar({
      homeTeamId,
      awayTeamId,
      dateMatch: isoDate,
      quarterDurationSeconds: duration
    }).subscribe({
      next: match => {
        this.scheduling.set(false);
        this.scheduleForm.reset({
          homeTeamId: null,
          awayTeamId: null,
          dateMatchLocal: '',
          quarterDurationSeconds: this.defaultQuarter
        });
        if (match?.id) {
          this.matchId = match.id;
        }
        this.loadUpcoming();

        const homeName = this.teamNameById(homeTeamId) ?? this.displayTeamName(match?.homeTeam, homeTeamId);
        const awayName = this.teamNameById(awayTeamId) ?? this.displayTeamName(match?.awayTeam, awayTeamId);

        Swal.fire({
          icon: 'success',
          title: 'Partido programado',
          text: `#${match?.id ?? '—'} · ${homeName} vs ${awayName}`,
          timer: 2600,
          timerProgressBar: true,
          showConfirmButton: false
        });
      },
      error: err => {
        this.scheduling.set(false);
        const message = err?.error?.error ?? err?.error?.message ?? err?.message ?? 'Error desconocido';
        Swal.fire({
          icon: 'error',
          title: 'No se pudo programar',
          text: message
        });
      }
    });
  }

  refreshUpcoming(): void {
    this.loadUpcoming();
  }

  trackMatch = (_: number, item: MatchListItem) => item.id;

  formatLocal(dateIso: string | null): string {
    if (!dateIso) return '—';
    const parsed = new Date(dateIso);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  shortLocal(dateIso: string | null): string {
    if (!dateIso) return '—';
    const parsed = new Date(dateIso);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  displayHome(row: MatchListItem): string {
    return this.displayTeamName(row.homeTeam, row.homeTeamId);
  }

  displayAway(row: MatchListItem): string {
    return this.displayTeamName(row.awayTeam, row.awayTeamId);
  }

  private loadTeams(): void {
    this.loadingTeams.set(true);
    this.teamSvc.getAll().subscribe({
      next: teams => {
        const mapped = (teams ?? []).map(t => ({ id: t.id, name: t.name }));
        this.teams.set(mapped);
      },
      error: err => {
        console.error('teams load error', err);
        this.teams.set([]);
        Swal.fire({
          icon: 'warning',
          title: 'No se pudieron cargar los equipos',
          text: 'Verifica teams-service.'
        });
      },
      complete: () => this.loadingTeams.set(false)
    });
  }

  private loadUpcoming(): void {
    this.loadingUpcoming.set(true);
    this.matchesSvc.proximos().subscribe({
      next: matches => {
        const rows = matches ?? [];
        this.upcoming.set(rows);
        if (!this.matchId && rows.length > 0) {
          this.matchId = rows[0].id;
        }
      },
      error: err => {
        console.error('upcoming load error', err);
        this.upcoming.set([]);
      },
      complete: () => this.loadingUpcoming.set(false)
    });
  }

  private toUtcIso(localValue: string): string | null {
    if (!localValue) return null;
    const parsed = new Date(localValue);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  }

  private teamNameById(id: number | null | undefined): string | undefined {
    if (id == null) return undefined;
    return this.teamLookup().get(id);
  }

  private displayTeamName(name: string | undefined, id?: number | null): string {
    const trimmed = name?.trim();
    if (trimmed) return trimmed;
    if (id != null) {
      const byId = this.teamNameById(id);
      return byId ?? `Equipo #${id}`;
    }
    return '—';
  }
}
