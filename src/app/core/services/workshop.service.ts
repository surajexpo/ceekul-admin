import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Workshop,
  WorkshopApiResponse,
  WorkshopListResponse,
  MyWorkshopsResponse,
  WorkshopSchedule,
  AddSchedulesResponse,
  DeleteScheduleResponse
} from '../../models/workshop.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WorkshopService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/workshops`;

  getWorkshops(params?: { page?: number; limit?: number; status?: string }): Observable<WorkshopListResponse> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', params.page);
    if (params?.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<WorkshopListResponse>(this.baseUrl, { params: httpParams });
  }

  getMyWorkshops(params?: { page?: number; limit?: number; status?: string }): Observable<MyWorkshopsResponse> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', params.page);
    if (params?.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<MyWorkshopsResponse>(`${this.baseUrl}/my`, { params: httpParams });
  }

  getWorkshop(id: string): Observable<Workshop> {
    return this.http
      .get<WorkshopApiResponse>(`${this.baseUrl}/${id}`)
      .pipe(map(r => r.data));
  }

  createWorkshop(workshop: Partial<Workshop>): Observable<Workshop> {
    return this.http
      .post<WorkshopApiResponse>(this.baseUrl, workshop)
      .pipe(map(r => r.data));
  }

  updateWorkshop(id: string, payload: Partial<Workshop>): Observable<Workshop> {
    return this.http
      .put<WorkshopApiResponse>(`${this.baseUrl}/${id}`, payload)
      .pipe(map(r => r.data));
  }

  addSchedules(id: string, schedules: Partial<WorkshopSchedule>[]): Observable<AddSchedulesResponse> {
    return this.http.post<AddSchedulesResponse>(`${this.baseUrl}/${id}/schedules`, { schedules });
  }

  deleteSchedule(workshopId: string, scheduleId: string): Observable<DeleteScheduleResponse> {
    return this.http.delete<DeleteScheduleResponse>(`${this.baseUrl}/${workshopId}/schedules/${scheduleId}`);
  }

  publishWorkshop(id: string): Observable<Workshop> {
    return this.http
      .patch<WorkshopApiResponse>(`${this.baseUrl}/${id}/publish`, {})
      .pipe(map(r => r.data));
  }

  deleteWorkshop(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
