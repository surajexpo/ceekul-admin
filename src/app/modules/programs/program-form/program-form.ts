import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { firstValueFrom } from 'rxjs';
import { ProgramService } from '../../../core/services/program.service';
import {
  Program, ProgramStatus, ProgramLevel, ProgramVisibility,
  TopicType, CurriculumModule, CurriculumSection, CurriculumTopic
} from '../../../models/program.model';

let _idCounter = 0;
function uid(): string { return `tmp_${++_idCounter}_${Date.now()}`; }

@Component({
  selector: 'app-program-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DragDropModule],
  templateUrl: './program-form.html',
  styleUrl: './program-form.scss'
})
export class ProgramForm implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private programService = inject(ProgramService);
  private destroyRef = inject(DestroyRef);

  // ── Step state ─────────────────────────────────────────────────────────────
  currentStep = 1;
  readonly totalSteps = 4;
  isEditMode = false;
  programId: string | null = null;

  // ── Submit state ───────────────────────────────────────────────────────────
  isSubmitting = false;
  submitError: string | null = null;
  submitSuccess = false;
  loadError: string | null = null;

  // ── Step 1: Basic Info form ────────────────────────────────────────────────
  form!: FormGroup;
  tagInput = '';

  // ── Step 2: Curriculum ─────────────────────────────────────────────────────
  curriculum: CurriculumModule[] = [];
  deletedModuleIds: string[] = [];
  deletedSectionIds: string[] = [];
  deletedTopicIds: string[] = [];

  // ── Step 3: Instructors ────────────────────────────────────────────────────
  instructorIdInput = '';
  instructors: string[] = []; // list of instructor ObjectIds

  // ── Step 4: Settings ───────────────────────────────────────────────────────
  programStatus: ProgramStatus = 'draft';
  programVisibility: ProgramVisibility = 'public';

  setVisibility(v: string): void { this.programVisibility = v as ProgramVisibility; }
  setStatus(s: string): void { this.programStatus = s as ProgramStatus; }

  readonly steps = [
    { label: 'Basic Info',  icon: 'edit_note' },
    { label: 'Curriculum',  icon: 'view_timeline' },
    { label: 'Instructors', icon: 'people' },
    { label: 'Review',      icon: 'preview' }
  ];

  readonly levels: { value: ProgramLevel; label: string }[] = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  readonly topicTypes: { value: TopicType; label: string; icon: string }[] = [
    { value: 'video', label: 'Video', icon: 'play_circle' },
    { value: 'text',  label: 'Text',  icon: 'article' },
    { value: 'file',  label: 'File',  icon: 'attach_file' },
    { value: 'quiz',  label: 'Quiz',  icon: 'quiz' }
  ];

  readonly categories = [
    'Technology', 'Business', 'Design', 'Marketing', 'Science', 'Arts', 'Health', 'Other'
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.initForm();
    this.programId = this.route.snapshot.paramMap.get('id');
    if (this.programId) {
      this.isEditMode = true;
      this.loadProgram(this.programId);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      title:       ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      subtitle:    ['', Validators.maxLength(300)],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category:    [''],
      level:       ['beginner', Validators.required],
      duration:    [null],
      language:    ['English'],
      thumbnail:   [''],
    });
  }

  private loadProgram(id: string): void {
    this.programService.getProgram(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => this.patchForm(p),
        error: () => { this.loadError = 'Failed to load program data.'; }
      });
  }

  private patchForm(p: Program): void {
    this.form.patchValue({
      title: p.title,
      subtitle: p.subtitle ?? '',
      description: p.description,
      category: p.category ?? '',
      level: p.level,
      duration: p.duration ?? null,
      language: p.language ?? 'English',
      thumbnail: p.thumbnail ?? ''
    });

    if (p.tags?.length) this.tagInput = '';

    // Patch curriculum
    this.curriculum = (p.modules ?? []).map(m => ({
      ...m,
      tempId: m._id ?? uid(),
      expanded: true,
      sections: (m.sections ?? []).map(s => ({
        ...s,
        tempId: s._id ?? uid(),
        expanded: true,
        topics: (s.topics ?? []).map(t => ({
          ...t,
          tempId: t._id ?? uid(),
          expanded: false
        }))
      }))
    }));

    // Patch instructors
    if (p.instructors?.length) {
      this.instructors = (p.instructors as string[]).filter(i => typeof i === 'string');
    }

    this.programStatus = p.status;
    this.programVisibility = p.visibility ?? 'public';
  }

  // ── Tags ───────────────────────────────────────────────────────────────────

  get tags(): string[] {
    return this.form.get('title')
      ? (this.tagInput.split(',').map(t => t.trim()).filter(Boolean))
      : [];
  }

  // ── Step navigation ────────────────────────────────────────────────────────

  isStepValid(step: number): boolean {
    if (step === 1) return this.form.get('title')!.valid && this.form.get('description')!.valid;
    return true;
  }

  nextStep(): void {
    if (this.isStepValid(this.currentStep)) {
      this.currentStep = Math.min(this.currentStep + 1, this.totalSteps);
    } else {
      this.form.markAllAsTouched();
    }
  }

  prevStep(): void {
    this.currentStep = Math.max(this.currentStep - 1, 1);
  }

  goToStep(step: number): void {
    if (step < this.currentStep || this.isStepValid(this.currentStep)) {
      this.currentStep = step;
    }
  }

  // ── Curriculum: Module ─────────────────────────────────────────────────────

  addModule(): void {
    this.curriculum.push({
      tempId: uid(),
      title: `Module ${this.curriculum.length + 1}`,
      description: '',
      order: this.curriculum.length + 1,
      sections: [],
      expanded: true
    });
  }

  removeModule(mi: number): void {
    const mod = this.curriculum[mi];
    if (mod._id) this.deletedModuleIds.push(mod._id);
    // also track nested deletions
    mod.sections.forEach(s => {
      if (s._id) this.deletedSectionIds.push(s._id);
      s.topics.forEach(t => { if (t._id) this.deletedTopicIds.push(t._id); });
    });
    this.curriculum.splice(mi, 1);
    this.reindexModules();
  }

  toggleModule(mi: number): void {
    this.curriculum[mi].expanded = !this.curriculum[mi].expanded;
  }

  dropModule(event: CdkDragDrop<CurriculumModule[]>): void {
    moveItemInArray(this.curriculum, event.previousIndex, event.currentIndex);
    this.reindexModules();
  }

  private reindexModules(): void {
    this.curriculum.forEach((m, i) => m.order = i + 1);
  }

  // ── Curriculum: Section ────────────────────────────────────────────────────

  addSection(mi: number): void {
    this.curriculum[mi].sections.push({
      tempId: uid(),
      title: `Section ${this.curriculum[mi].sections.length + 1}`,
      order: this.curriculum[mi].sections.length + 1,
      topics: [],
      expanded: true
    });
  }

  removeSection(mi: number, si: number): void {
    const sec = this.curriculum[mi].sections[si];
    if (sec._id) this.deletedSectionIds.push(sec._id);
    sec.topics.forEach(t => { if (t._id) this.deletedTopicIds.push(t._id); });
    this.curriculum[mi].sections.splice(si, 1);
    this.reindexSections(mi);
  }

  toggleSection(mi: number, si: number): void {
    this.curriculum[mi].sections[si].expanded = !this.curriculum[mi].sections[si].expanded;
  }

  dropSection(event: CdkDragDrop<CurriculumSection[]>, mi: number): void {
    moveItemInArray(this.curriculum[mi].sections, event.previousIndex, event.currentIndex);
    this.reindexSections(mi);
  }

  private reindexSections(mi: number): void {
    this.curriculum[mi].sections.forEach((s, i) => s.order = i + 1);
  }

  // ── Curriculum: Topic ──────────────────────────────────────────────────────

  addTopic(mi: number, si: number): void {
    this.curriculum[mi].sections[si].topics.push({
      tempId: uid(),
      title: `Topic ${this.curriculum[mi].sections[si].topics.length + 1}`,
      type: 'video',
      contentUrl: '',
      description: '',
      duration: 0,
      order: this.curriculum[mi].sections[si].topics.length + 1,
      expanded: false
    });
  }

  removeTopic(mi: number, si: number, ti: number): void {
    const topic = this.curriculum[mi].sections[si].topics[ti];
    if (topic._id) this.deletedTopicIds.push(topic._id);
    this.curriculum[mi].sections[si].topics.splice(ti, 1);
    this.reindexTopics(mi, si);
  }

  toggleTopic(mi: number, si: number, ti: number): void {
    this.curriculum[mi].sections[si].topics[ti].expanded =
      !this.curriculum[mi].sections[si].topics[ti].expanded;
  }

  dropTopic(event: CdkDragDrop<CurriculumTopic[]>, mi: number, si: number): void {
    moveItemInArray(this.curriculum[mi].sections[si].topics, event.previousIndex, event.currentIndex);
    this.reindexTopics(mi, si);
  }

  private reindexTopics(mi: number, si: number): void {
    this.curriculum[mi].sections[si].topics.forEach((t, i) => t.order = i + 1);
  }

  // ── Curriculum: computed ───────────────────────────────────────────────────

  get totalSections(): number {
    return this.curriculum.reduce((s, m) => s + m.sections.length, 0);
  }

  get totalTopics(): number {
    return this.curriculum.reduce((s, m) =>
      s + m.sections.reduce((s2, sec) => s2 + sec.topics.length, 0), 0);
  }

  getTopicTypeIcon(type: TopicType): string {
    return this.topicTypes.find(t => t.value === type)?.icon ?? 'topic';
  }

  // ── Instructors ────────────────────────────────────────────────────────────

  addInstructor(): void {
    const id = this.instructorIdInput.trim();
    if (id && !this.instructors.includes(id)) {
      this.instructors.push(id);
    }
    this.instructorIdInput = '';
  }

  removeInstructor(id: string): void {
    this.instructors = this.instructors.filter(i => i !== id);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  saveAsDraft(): void { this.submit('draft'); }
  publish(): void { this.submit('published'); }

  submit(status: ProgramStatus): void {
    if (!this.form.valid) { this.form.markAllAsTouched(); this.currentStep = 1; return; }
    this.programStatus = status;
    this.isSubmitting = true;
    this.submitError = null;

    if (this.isEditMode && this.programId) {
      this.submitEdit();
    } else {
      this.submitCreate();
    }
  }

  private buildProgramPayload(status?: ProgramStatus): Partial<Program> {
    const raw = this.form.value;
    return {
      title: raw.title,
      subtitle: raw.subtitle || undefined,
      description: raw.description,
      category: raw.category || undefined,
      level: raw.level,
      duration: raw.duration || undefined,
      language: raw.language || 'English',
      thumbnail: raw.thumbnail || undefined,
      tags: this.tagInput ? this.tagInput.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      instructors: this.instructors,
      visibility: this.programVisibility,
      status: status ?? this.programStatus
    };
  }

  private async submitCreate(): Promise<void> {
    try {
      const program = await firstValueFrom(
        this.programService.createProgram(this.buildProgramPayload())
      );
      if (this.curriculum.length > 0) {
        await this.saveCurriculumToApi(program._id!);
      }
      this.onSuccess();
    } catch (err: any) {
      this.onError(err);
    }
  }

  private async submitEdit(): Promise<void> {
    try {
      await firstValueFrom(
        this.programService.updateProgram(this.programId!, this.buildProgramPayload())
      );
      // Delete removed items
      for (const id of this.deletedTopicIds) {
        await firstValueFrom(this.programService.deleteTopic(id));
      }
      for (const id of this.deletedSectionIds) {
        await firstValueFrom(this.programService.deleteSection(id));
      }
      for (const id of this.deletedModuleIds) {
        await firstValueFrom(this.programService.deleteModule(id));
      }
      // Save curriculum changes
      await this.saveCurriculumToApi(this.programId!);
      this.onSuccess();
    } catch (err: any) {
      this.onError(err);
    }
  }

  private async saveCurriculumToApi(programId: string): Promise<void> {
    for (let mi = 0; mi < this.curriculum.length; mi++) {
      const mod = this.curriculum[mi];
      let moduleId = mod._id;

      if (moduleId) {
        await firstValueFrom(this.programService.updateModule(moduleId, {
          title: mod.title, description: mod.description, order: mod.order
        }));
      } else {
        const created = await firstValueFrom(this.programService.createModule({
          programId, title: mod.title, description: mod.description || '', order: mod.order,
          tempId: mod.tempId, sections: [], expanded: false
        }));
        moduleId = created._id!;
      }

      for (let si = 0; si < mod.sections.length; si++) {
        const sec = mod.sections[si];
        let sectionId = sec._id;

        if (sectionId) {
          await firstValueFrom(this.programService.updateSection(sectionId, {
            title: sec.title, order: sec.order
          }));
        } else {
          const created = await firstValueFrom(this.programService.createSection({
            moduleId: moduleId!, title: sec.title, order: sec.order,
            tempId: sec.tempId, topics: [], expanded: false
          }));
          sectionId = created._id!;
        }

        for (let ti = 0; ti < sec.topics.length; ti++) {
          const topic = sec.topics[ti];
          if (topic._id) {
            await firstValueFrom(this.programService.updateTopic(topic._id, {
              title: topic.title, type: topic.type, contentUrl: topic.contentUrl,
              description: topic.description, duration: topic.duration, order: topic.order
            }));
          } else {
            await firstValueFrom(this.programService.createTopic({
              sectionId: sectionId!, title: topic.title, type: topic.type,
              contentUrl: topic.contentUrl || '', description: topic.description || '',
              duration: topic.duration || 0, order: topic.order, tempId: topic.tempId
            }));
          }
        }
      }
    }
  }

  private onSuccess(): void {
    this.submitSuccess = true;
    this.isSubmitting = false;
    setTimeout(() => this.router.navigate(['/programs']), 1500);
  }

  private onError(err: any): void {
    this.submitError = err?.error?.message || 'Failed to save program. Please try again.';
    this.isSubmitting = false;
  }

  cancel(): void { this.router.navigate(['/programs']); }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }
}
