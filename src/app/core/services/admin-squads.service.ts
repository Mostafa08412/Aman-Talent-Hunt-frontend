import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GuidResult, Result } from '@core/models/common';
import {
  AddSquadMemberRequest,
  AssignSquadLeaderRequest,
  CreateSquadRequest,
  MapSquadDepartmentsRequest,
  SquadListItemDtoIReadOnlyListResult,
  SquadLookupDtoIReadOnlyListResult,
  SquadResponseResult,
  UpdateSquadRequest,
} from '@core/models/admin-squad-model';
import { toHttpParams } from './http-params.util';

@Injectable({ providedIn: 'root' })
export class AdminSquadsService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  getLookup(departmentId?: string): Observable<SquadLookupDtoIReadOnlyListResult> {
    return this.http.get<SquadLookupDtoIReadOnlyListResult>(`${this.base}/api/admin/squads/lookup`, {
      params: toHttpParams({ departmentId }),
    });
  }

  getList(): Observable<SquadListItemDtoIReadOnlyListResult> {
    return this.http.get<SquadListItemDtoIReadOnlyListResult>(`${this.base}/api/admin/squads`);
  }

  create(request: CreateSquadRequest): Observable<GuidResult> {
    return this.http.post<GuidResult>(`${this.base}/api/admin/squads`, request);
  }

  getById(id: string): Observable<SquadResponseResult> {
    return this.http.get<SquadResponseResult>(`${this.base}/api/admin/squads/${id}`);
  }

  update(id: string, request: UpdateSquadRequest): Observable<Result> {
    return this.http.put<Result>(`${this.base}/api/admin/squads/${id}`, request);
  }

  addMember(id: string, request: AddSquadMemberRequest): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/squads/${id}/members`, request);
  }

  removeMember(id: string, employeeId: string): Observable<Result> {
    return this.http.delete<Result>(`${this.base}/api/admin/squads/${id}/members/${employeeId}`);
  }

  assignLeader(id: string, request: AssignSquadLeaderRequest): Observable<Result> {
    return this.http.patch<Result>(`${this.base}/api/admin/squads/${id}/leader`, request);
  }

  mapDepartments(id: string, request: MapSquadDepartmentsRequest): Observable<Result> {
    return this.http.put<Result>(`${this.base}/api/admin/squads/${id}/departments`, request);
  }
}