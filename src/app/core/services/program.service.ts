import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Program,
  ProgramApiResponse,
  ProgramListApiResponse,
  CurriculumModule,
  ModuleApiResponse,
  CurriculumSection,
  SectionApiResponse,
  CurriculumTopic,
  TopicApiResponse,
  ProgramEnrollment,
  EnrollmentApiResponse,
  EnrollmentListApiResponse
} from '../../models/program.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProgramService {
  private readonly http = inject(HttpClient);
  private readonly adminUrl = `${environment.apiBaseUrl}/api/admin`;
  private readonly enrollUrl = `${environment.apiBaseUrl}/api`;

  // ── Programs ─────────────────────────────────────────────────────────────

  getPrograms(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
  }): Observable<ProgramListApiResponse> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', params.page);
    if (params?.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.category) httpParams = httpParams.set('category', params.category);
    return this.http.get<ProgramListApiResponse>(`${this.adminUrl}/programs`, { params: httpParams });
  }

  getProgram(id: string): Observable<Program> {
    return this.http
      .get<ProgramApiResponse>(`${this.adminUrl}/program/${id}`)
      .pipe(map(r => r.data));
  }

  createProgram(payload: Partial<Program>): Observable<Program> {
    return this.http
      .post<ProgramApiResponse>(`${this.adminUrl}/program`, payload)
      .pipe(map(r => r.data));
  }

  updateProgram(id: string, payload: Partial<Program>): Observable<Program> {
    return this.http
      .put<ProgramApiResponse>(`${this.adminUrl}/program/${id}`, payload)
      .pipe(map(r => r.data));
  }

  updateStatus(id: string, status: string): Observable<Program> {
    return this.http
      .patch<ProgramApiResponse>(`${this.adminUrl}/program/${id}/status`, { status })
      .pipe(map(r => r.data));
  }

  deleteProgram(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/program/${id}`);
  }

  // ── Modules ───────────────────────────────────────────────────────────────

  createModule(payload: Partial<CurriculumModule> & { programId: string }): Observable<CurriculumModule> {
    return this.http
      .post<ModuleApiResponse>(`${this.adminUrl}/module`, payload)
      .pipe(map(r => r.data));
  }

  updateModule(id: string, payload: Partial<CurriculumModule>): Observable<CurriculumModule> {
    return this.http
      .put<ModuleApiResponse>(`${this.adminUrl}/module/${id}`, payload)
      .pipe(map(r => r.data));
  }

  deleteModule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/module/${id}`);
  }

  // ── Sections ──────────────────────────────────────────────────────────────

  createSection(payload: Partial<CurriculumSection> & { moduleId: string }): Observable<CurriculumSection> {
    return this.http
      .post<SectionApiResponse>(`${this.adminUrl}/section`, payload)
      .pipe(map(r => r.data));
  }

  updateSection(id: string, payload: Partial<CurriculumSection>): Observable<CurriculumSection> {
    return this.http
      .put<SectionApiResponse>(`${this.adminUrl}/section/${id}`, payload)
      .pipe(map(r => r.data));
  }

  deleteSection(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/section/${id}`);
  }

  // ── Topics ────────────────────────────────────────────────────────────────

  createTopic(payload: Partial<CurriculumTopic> & { sectionId: string }): Observable<CurriculumTopic> {
    return this.http
      .post<TopicApiResponse>(`${this.adminUrl}/topic`, payload)
      .pipe(map(r => r.data));
  }

  updateTopic(id: string, payload: Partial<CurriculumTopic>): Observable<CurriculumTopic> {
    return this.http
      .put<TopicApiResponse>(`${this.adminUrl}/topic/${id}`, payload)
      .pipe(map(r => r.data));
  }

  deleteTopic(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/topic/${id}`);
  }

  // ── Enrollments ───────────────────────────────────────────────────────────

  enrollStudent(programId: string, studentId: string): Observable<ProgramEnrollment> {
    return this.http
      .post<EnrollmentApiResponse>(`${this.enrollUrl}/enroll/program`, { programId, studentId })
      .pipe(map(r => r.data));
  }

  getEnrollments(studentId?: string): Observable<ProgramEnrollment[]> {
    let httpParams = new HttpParams();
    if (studentId) httpParams = httpParams.set('studentId', studentId);
    return this.http
      .get<EnrollmentListApiResponse>(`${this.enrollUrl}/enrollments`, { params: httpParams })
      .pipe(map(r => r.data));
  }
}
