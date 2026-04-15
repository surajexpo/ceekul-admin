export type WorkshopMode = 'online' | 'hybrid';
export type StreamMode = 'live_broadcast' | 'interactive_class';
export type WorkshopStatus = 'draft' | 'published' | 'cancelled' | 'active' | 'ongoing';

export interface HourPlan {
  title: string;
  description: string;
  expertAllowed: boolean;
  instructorAllowed: boolean;
}

export interface ThreeHourPlan {
  hour1: HourPlan;
  hour2: HourPlan;
  hour3: HourPlan;
}

export interface InstructorRef {
  _id: string;
  name: string;
}

export interface WorkshopSchedule {
  _id?: string;
  date: string;
  startTime: string;
  endTime: string;
  sessionOrder: 1 | 2 | 3;
  activity?: string;
  description?: string;
  fee: number;
  mode: WorkshopMode;
  streamMode?: StreamMode | null;
  location?: string | null;
  instructorId?: string | InstructorRef | null;
  timezone?: string;
}

export interface WorkshopEnrollment {
  role: string;
  status: string;
  scheduleId?: string;
}

export interface Workshop {
  _id?: string;
  workshopTitle: string;
  workshopDescription: string;
  expertDescription?: string;
  createdBy?: string;
  status?: WorkshopStatus;
  threeHourPlan?: ThreeHourPlan;
  schedules: WorkshopSchedule[];
  totalRevenuePotential?: number;
  createdAt?: string;
  updatedAt?: string;
  /** Populated by GET /workshops/:id — current user's enrollments across schedules */
  userEnrollments?: WorkshopEnrollment[];
  /** Backwards-compat: first enrollment entry (populated by GET /workshops/:id) */
  userEnrollment?: WorkshopEnrollment;
}

export interface WorkshopPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MyWorkshopsResponse {
  status: boolean;
  message: string;
  data: {
    workshops: Workshop[];
    pagination: WorkshopPagination;
  };
}

/** Single-workshop endpoints: GET /:id and PUT /:id */
export interface WorkshopApiResponse {
  status: boolean;
  message: string;
  data: Workshop;
}

/** DELETE /workshops/:id/schedules/:scheduleId */
export interface DeleteScheduleResponse {
  status: boolean;
  message: string;
  data: {
    removedScheduleId: string;
    totalSchedules: number;
    totalRevenuePotential: number;
  };
}

/** POST /workshops/:id/schedules */
export interface AddSchedulesResponse {
  status: boolean;
  message: string;
  data: {
    addedSchedules: WorkshopSchedule[];
    totalSchedules: number;
    totalRevenuePotential: number;
  };
}

/** Kept for compatibility with getWorkshops() (GET /workshops) */
export interface WorkshopListResponse {
  data: Workshop[];
  total: number;
  page: number;
  limit: number;
}
