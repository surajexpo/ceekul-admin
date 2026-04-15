import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { ProgramService } from '../../../core/services/program.service';
import { Program, ProgramStatus, ProgramLevel, CurriculumModule, CurriculumSection, CurriculumTopic } from '../../../models/program.model';

@Component({
  selector: 'app-program-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './program-detail.html',
  styleUrl: './program-detail.scss'
})
export class ProgramDetail implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private programService = inject(ProgramService);
  private destroyRef = inject(DestroyRef);

  program: Program | null = null;
  isLoading = true;
  loadError: string | null = null;
  actionError: string | null = null;

  isDeleting = false;
  showDeleteConfirm = false;

  // Expanded state for curriculum tree
  expandedModules = new Set<string>();
  expandedSections = new Set<string>();

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) return EMPTY;
        this.isLoading = true;
        this.loadError = null;
        this.program = null;
        return this.programService.getProgram(id);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (p) => {
        this.program = p;
        // Auto-expand all modules by default
        (p.modules ?? []).forEach(m => {
          if (m._id) this.expandedModules.add(m._id);
        });
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Failed to load program details.';
        this.isLoading = false;
      }
    });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  goBack(): void { this.router.navigate(['/programs']); }
  editProgram(): void { this.router.navigate(['/programs/edit', this.program?._id]); }

  // ── Status actions ─────────────────────────────────────────────────────────

  publishProgram(): void {
    if (!this.program?._id) return;
    this.programService.updateStatus(this.program._id, 'published').subscribe({
      next: (p) => { this.program = p; this.actionError = null; },
      error: (err) => { this.actionError = err?.error?.message || 'Failed to publish.'; }
    });
  }

  archiveProgram(): void {
    if (!this.program?._id) return;
    this.programService.updateStatus(this.program._id, 'archived').subscribe({
      next: (p) => { this.program = p; this.actionError = null; },
      error: (err) => { this.actionError = err?.error?.message || 'Failed to archive.'; }
    });
  }

  restoreToDraft(): void {
    if (!this.program?._id) return;
    this.programService.updateStatus(this.program._id, 'draft').subscribe({
      next: (p) => { this.program = p; this.actionError = null; },
      error: (err) => { this.actionError = err?.error?.message || 'Failed to restore.'; }
    });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  confirmDelete(): void { this.showDeleteConfirm = true; }
  cancelDelete(): void { this.showDeleteConfirm = false; }

  deleteProgram(): void {
    if (!this.program?._id) return;
    this.isDeleting = true;
    this.programService.deleteProgram(this.program._id).subscribe({
      next: () => this.router.navigate(['/programs']),
      error: (err) => {
        this.actionError = err?.error?.message || 'Failed to delete program.';
        this.isDeleting = false;
        this.showDeleteConfirm = false;
      }
    });
  }

  // ── Curriculum tree expand/collapse ───────────────────────────────────────

  toggleModule(id: string | undefined): void {
    if (!id) return;
    this.expandedModules.has(id) ? this.expandedModules.delete(id) : this.expandedModules.add(id);
  }

  isModuleExpanded(id: string | undefined): boolean {
    return !!id && this.expandedModules.has(id);
  }

  toggleSection(id: string | undefined): void {
    if (!id) return;
    this.expandedSections.has(id) ? this.expandedSections.delete(id) : this.expandedSections.add(id);
  }

  isSectionExpanded(id: string | undefined): boolean {
    return !!id && this.expandedSections.has(id);
  }

  expandAll(): void {
    (this.program?.modules ?? []).forEach(m => {
      if (m._id) { this.expandedModules.add(m._id); }
      (m.sections ?? []).forEach(s => { if (s._id) this.expandedSections.add(s._id); });
    });
  }

  collapseAll(): void {
    this.expandedModules.clear();
    this.expandedSections.clear();
  }

  // ── Computed stats ─────────────────────────────────────────────────────────

  get totalModules(): number { return this.program?.modules?.length ?? 0; }

  get totalSections(): number {
    return (this.program?.modules ?? []).reduce((s, m) => s + (m.sections?.length ?? 0), 0);
  }

  get totalTopics(): number {
    return (this.program?.modules ?? []).reduce((s, m) =>
      s + (m.sections ?? []).reduce((s2, sec) => s2 + (sec.topics?.length ?? 0), 0), 0);
  }

  get totalDuration(): number {
    return (this.program?.modules ?? []).reduce((s, m) =>
      s + (m.sections ?? []).reduce((s2, sec) =>
        s2 + (sec.topics ?? []).reduce((s3, t) => s3 + (t.duration ?? 0), 0), 0), 0);
  }

  getSectionTopicCount(sec: CurriculumSection): number {
    return sec.topics?.length ?? 0;
  }

  // ── Display helpers ────────────────────────────────────────────────────────

  getStatusBadgeClass(status: ProgramStatus | undefined): string {
    switch (status) {
      case 'published': return 'bg-green-600 text-white border-green-600';
      case 'draft':     return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'archived':  return 'bg-amber-100 text-amber-700 border-amber-300';
      default:          return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  }

  getStatusLabel(status: ProgramStatus | undefined): string {
    const map: Record<ProgramStatus, string> = { published: 'Published', draft: 'Draft', archived: 'Archived' };
    return status ? (map[status] ?? status) : 'Unknown';
  }

  getLevelLabel(level: ProgramLevel | undefined): string {
    const map: Record<ProgramLevel, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
    return level ? (map[level] ?? level) : '—';
  }

  getLevelClass(level: ProgramLevel | undefined): string {
    switch (level) {
      case 'beginner':     return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'intermediate': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'advanced':     return 'bg-orange-50 text-orange-700 border-orange-200';
      default:             return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  }

  getTopicTypeIcon(type: string): string {
    const map: Record<string, string> = {
      video: 'play_circle', text: 'article', file: 'attach_file', quiz: 'quiz'
    };
    return map[type] ?? 'topic';
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`;
  }

  getInstructorDisplay(instructor: unknown): string {
    if (!instructor) return '';
    if (typeof instructor === 'object' && instructor !== null && 'name' in instructor) {
      return (instructor as { name: string }).name;
    }
    return String(instructor);
  }
}
