import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProgramService } from '../../core/services/program.service';
import { Program, ProgramStatus, ProgramLevel, ProgramPagination } from '../../models/program.model';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './programs.html',
  styleUrl: './programs.scss'
})
export class Programs implements OnInit {
  private router = inject(Router);
  private programService = inject(ProgramService);
  private destroyRef = inject(DestroyRef);

  programs: Program[] = [];
  filtered: Program[] = [];
  isLoading = true;
  loadError: string | null = null;
  pagination: ProgramPagination = { total: 0, page: 1, limit: 50, totalPages: 0 };

  filterStatus = '';
  filterCategory = '';

  deleteTargetId: string | null = null;
  isDeleting = false;
  deleteError: string | null = null;

  readonly categories = ['Technology', 'Business', 'Design', 'Marketing', 'Science', 'Arts', 'Health', 'Other'];

  ngOnInit(): void {
    this.loadPrograms();
  }

  loadPrograms(): void {
    this.isLoading = true;
    this.loadError = null;
    this.programService.getPrograms({ limit: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.programs = res?.data?.programs ?? [];
          this.pagination = res?.data?.pagination ?? this.pagination;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (err) => {
          this.loadError = err?.error?.message ?? 'Could not load programs. Please try again.';
          this.programs = [];
          this.filtered = [];
          this.isLoading = false;
        }
      });
  }

  applyFilters(): void {
    this.filtered = this.programs.filter(p => {
      const matchStatus = !this.filterStatus || p.status === this.filterStatus;
      const matchCategory = !this.filterCategory || p.category === this.filterCategory;
      return matchStatus && matchCategory;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterStatus = '';
    this.filterCategory = '';
    this.applyFilters();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  createProgram(): void {
    this.router.navigate(['/programs/new']);
  }

  viewProgram(id: string | undefined): void {
    if (id) this.router.navigate(['/programs', id]);
  }

  editProgram(id: string | undefined): void {
    if (id) this.router.navigate(['/programs/edit', id]);
  }

  // ── Status quick-actions ───────────────────────────────────────────────────

  publishProgram(id: string | undefined): void {
    if (!id) return;
    this.programService.updateStatus(id, 'published').subscribe({
      next: (updated) => {
        const idx = this.programs.findIndex(p => p._id === id);
        if (idx !== -1) {
          this.programs[idx] = updated;
          this.applyFilters();
        }
      },
      error: (err) => { this.loadError = err?.error?.message || 'Failed to publish.'; }
    });
  }

  archiveProgram(id: string | undefined): void {
    if (!id) return;
    this.programService.updateStatus(id, 'archived').subscribe({
      next: (updated) => {
        const idx = this.programs.findIndex(p => p._id === id);
        if (idx !== -1) {
          this.programs[idx] = updated;
          this.applyFilters();
        }
      },
      error: (err) => { this.loadError = err?.error?.message || 'Failed to archive.'; }
    });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  confirmDelete(id: string | undefined): void {
    if (id) { this.deleteTargetId = id; this.deleteError = null; }
  }

  cancelDelete(): void {
    this.deleteTargetId = null;
    this.deleteError = null;
  }

  deleteProgram(): void {
    if (!this.deleteTargetId) return;
    this.isDeleting = true;
    this.programService.deleteProgram(this.deleteTargetId).subscribe({
      next: () => {
        this.programs = this.programs.filter(p => p._id !== this.deleteTargetId);
        this.pagination.total = Math.max(0, this.pagination.total - 1);
        this.applyFilters();
        this.deleteTargetId = null;
        this.isDeleting = false;
      },
      error: (err) => {
        this.deleteError = err?.error?.message || 'Failed to delete program.';
        this.isDeleting = false;
      }
    });
  }

  get deleteTargetTitle(): string {
    return this.programs.find(p => p._id === this.deleteTargetId)?.title ?? 'this program';
  }

  // ── Computed stats ─────────────────────────────────────────────────────────

  get publishedCount(): number { return this.programs.filter(p => p.status === 'published').length; }
  get draftCount(): number { return this.programs.filter(p => p.status === 'draft').length; }
  get archivedCount(): number { return this.programs.filter(p => p.status === 'archived').length; }

  // ── Display helpers ────────────────────────────────────────────────────────

  getStatusBadgeClass(status: ProgramStatus | undefined): string {
    switch (status) {
      case 'published': return 'bg-green-50 text-green-700 border border-green-200';
      case 'draft':     return 'bg-gray-100 text-gray-600 border border-gray-200';
      case 'archived':  return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:          return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  }

  getStatusLabel(status: ProgramStatus | undefined): string {
    const labels: Record<ProgramStatus, string> = {
      published: 'Published', draft: 'Draft', archived: 'Archived'
    };
    return status ? (labels[status] ?? status) : 'Unknown';
  }

  getLevelBadgeClass(level: ProgramLevel | undefined): string {
    switch (level) {
      case 'beginner':     return 'bg-blue-50 text-blue-600';
      case 'intermediate': return 'bg-purple-50 text-purple-600';
      case 'advanced':     return 'bg-orange-50 text-orange-600';
      default:             return 'bg-gray-50 text-gray-500';
    }
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getModuleCount(program: Program): number {
    return program.modules?.length ?? 0;
  }

  getTotalTopics(program: Program): number {
    return (program.modules ?? []).reduce((sum, m) =>
      sum + (m.sections ?? []).reduce((s2, sec) => s2 + (sec.topics?.length ?? 0), 0), 0
    );
  }
}
