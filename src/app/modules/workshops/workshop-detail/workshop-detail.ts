import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { WorkshopService } from '../../../core/services/workshop.service';
import { Workshop, WorkshopStatus } from '../../../models/workshop.model';

@Component({
  selector: 'app-workshop-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workshop-detail.html',
  styleUrl: './workshop-detail.scss'
})
export class WorkshopDetail implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private workshopService = inject(WorkshopService);
  private destroyRef = inject(DestroyRef);

  workshop: Workshop | null = null;
  isLoading = true;
  loadError: string | null = null;
  actionError: string | null = null;
  isDeleting = false;
  isPublishing = false;
  showDeleteConfirm = false;

  scheduleDeleteTargetId: string | null = null;
  isDeletingSchedule = false;

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) return EMPTY;
        this.isLoading = true;
        this.loadError = null;
        this.workshop = null;
        return this.workshopService.getWorkshop(id);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (w) => {
        this.workshop = w;
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Failed to load workshop details.';
        this.isLoading = false;
      }
    });
  }

  editWorkshop(): void {
    this.router.navigate(['/workshops/edit', this.workshop?._id]);
  }

  cloneWorkshop(): void {
    this.router.navigate(['/workshops/new'], { queryParams: { clone: this.workshop?._id } });
  }

  publishWorkshop(): void {
    if (!this.workshop?._id) return;
    this.isPublishing = true;
    this.workshopService.publishWorkshop(this.workshop._id).subscribe({
      next: (updated) => {
        this.workshop = updated;
        this.isPublishing = false;
      },
      error: (err) => {
        this.actionError = err?.error?.message || 'Failed to publish workshop.';
        this.isPublishing = false;
      }
    });
  }

  confirmDelete(): void {
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  deleteWorkshop(): void {
    if (!this.workshop?._id) return;
    this.isDeleting = true;
    this.workshopService.deleteWorkshop(this.workshop._id).subscribe({
      next: () => {
        this.router.navigate(['/workshops']);
      },
      error: (err) => {
        this.actionError = err?.error?.message || 'Failed to delete workshop.';
        this.isDeleting = false;
        this.showDeleteConfirm = false;
      }
    });
  }

  confirmDeleteSchedule(scheduleId: string | undefined): void {
    if (scheduleId) {
      this.scheduleDeleteTargetId = scheduleId;
      this.actionError = null;
    }
  }

  cancelDeleteSchedule(): void {
    this.scheduleDeleteTargetId = null;
  }

  deleteSchedule(): void {
    if (!this.workshop?._id || !this.scheduleDeleteTargetId) return;
    this.isDeletingSchedule = true;
    this.workshopService.deleteSchedule(this.workshop._id, this.scheduleDeleteTargetId).subscribe({
      next: (res) => {
        this.workshop!.schedules = this.workshop!.schedules.filter(
          s => s._id !== this.scheduleDeleteTargetId
        );
        if (this.workshop!.totalRevenuePotential !== undefined) {
          this.workshop!.totalRevenuePotential = res.data.totalRevenuePotential;
        }
        this.scheduleDeleteTargetId = null;
        this.isDeletingSchedule = false;
      },
      error: (err) => {
        this.actionError = err?.error?.message || 'Failed to remove schedule.';
        this.scheduleDeleteTargetId = null;
        this.isDeletingSchedule = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/workshops']);
  }

  getStatusBadgeClass(status: WorkshopStatus | undefined): string {
    switch (status) {
      case 'published': return 'bg-gray-900 text-white border-gray-900';
      case 'active':    return 'bg-green-600 text-white border-green-600';
      case 'ongoing':   return 'bg-blue-600 text-white border-blue-600';
      case 'draft':     return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-200';
      default:          return 'bg-gray-100 text-gray-600 border-gray-200';
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

  getModeLabel(mode: string): string {
    return ({ online: 'Online', hybrid: 'Hybrid' } as Record<string, string>)[mode] ?? mode;
  }

  getStreamModeLabel(mode: string): string {
    return ({ live_broadcast: 'Live Broadcast', interactive_class: 'Interactive Class' } as Record<string, string>)[mode] ?? mode;
  }

  getInstructorName(instructorId: unknown): string {
    if (!instructorId) return '';
    if (typeof instructorId === 'object' && instructorId !== null && 'name' in instructorId) {
      return (instructorId as { name: string }).name;
    }
    return String(instructorId);
  }

  get scheduleCountLabel(): string {
    const n = this.workshop?.schedules?.length ?? 0;
    return `${n} session${n !== 1 ? 's' : ''}`;
  }

  getTotalRevenue(): number {
    return (this.workshop?.schedules ?? []).reduce((sum, s) => sum + (s.fee ?? 0), 0);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
