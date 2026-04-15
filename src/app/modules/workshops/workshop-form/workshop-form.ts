import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { WorkshopService } from '../../../core/services/workshop.service';
import { Workshop } from '../../../models/workshop.model';

@Component({
  selector: 'app-workshop-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './workshop-form.html',
  styleUrl: './workshop-form.scss'
})
export class WorkshopForm implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private workshopService = inject(WorkshopService);

  currentStep = 1;
  readonly totalSteps = 4;
  isEditMode = false;
  workshopId: string | null = null;
  cloneId: string | null = null;
  isSubmitting = false;
  submitError: string | null = null;
  submitSuccess = false;
  loadError: string | null = null;

  readonly steps = [
    { label: 'Basic Info', icon: 'edit_note' },
    { label: '3-Hour Plan', icon: 'view_timeline' },
    { label: 'Schedules', icon: 'calendar_month' },
    { label: 'Preview', icon: 'preview' }
  ];

  readonly timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
    'America/Los_Angeles', 'Europe/London', 'Europe/Paris',
    'Asia/Kolkata', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney'
  ];

  readonly streamModes = [
    { value: 'live_broadcast', label: 'Live Broadcast' },
    { value: 'interactive_class', label: 'Interactive Class' }
  ];

  form!: FormGroup;

  ngOnInit() {
    this.initForm();

    this.workshopId = this.route.snapshot.paramMap.get('id');
    this.cloneId = this.route.snapshot.queryParamMap.get('clone');

    if (this.workshopId) {
      this.isEditMode = true;
      this.loadWorkshop(this.workshopId);
    } else if (this.cloneId) {
      this.loadWorkshop(this.cloneId, true);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      workshopTitle: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      workshopDescription: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
      expertDescription: ['', [Validators.required, Validators.maxLength(1000)]],
      threeHourPlan: this.fb.group({
        hour1: this.createHourGroup(),
        hour2: this.createHourGroup(),
        hour3: this.createHourGroup()
      }),
      schedules: this.fb.array([])
    });
  }

  private createHourGroup(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      expertAllowed: [true],
      instructorAllowed: [true]
    });
  }

  private createScheduleGroup(): FormGroup {
    return this.fb.group({
      _id: [null],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      sessionOrder: [this.schedules.length + 1],
      fee: [0, [Validators.required, Validators.min(0)]],
      mode: ['online', Validators.required],
      streamMode: ['live_broadcast'],
      location: [''],
      instructorId: [''],
      timezone: ['Asia/Kolkata']
    });
  }

  get schedules(): FormArray {
    return this.form.get('schedules') as FormArray;
  }

  get threeHourPlan(): FormGroup {
    return this.form.get('threeHourPlan') as FormGroup;
  }

  getHour(hour: 'hour1' | 'hour2' | 'hour3'): FormGroup {
    return this.threeHourPlan.get(hour) as FormGroup;
  }

  getScheduleGroup(index: number): FormGroup {
    return this.schedules.at(index) as FormGroup;
  }

  addSchedule(): void {
    const group = this.createScheduleGroup();
    this.schedules.push(group);
  }

  removeSchedule(index: number): void {
    this.schedules.removeAt(index);
    this.reorderSchedules();
  }

  dropSchedule(event: CdkDragDrop<AbstractControl[]>): void {
    const controls = [...this.schedules.controls];
    moveItemInArray(controls, event.previousIndex, event.currentIndex);
    while (this.schedules.length) {
      this.schedules.removeAt(0);
    }
    controls.forEach(ctrl => this.schedules.push(ctrl as FormGroup));
    this.reorderSchedules();
  }

  private reorderSchedules(): void {
    this.schedules.controls.forEach((ctrl, i) => {
      ctrl.patchValue({ sessionOrder: i + 1 });
    });
  }

  isOnlineOrHybrid(index: number): boolean {
    const mode = this.getScheduleGroup(index).get('mode')?.value;
    return mode === 'online' || mode === 'hybrid';
  }

  private loadWorkshop(id: string, isClone = false): void {
    this.workshopService.getWorkshop(id).subscribe({
      next: (workshop) => this.patchForm(workshop, isClone),
      error: () => {
        this.loadError = 'Failed to load workshop data. Please go back and try again.';
      }
    });
  }

  private patchForm(workshop: Workshop, isClone = false): void {
    this.form.patchValue({
      workshopTitle: isClone ? `${workshop.workshopTitle} (Copy)` : workshop.workshopTitle,
      workshopDescription: workshop.workshopDescription,
      expertDescription: workshop.expertDescription,
      threeHourPlan: workshop.threeHourPlan
    });

    while (this.schedules.length) {
      this.schedules.removeAt(0);
    }
    (workshop.schedules ?? []).forEach(schedule => {
      const group = this.createScheduleGroup();
      group.patchValue({ ...schedule, _id: isClone ? undefined : schedule._id });
      this.schedules.push(group);
    });
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return (
          this.form.get('workshopTitle')!.valid &&
          this.form.get('workshopDescription')!.valid &&
          this.form.get('expertDescription')!.valid
        );
      case 2:
        return this.threeHourPlan.valid;
      case 3:
        return this.schedules.valid;
      default:
        return true;
    }
  }

  nextStep(): void {
    if (this.isStepValid(this.currentStep)) {
      this.currentStep = Math.min(this.currentStep + 1, this.totalSteps);
    } else {
      this.touchCurrentStep();
    }
  }

  prevStep(): void {
    this.currentStep = Math.max(this.currentStep - 1, 1);
  }

  goToStep(step: number): void {
    if (step <= this.currentStep || this.isStepValid(this.currentStep)) {
      this.currentStep = step;
    }
  }

  private touchCurrentStep(): void {
    switch (this.currentStep) {
      case 1:
        ['workshopTitle', 'workshopDescription', 'expertDescription'].forEach(f =>
          this.form.get(f)?.markAsTouched()
        );
        break;
      case 2:
        this.threeHourPlan.markAllAsTouched();
        break;
      case 3:
        this.schedules.markAllAsTouched();
        break;
    }
  }

  saveAsDraft(): void {
    this.submitWorkshop('draft');
  }

  publish(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.touchCurrentStep();
      return;
    }
    this.submitWorkshop('published');
  }

  private buildPayload(status: string): Partial<Workshop> {
    const raw = this.form.value;
    const allSchedules = (raw.schedules ?? []).map((s: any) => ({
      ...s,
      _id: s._id || undefined,
      instructorId: s.instructorId || undefined,
      location: s.location || null
    }));
    return {
      workshopTitle: raw.workshopTitle,
      workshopDescription: raw.workshopDescription,
      expertDescription: raw.expertDescription,
      status: status as any,
      threeHourPlan: raw.threeHourPlan,
      schedules: allSchedules
    };
  }

  private submitWorkshop(status: string): void {
    this.isSubmitting = true;
    this.submitError = null;

    if (this.isEditMode && this.workshopId) {
      this.submitEditWorkshop(status);
    } else {
      const payload = this.buildPayload(status);
      this.workshopService.createWorkshop(payload).subscribe({
        next: () => this.onSubmitSuccess(),
        error: (err) => this.onSubmitError(err)
      });
    }
  }

  private submitEditWorkshop(status: string): void {
    const raw = this.form.value;
    const allSchedules = (raw.schedules ?? []).map((s: any) => ({
      ...s,
      _id: s._id || undefined,
      instructorId: s.instructorId || undefined,
      location: s.location || null
    }));

    const existingSchedules = allSchedules.filter((s: any) => !!s._id);
    const newSchedules = allSchedules.filter((s: any) => !s._id);

    const updatePayload: Partial<Workshop> = {
      workshopTitle: raw.workshopTitle,
      workshopDescription: raw.workshopDescription,
      expertDescription: raw.expertDescription,
      status: status as any,
      threeHourPlan: raw.threeHourPlan,
      schedules: existingSchedules
    };

    this.workshopService.updateWorkshop(this.workshopId!, updatePayload).subscribe({
      next: () => {
        if (newSchedules.length > 0) {
          this.workshopService.addSchedules(this.workshopId!, newSchedules).subscribe({
            next: () => this.onSubmitSuccess(),
            error: (err) => this.onSubmitError(err)
          });
        } else {
          this.onSubmitSuccess();
        }
      },
      error: (err) => this.onSubmitError(err)
    });
  }

  private onSubmitSuccess(): void {
    this.submitSuccess = true;
    this.isSubmitting = false;
    setTimeout(() => this.router.navigate(['/workshops']), 1500);
  }

  private onSubmitError(err: any): void {
    this.isSubmitting = false;
    this.submitError = err?.error?.message || 'Failed to save workshop. Please try again.';
  }

  cancel(): void {
    this.router.navigate(['/workshops']);
  }

  isFieldInvalid(path: string): boolean {
    const ctrl = this.form.get(path);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  isScheduleFieldInvalid(i: number, field: string): boolean {
    const ctrl = this.getScheduleGroup(i).get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  getModeLabel(mode: string): string {
    return ({ online: 'Online', hybrid: 'Hybrid' } as Record<string, string>)[mode] ?? mode;
  }

  getStreamModeLabel(mode: string): string {
    return this.streamModes.find(m => m.value === mode)?.label ?? mode;
  }

  getStatusLabel(): string {
    return this.isEditMode ? 'Update Workshop' : 'Create Workshop';
  }

  getTotalFee(): number {
    return this.schedules.controls.reduce((sum, ctrl) => {
      return sum + (Number(ctrl.get('fee')?.value) || 0);
    }, 0);
  }

  get previewData(): Partial<Workshop> {
    return this.form.value;
  }
}
