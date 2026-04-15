export type ProgramStatus = 'draft' | 'published' | 'archived';
export type ProgramLevel = 'beginner' | 'intermediate' | 'advanced';
export type TopicType = 'video' | 'text' | 'file' | 'quiz';
export type EnrollmentStatus = 'active' | 'completed';
export type ProgramVisibility = 'public' | 'private';

// ── Curriculum hierarchy ─────────────────────────────────────────────────────

export interface CurriculumTopic {
  _id?: string;
  tempId: string;
  sectionId?: string;
  title: string;
  type: TopicType;
  contentUrl?: string;
  description?: string;
  duration?: number; // minutes
  order: number;
  expanded?: boolean; // UI: show detail fields in builder
}

export interface CurriculumSection {
  _id?: string;
  tempId: string;
  moduleId?: string;
  title: string;
  order: number;
  topics: CurriculumTopic[];
  expanded: boolean;
}

export interface CurriculumModule {
  _id?: string;
  tempId: string;
  programId?: string;
  title: string;
  description?: string;
  order: number;
  sections: CurriculumSection[];
  expanded: boolean;
}

// ── Instructor ───────────────────────────────────────────────────────────────

export interface InstructorRef {
  _id: string;
  name: string;
  email?: string;
}

// ── Program ──────────────────────────────────────────────────────────────────

export interface Program {
  _id?: string;
  title: string;
  subtitle?: string;
  description: string;
  category?: string;
  tags?: string[];
  level: ProgramLevel;
  duration?: number;
  language?: string;
  thumbnail?: string;
  banner?: string;
  status: ProgramStatus;
  visibility?: ProgramVisibility;
  createdBy?: string;
  instructors?: string[] | InstructorRef[];
  modules?: CurriculumModule[];
  totalEnrollments?: number;
  totalTopics?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ── Enrollment ───────────────────────────────────────────────────────────────

export interface ProgramEnrollment {
  _id?: string;
  programId: string;
  studentId: string;
  progress?: number;
  status: EnrollmentStatus;
}

// ── Pagination ───────────────────────────────────────────────────────────────

export interface ProgramPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── API response wrappers ─────────────────────────────────────────────────────

export interface ProgramApiResponse {
  status: boolean;
  message: string;
  data: Program;
}

export interface ProgramListApiResponse {
  status: boolean;
  message: string;
  data: {
    programs: Program[];
    pagination: ProgramPagination;
  };
}

export interface ModuleApiResponse {
  status: boolean;
  message: string;
  data: CurriculumModule;
}

export interface SectionApiResponse {
  status: boolean;
  message: string;
  data: CurriculumSection;
}

export interface TopicApiResponse {
  status: boolean;
  message: string;
  data: CurriculumTopic;
}

export interface EnrollmentApiResponse {
  status: boolean;
  message: string;
  data: ProgramEnrollment;
}

export interface EnrollmentListApiResponse {
  status: boolean;
  message: string;
  data: ProgramEnrollment[];
}
