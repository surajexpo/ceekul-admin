import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ManagedWorkshop, WorkshopCategory, WorkshopContentState, WorkshopLesson, WorkshopSection
} from './temp-workshops.models';

interface ApiEnvelope<T> { status: boolean; message: string; data: T; }
interface ApiPagination { total: number; page: number; limit: number; totalPages: number; }
interface ApiList<T> { items: T[]; pagination: ApiPagination; }
interface ApiCategory { _id: string; name: string; slug: string; description: string; icon: string; imageUrl: string; active: boolean; }
interface ApiLesson extends Omit<WorkshopLesson, 'id'> { _id: string; order: number; }
interface ApiSection extends Omit<WorkshopSection, 'id' | 'lessons'> { _id: string; order: number; lessons: ApiLesson[]; }
interface ApiWorkshop extends Omit<ManagedWorkshop, 'id' | 'categoryId' | 'sections'> {
  _id: string; categoryId: string | ApiCategory; sections: ApiSection[];
}

type WorkshopPayload = Pick<ManagedWorkshop, 'title' | 'shortDescription' | 'description' | 'thumbnailUrl' | 'categoryId' | 'instructor' | 'deliveryMode' | 'price'>;
type CategoryPayload = Pick<WorkshopCategory, 'name' | 'description' | 'icon' | 'imageUrl'> & { slug?: string };
type SectionPayload = Pick<WorkshopSection, 'title' | 'description'>;
type LessonPayload = Omit<WorkshopLesson, 'id'>;

@Injectable({ providedIn: 'root' })
export class TempWorkshopsService {
  private readonly http = inject(HttpClient);
  private readonly workshopUrl = `${environment.apiBaseUrl}/api/v1/temp-workshops`;
  private readonly categoryUrl = `${environment.apiBaseUrl}/api/v1/temp-workshop-categories`;

  getState(): Observable<WorkshopContentState> {
    return forkJoin({ workshops: this.getWorkshops(), categories: this.getCategories() });
  }

  getWorkshops(): Observable<ManagedWorkshop[]> {
    const params = new HttpParams().set('limit', 100);
    return this.http.get<ApiEnvelope<ApiList<ApiWorkshop>>>(this.workshopUrl, { params }).pipe(
      map(response => response.data.items.map(item => this.mapWorkshop(item)))
    );
  }

  getCategories(): Observable<WorkshopCategory[]> {
    return this.http.get<ApiEnvelope<ApiCategory[]>>(this.categoryUrl).pipe(
      map(response => response.data.map(item => this.mapCategory(item)))
    );
  }

  saveWorkshop(workshop: ManagedWorkshop, isNew = false): Observable<ManagedWorkshop> {
    const payload: WorkshopPayload = {
      title: workshop.title, shortDescription: workshop.shortDescription, description: workshop.description,
      thumbnailUrl: workshop.thumbnailUrl, categoryId: workshop.categoryId, instructor: workshop.instructor,
      deliveryMode: workshop.deliveryMode, price: workshop.price
    };
    const request = isNew
      ? this.http.post<ApiEnvelope<ApiWorkshop>>(this.workshopUrl, payload)
      : this.http.put<ApiEnvelope<ApiWorkshop>>(`${this.workshopUrl}/${workshop.id}`, payload);

    return request.pipe(
      switchMap(response => {
        const saved = response.data;
        if (saved.status === workshop.status) return of(saved);
        return this.http.patch<ApiEnvelope<ApiWorkshop>>(`${this.workshopUrl}/${saved._id}/status`, { status: workshop.status }).pipe(map(result => result.data));
      }),
      map(item => this.mapWorkshop(item))
    );
  }

  updateWorkshopStatus(id: string, status: ManagedWorkshop['status']): Observable<ManagedWorkshop> {
    return this.http.patch<ApiEnvelope<ApiWorkshop>>(`${this.workshopUrl}/${id}/status`, { status }).pipe(
      map(response => this.mapWorkshop(response.data))
    );
  }

  deleteWorkshop(id: string): Observable<void> {
    return this.http.delete<ApiEnvelope<{ deleted: boolean }>>(`${this.workshopUrl}/${id}`).pipe(map(() => undefined));
  }

