import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ConfirmationTarget, LessonAccess, LessonContentType, ManagedWorkshop,
  WorkshopCategory, WorkshopContentStatus, WorkshopDeliveryMode, WorkshopLesson, WorkshopSection
} from './temp-workshops.models';
import { TempWorkshopsService } from './temp-workshops.service';

type ActiveTab = 'workshops' | 'categories' | 'content';

@Component({
  selector: 'app-temp-workshops',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './temp-workshops.html',
  styleUrl: './temp-workshops.scss'
})
export class TempWorkshops implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dataService = inject(TempWorkshopsService);
  private readonly cdr = inject(ChangeDetectorRef);

  activeTab: ActiveTab = 'workshops';
  workshops: ManagedWorkshop[] = [];
  categories: WorkshopCategory[] = [];
  selectedWorkshopId = '';
  expandedSections = new Set<string>();
  isLoading = true;
  isSaving = false;
  loadError = '';
  feedback = '';
  saveError = '';
  confirmation: ConfirmationTarget | null = null;
  showWorkshopForm = false;
  showCategoryForm = false;
  showSectionForm = false;
  showLessonForm = false;
  editingWorkshopId = '';
  editingCategoryId = '';
  editingSectionId = '';
  editingLessonId = '';
  lessonSectionId = '';

  readonly contentTypes: { value: LessonContentType; label: string; icon: string }[] = [
    { value: 'video', label: 'Video', icon: 'play_circle' }, { value: 'article', label: 'Article', icon: 'article' },
    { value: 'pdf', label: 'PDF', icon: 'picture_as_pdf' }, { value: 'live_session', label: 'Live session', icon: 'live_tv' },
    { value: 'quiz', label: 'Quiz', icon: 'quiz' }, { value: 'external_link', label: 'External link', icon: 'link' }
  ];

  workshopForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    shortDescription: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(180)]],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
    thumbnailUrl: ['', Validators.pattern(/^$|https?:\/\/.+/i)], categoryId: ['', Validators.required],
    instructor: ['', [Validators.required, Validators.minLength(2)]], deliveryMode: ['online' as WorkshopDeliveryMode, Validators.required],
    price: [0, [Validators.required, Validators.min(0)]], status: ['draft' as WorkshopContentStatus, Validators.required]
  });

  categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    description: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(240)]],
    icon: ['category', Validators.required], imageUrl: ['', Validators.pattern(/^$|https?:\/\/.+/i)], active: [true]
  });

  sectionForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(300)]]
  });

  lessonForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(500)]],
    contentType: ['video' as LessonContentType, Validators.required],
    durationMinutes: [15, [Validators.required, Validators.min(1), Validators.max(1440)]],
    access: ['enrolled' as LessonAccess, Validators.required], resourceUrl: ['', Validators.pattern(/^$|https?:\/\/.+/i)]
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.loadError = '';
    this.dataService.getState().subscribe({
      next: state => {
        this.workshops = state.workshops; this.categories = state.categories;
        this.selectedWorkshopId = this.workshops[0]?.id ?? ''; this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loadError = this.apiError(error, 'Could not load workshop content. Please try again.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get selectedWorkshop(): ManagedWorkshop | undefined { return this.workshops.find(item => item.id === this.selectedWorkshopId); }
  get activeCategories(): WorkshopCategory[] { return this.categories.filter(item => item.active || item.id === this.workshopForm.controls.categoryId.value); }
  get totalLessons(): number { return this.selectedWorkshop?.sections.reduce((total, section) => total + section.lessons.length, 0) ?? 0; }
  get totalDuration(): number { return this.selectedWorkshop?.sections.reduce((total, section) => total + section.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0), 0) ?? 0; }
  get selectedContentType(): LessonContentType { return this.lessonForm.controls.contentType.value; }

  setTab(tab: ActiveTab): void { this.activeTab = tab; this.closeForms(); }
  categoryName(id: string): string { return this.categories.find(item => item.id === id)?.name ?? 'Uncategorized'; }
  statusCount(status: WorkshopContentStatus): number { return this.workshops.filter(item => item.status === status).length; }
  categoryWorkshopCount(categoryId: string): number { return this.workshops.filter(item => item.categoryId === categoryId).length; }
  contentTypeLabel(type: LessonContentType): string { return this.contentTypes.find(item => item.value === type)?.label ?? type; }
  contentTypeIcon(type: LessonContentType): string { return this.contentTypes.find(item => item.value === type)?.icon ?? 'description'; }
  controlInvalid(control: AbstractControl): boolean { return control.invalid && (control.touched || control.dirty); }
  createId(prefix: string): string { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
  selectWorkshop(id: string): void { this.selectedWorkshopId = id; this.closeForms(); }
  toggleSection(id: string): void { this.expandedSections.has(id) ? this.expandedSections.delete(id) : this.expandedSections.add(id); }

  openWorkshop(workshop?: ManagedWorkshop): void {
    this.closeForms(); this.saveError = ''; this.showWorkshopForm = true; this.editingWorkshopId = workshop?.id ?? '';
    if (workshop) this.workshopForm.patchValue(workshop); else this.workshopForm.reset({ deliveryMode: 'online', price: 0, status: 'draft', categoryId: this.activeCategories[0]?.id ?? '' });
  }

  saveWorkshop(): void {
    if (this.workshopForm.invalid) { this.workshopForm.markAllAsTouched(); return; }
    const existing = this.workshops.find(item => item.id === this.editingWorkshopId);
    const publishError = this.workshopForm.controls.status.value === 'published'
      ? this.publicationError(existing)
      : '';
    if (publishError) {
      this.saveError = publishError;
      this.cdr.detectChanges();
      return;
    }
    const workshop: ManagedWorkshop = { id: existing?.id ?? '', ...this.workshopForm.getRawValue(), sections: existing?.sections ?? [], updatedAt: existing?.updatedAt ?? new Date().toISOString() };
    this.isSaving = true;
    const request = existing && this.workshopMetadataUnchanged(existing, workshop)
      ? this.dataService.updateWorkshopStatus(existing.id, workshop.status)
      : this.dataService.saveWorkshop(workshop, !existing);
    request.subscribe({ next: saved => {
      const index = this.workshops.findIndex(item => item.id === saved.id);
      if (index === -1) this.workshops.unshift(saved); else this.workshops[index] = saved;
      this.selectedWorkshopId = saved.id; this.completeSave('Workshop saved successfully.');
    }, error: (error) => { this.handleSaveError(error, 'Could not save the workshop.'); } });
  }

  openCategory(category?: WorkshopCategory): void {
    this.closeForms(); this.saveError = ''; this.showCategoryForm = true; this.editingCategoryId = category?.id ?? '';
    if (category) this.categoryForm.patchValue(category); else this.categoryForm.reset({ icon: 'category', active: true, imageUrl: '' });
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) { this.categoryForm.markAllAsTouched(); return; }
    const category: WorkshopCategory = { id: this.editingCategoryId, ...this.categoryForm.getRawValue() };
    this.isSaving = true;
    this.dataService.saveCategory(category, !this.editingCategoryId).subscribe({ next: saved => {
      const index = this.categories.findIndex(item => item.id === saved.id);
      if (index === -1) this.categories.unshift(saved); else this.categories[index] = saved;
      this.completeSave('Category saved successfully.');
    }, error: (error) => { this.handleSaveError(error, 'Could not save the category.'); } });
  }

  openSection(section?: WorkshopSection): void {
    this.closeForms(); this.saveError = ''; this.showSectionForm = true; this.editingSectionId = section?.id ?? '';
    section ? this.sectionForm.patchValue(section) : this.sectionForm.reset();
  }

  saveSection(): void {
    const workshop = this.selectedWorkshop;
    if (!workshop || this.sectionForm.invalid) { this.sectionForm.markAllAsTouched(); return; }
    const existing = workshop.sections.find(item => item.id === this.editingSectionId);
    const section: WorkshopSection = { id: existing?.id ?? '', ...this.sectionForm.getRawValue(), lessons: existing?.lessons ?? [] };
    this.isSaving = true;
    this.dataService.saveSection(workshop.id, section, !existing).subscribe({ next: saved => {
      const index = workshop.sections.findIndex(item => item.id === saved.id);
      if (index === -1) workshop.sections.push(saved); else workshop.sections[index] = saved;
      this.expandedSections.add(saved.id); this.completeSave('Section saved successfully.');
    }, error: (error) => { this.handleSaveError(error, 'Could not save the section.'); } });
  }

  openLesson(sectionId: string, lesson?: WorkshopLesson): void {
    this.closeForms(); this.saveError = ''; this.showLessonForm = true; this.lessonSectionId = sectionId; this.editingLessonId = lesson?.id ?? '';
    lesson ? this.lessonForm.patchValue(lesson) : this.lessonForm.reset({ contentType: 'video', durationMinutes: 15, access: 'enrolled', resourceUrl: '' });
  }

  saveLesson(): void {
    const workshop = this.selectedWorkshop; const section = workshop?.sections.find(item => item.id === this.lessonSectionId);
    if (!workshop || !section || this.lessonForm.invalid) { this.lessonForm.markAllAsTouched(); return; }
    const existing = section.lessons.find(item => item.id === this.editingLessonId);
    const lesson: WorkshopLesson = { id: existing?.id ?? '', ...this.lessonForm.getRawValue() };
    this.isSaving = true;
    this.dataService.saveLesson(workshop.id, section.id, lesson, !existing).subscribe({ next: saved => {
      const index = section.lessons.findIndex(item => item.id === saved.id);
      if (index === -1) section.lessons.push(saved); else section.lessons[index] = saved;
      this.completeSave('Lesson saved successfully.');
    }, error: (error) => { this.handleSaveError(error, 'Could not save the lesson.'); } });
  }

  dropSection(event: CdkDragDrop<WorkshopSection[]>): void {
    const workshop = this.selectedWorkshop; if (!workshop) return;
    moveItemInArray(workshop.sections, event.previousIndex, event.currentIndex);
    this.dataService.reorderSections(workshop.id, workshop.sections.map(item => item.id)).subscribe({
      next: sections => { workshop.sections = sections; this.notify('Section order updated.'); },
      error: (error) => { moveItemInArray(workshop.sections, event.currentIndex, event.previousIndex); this.notify(this.apiError(error, 'Could not reorder sections.')); }
    });
  }

  dropLesson(event: CdkDragDrop<WorkshopLesson[]>, section: WorkshopSection): void {
    const workshop = this.selectedWorkshop; if (!workshop) return;
    moveItemInArray(section.lessons, event.previousIndex, event.currentIndex);
    this.dataService.reorderLessons(workshop.id, section.id, section.lessons.map(item => item.id)).subscribe({
      next: lessons => { section.lessons = lessons; this.notify('Lesson order updated.'); },
      error: (error) => { moveItemInArray(section.lessons, event.currentIndex, event.previousIndex); this.notify(this.apiError(error, 'Could not reorder lessons.')); }
    });
  }

  requestDelete(target: ConfirmationTarget): void { this.confirmation = target; }
  cancelDelete(): void { this.confirmation = null; }
  confirmDelete(): void {
    const target = this.confirmation; if (!target) return;
    if (target.kind === 'workshop') {
      this.dataService.deleteWorkshop(target.workshopId).subscribe({ next: () => {
        this.workshops = this.workshops.filter(item => item.id !== target.workshopId);
        this.selectedWorkshopId = this.workshops[0]?.id ?? ''; this.notify('Workshop deleted.');
      }, error: (error) => this.notify(this.apiError(error, 'Could not delete the workshop.')) });
    } else if (target.kind === 'category') {
      this.dataService.deleteCategory(target.categoryId).subscribe({ next: () => { this.categories = this.categories.filter(item => item.id !== target.categoryId); this.notify('Category deleted.'); }, error: (error) => this.notify(this.apiError(error, 'Could not delete the category.')) });
    } else {
      const workshop = this.workshops.find(item => item.id === target.workshopId); if (!workshop) return;
      if (target.kind === 'section') this.dataService.deleteSection(workshop.id, target.sectionId).subscribe({ next: () => { workshop.sections = workshop.sections.filter(item => item.id !== target.sectionId); this.notify('Section deleted.'); }, error: (error) => this.notify(this.apiError(error, 'Could not delete the section.')) });
      else this.dataService.deleteLesson(workshop.id, target.sectionId, target.lessonId).subscribe({ next: () => { const section = workshop.sections.find(item => item.id === target.sectionId); if (section) section.lessons = section.lessons.filter(item => item.id !== target.lessonId); this.notify('Lesson deleted.'); }, error: (error) => this.notify(this.apiError(error, 'Could not delete the lesson.')) });
    }
    this.confirmation = null;
  }

  canDeleteCategory(category: WorkshopCategory): boolean { return !this.workshops.some(item => item.categoryId === category.id); }
  closeForms(): void {
    this.showWorkshopForm = false;
    this.showCategoryForm = false;
    this.showSectionForm = false;
    this.showLessonForm = false;
  }
  private completeSave(message: string): void {
    this.isSaving = false;
    this.saveError = '';
    this.closeForms();
    this.confirmation = null;
    this.editingWorkshopId = '';
    this.editingCategoryId = '';
    this.editingSectionId = '';
    this.editingLessonId = '';
    this.lessonSectionId = '';
    this.cdr.detectChanges();
    this.notify(message);
  }
  private apiError(error: unknown, fallback: string): string {
    const response = error as { status?: number; error?: { message?: string; errors?: { message?: string }[] } };
    if (response.status === 0) return 'Cannot connect to the API at localhost:1003. Start the backend and try again.';
    if (response.status === 401 || response.status === 403) return 'Your admin session is invalid or expired. Sign in again and retry.';
    return response.error?.errors?.[0]?.message ?? response.error?.message ?? fallback;
  }
  private handleSaveError(error: unknown, fallback: string): void {
    this.isSaving = false;
    this.saveError = this.apiError(error, fallback);
    this.cdr.detectChanges();
  }
  private publicationError(workshop?: ManagedWorkshop): string {
    const category = this.categories.find(item => item.id === this.workshopForm.controls.categoryId.value);
    if (!category?.active) return 'Choose an active category before publishing this workshop.';
    if (!workshop?.sections.length) return 'Add at least one section before publishing this workshop.';
    if (!workshop.sections.some(section => section.lessons.length)) return 'Add at least one lesson before publishing this workshop.';
    return '';
  }
  private workshopMetadataUnchanged(before: ManagedWorkshop, after: ManagedWorkshop): boolean {
    return before.title === after.title
      && before.shortDescription === after.shortDescription
      && before.description === after.description
      && before.thumbnailUrl === after.thumbnailUrl
      && before.categoryId === after.categoryId
      && before.instructor === after.instructor
      && before.deliveryMode === after.deliveryMode
      && before.price === after.price;
  }
  private notify(message: string): void { this.feedback = message; setTimeout(() => { if (this.feedback === message) this.feedback = ''; }, 3000); }
}
