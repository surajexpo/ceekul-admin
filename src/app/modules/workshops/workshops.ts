import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { WorkshopService } from '../../core/services/workshop.service';
import { Workshop, WorkshopStatus, WorkshopPagination } from '../../models/workshop.model';

@Component({
  selector: 'app-workshops',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workshops.html',
  styleUrl: './workshops.scss'
})
export class Workshops implements OnInit {
  private router = inject(Router);
  private workshopService = inject(WorkshopService);
  private cdr = inject(ChangeDetectorRef);

  workshops: Workshop[] = [];
  isLoading = true;
  loadError: string | null = null;
  pagination: WorkshopPagination = { total: 0, page: 1, limit: 10, totalPages: 0 };

  deleteTargetId: string | null = null;
  isDeleting = false;
  deleteError: string | null = null;

  get liveCount(): number {
    return this.workshops.filter(w => w.status === 'published').length;
  }

  get cancelledCount(): number {
    return this.workshops.filter(w => w.status === 'cancelled').length;
  }

  get draftCount(): number {
    return this.workshops.filter(w => w.status === 'draft').length;
  }

  ngOnInit(): void {
    this.loadWorkshops();
  }

  loadWorkshops(): void {
    this.isLoading = true;
    this.loadError = null;
    this.workshopService.getMyWorkshops({ limit: 50 }).pipe(
      tap(res => console.log('[Workshops] raw response:', res))
    ).subscribe({
      next: (res) => {
        this.workshops = res?.data?.workshops ?? [];
        this.pagination = res?.data?.pagination ?? this.pagination;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Workshops] load error:', err);
        this.loadError = err?.error?.message ?? 'Could not load workshops. Please try again.';
        this.workshops = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  createWorkshop(): void {
    this.router.navigate(['/workshops/new']);
  }

  viewWorkshop(id: string | undefined): void {
    console.log('Viewing workshop with ID:', id);
    if (id) this.router.navigate(['/workshops', id]);
  }

  editWorkshop(id: string | undefined): void {
    if (id) this.router.navigate(['/workshops/edit', id]);
  }

  cloneWorkshop(id: string | undefined): void {
    if (id) this.router.navigate(['/workshops/new'], { queryParams: { clone: id } });
  }

  publishWorkshop(id: string | undefined): void {
    if (id) this.workshopService.publishWorkshop(id).subscribe({
      next: (updated) => {
        const idx = this.workshops.findIndex(w => w._id === id);
        if (idx !== -1) this.workshops[idx] = updated;
      }
    });
  }

  confirmDelete(id: string | undefined): void {
    if (id) {
      this.deleteTargetId = id;
      this.deleteError = null;
    }
  }

  cancelDelete(): void {
    this.deleteTargetId = null;
    this.deleteError = null;
  }

  deleteWorkshop(): void {
    if (!this.deleteTargetId) return;
    this.isDeleting = true;
    this.workshopService.deleteWorkshop(this.deleteTargetId).subscribe({
      next: () => {
        this.workshops = this.workshops.filter(w => w._id !== this.deleteTargetId);
        this.pagination.total = Math.max(0, this.pagination.total - 1);
        this.deleteTargetId = null;
        this.isDeleting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deleteError = err?.error?.message || 'Failed to delete workshop. Please try again.';
        this.isDeleting = false;
        this.cdr.detectChanges();
      }
    });
  }

  get deleteTargetTitle(): string {
    return this.workshops.find(w => w._id === this.deleteTargetId)?.workshopTitle ?? 'this workshop';
  }

  getStatusBadgeClass(status: WorkshopStatus | undefined): string {
    switch (status) {
      case 'published': return 'bg-green-50 text-green-700 border border-green-200';
      case 'draft':     return 'bg-gray-100 text-gray-600 border border-gray-200';
      case 'cancelled': return 'bg-red-50 text-red-600 border border-red-200';
      default:          return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusLabel(status: WorkshopStatus | undefined): string {
    if (!status) return 'Unknown';
    const labels: Record<WorkshopStatus, string> = {
      published: 'Published',
      draft: 'Draft',
      cancelled: 'Cancelled',
      active: 'Active',
      ongoing: 'Ongoing'
    };
    return labels[status] ?? status;
  }

  isLive(status: WorkshopStatus | undefined): boolean {
    return status === 'published';
  }

  getTotalRevenue(workshop: Workshop): number {
    return (workshop.schedules ?? []).reduce((sum, s) => sum + (s.fee ?? 0), 0);
  }

  formatRevenue(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

}
