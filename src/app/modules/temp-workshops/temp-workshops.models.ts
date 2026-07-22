export type WorkshopDeliveryMode = 'online' | 'hybrid';
export type WorkshopContentStatus = 'draft' | 'published';
export type LessonContentType = 'video' | 'article' | 'pdf' | 'live_session' | 'quiz' | 'external_link';
export type LessonAccess = 'free' | 'enrolled';

export interface WorkshopCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  imageUrl: string;
  active: boolean;
}

export interface WorkshopLesson {
  id: string;
  title: string;
  description: string;
  contentType: LessonContentType;
  durationMinutes: number;
  access: LessonAccess;
  resourceUrl: string;
}

export interface WorkshopSection {
  id: string;
  title: string;
  description: string;
  lessons: WorkshopLesson[];
}

export interface ManagedWorkshop {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  categoryId: string;
  instructor: string;
  deliveryMode: WorkshopDeliveryMode;
  price: number;
  status: WorkshopContentStatus;
  sections: WorkshopSection[];
  updatedAt: string;
}

export interface WorkshopContentState {
  workshops: ManagedWorkshop[];
  categories: WorkshopCategory[];
}

export type ConfirmationTarget =
  | { kind: 'workshop'; workshopId: string; label: string }
  | { kind: 'category'; categoryId: string; label: string }
  | { kind: 'section'; workshopId: string; sectionId: string; label: string }
  | { kind: 'lesson'; workshopId: string; sectionId: string; lessonId: string; label: string };