  saveCategory(category: WorkshopCategory, isNew = false): Observable<WorkshopCategory> {
    const payload: CategoryPayload = {
      name: category.name, description: category.description, icon: category.icon, imageUrl: category.imageUrl
    };
    if (isNew) payload.slug = this.slugify(category.name);
    const request = isNew
      ? this.http.post<ApiEnvelope<ApiCategory>>(this.categoryUrl, payload)
      : this.http.put<ApiEnvelope<ApiCategory>>(`${this.categoryUrl}/${category.id}`, payload);
    return request.pipe(
      switchMap(response => response.data.active === category.active
        ? of(response.data)
        : this.http.patch<ApiEnvelope<ApiCategory>>(`${this.categoryUrl}/${response.data._id}/status`, { active: category.active }).pipe(map(result => result.data))),
      map(item => this.mapCategory(item))
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<ApiEnvelope<{ deleted: boolean }>>(`${this.categoryUrl}/${id}`).pipe(map(() => undefined));
  }

  saveSection(workshopId: string, section: WorkshopSection, isNew: boolean): Observable<WorkshopSection> {
    const payload: SectionPayload = { title: section.title, description: section.description };
    const request = isNew
      ? this.http.post<ApiEnvelope<ApiSection>>(`${this.workshopUrl}/${workshopId}/sections`, payload)
      : this.http.put<ApiEnvelope<ApiSection>>(`${this.workshopUrl}/${workshopId}/sections/${section.id}`, payload);
    return request.pipe(map(response => this.mapSection(response.data)));
  }

  deleteSection(workshopId: string, sectionId: string): Observable<void> {
    return this.http.delete<ApiEnvelope<{ deleted: boolean }>>(`${this.workshopUrl}/${workshopId}/sections/${sectionId}`).pipe(map(() => undefined));
  }

  reorderSections(workshopId: string, ids: string[]): Observable<WorkshopSection[]> {
    return this.http.patch<ApiEnvelope<ApiSection[]>>(`${this.workshopUrl}/${workshopId}/sections/reorder`, { ids }).pipe(
      map(response => response.data.map(item => this.mapSection(item)))
    );
  }

  saveLesson(workshopId: string, sectionId: string, lesson: WorkshopLesson, isNew: boolean): Observable<WorkshopLesson> {
    const { id: _id, ...payload } = lesson;
    const request = isNew
      ? this.http.post<ApiEnvelope<ApiLesson>>(`${this.workshopUrl}/${workshopId}/sections/${sectionId}/lessons`, payload as LessonPayload)
      : this.http.put<ApiEnvelope<ApiLesson>>(`${this.workshopUrl}/${workshopId}/sections/${sectionId}/lessons/${lesson.id}`, payload as LessonPayload);
    return request.pipe(map(response => this.mapLesson(response.data)));
  }

  deleteLesson(workshopId: string, sectionId: string, lessonId: string): Observable<void> {
    return this.http.delete<ApiEnvelope<{ deleted: boolean }>>(`${this.workshopUrl}/${workshopId}/sections/${sectionId}/lessons/${lessonId}`).pipe(map(() => undefined));
  }

  reorderLessons(workshopId: string, sectionId: string, ids: string[]): Observable<WorkshopLesson[]> {
    return this.http.patch<ApiEnvelope<ApiLesson[]>>(`${this.workshopUrl}/${workshopId}/sections/${sectionId}/lessons/reorder`, { ids }).pipe(
      map(response => response.data.map(item => this.mapLesson(item)))
    );
  }

  upload(kind: 'thumbnail' | 'video' | 'pdf', file: File): Observable<string> {
    const body = new FormData(); body.append('file', file);
    return this.http.post<ApiEnvelope<{ url: string }>>(`${this.workshopUrl}/uploads/${kind}`, body).pipe(map(response => response.data.url));
  }

  private mapWorkshop(item: ApiWorkshop): ManagedWorkshop {
    return { ...item, id: item._id, categoryId: typeof item.categoryId === 'string' ? item.categoryId : item.categoryId._id,
      sections: [...(item.sections ?? [])].sort((a, b) => a.order - b.order).map(section => this.mapSection(section)) };
  }
  private mapCategory(item: ApiCategory): WorkshopCategory { return { id: item._id, name: item.name, description: item.description, icon: item.icon, imageUrl: item.imageUrl, active: item.active }; }
  private mapSection(item: ApiSection): WorkshopSection { return { id: item._id, title: item.title, description: item.description, lessons: [...(item.lessons ?? [])].sort((a, b) => a.order - b.order).map(lesson => this.mapLesson(lesson)) }; }
  private mapLesson(item: ApiLesson): WorkshopLesson { return { id: item._id, title: item.title, description: item.description, contentType: item.contentType, durationMinutes: item.durationMinutes, access: item.access, resourceUrl: item.resourceUrl }; }
  private slugify(value: string): string { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
}
