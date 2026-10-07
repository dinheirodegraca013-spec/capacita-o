export type UserRole = 'superadmin' | 'gestor' | 'professor' | 'aluno';

export type CourseModality = 'ead' | 'presencial' | 'hibrido';

export type CourseStatus = 'draft' | 'published' | 'archived';

export type LessonContentType = 'video' | 'audio' | 'pdf' | 'text';

export type AttendanceStatus = 'presente' | 'ausente' | 'justificado';

export type AttendanceMethod = 'manual' | 'qr_code';

export type QuestionDifficulty = 'facil' | 'medio' | 'dificil';

export type AssessmentAttemptStatus = 
  | 'in_progress' 
  | 'submitted' 
  | 'expired' 
  | 'terminated_by_violations';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  cnpj?: string;
  logo_url?: string;
  coat_of_arms_url?: string;
  primary_color: string;
  secondary_color: string;
  status: 'active' | 'suspended' | 'trial';
  created_at: string;
}

export interface Secretariat {
  id: string;
  organization_id: string;
  name: string;
  code?: string;
}

export interface Department {
  id: string;
  organization_id: string;
  secretariat_id: string;
  name: string;
}

export interface User {
  id: string;
  organization_id?: string;
  name: string;
  email: string;
  cpf: string;
  registration_number?: string;
  role: UserRole;
  secretariat_id?: string;
  department_id?: string;
  job_title?: string;
  avatar_url?: string;
  active: boolean;
  created_at: string;
}

export interface Course {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  workload_hours: number;
  category: string;
  modality: CourseModality;
  instructor_id?: string;
  instructor_name?: string;
  status: CourseStatus;
  created_at: string;
  rating_avg?: number;
  rating_count?: number;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  content_type: LessonContentType;
  content_url?: string;
  audio_url?: string;
  pdf_url?: string;
  text_content?: string;
  duration_minutes: number;
  order_index: number;
  // User progress info (when joined)
  progress?: {
    completed: boolean;
    watch_time_seconds: number;
    last_position_seconds: number;
    last_accessed_at: string;
  };
}

export interface ClassGroup {
  id: string;
  organization_id: string;
  course_id: string;
  course_title?: string;
  name: string;
  instructor_id?: string;
  instructor_name?: string;
  start_date: string;
  end_date: string;
  modality: CourseModality;
  max_capacity: number;
  enrolled_count?: number;
  status: 'agendada' | 'em_andamento' | 'encerrada';
  meetings?: Meeting[];
}

export interface Meeting {
  id: string;
  class_id: string;
  title: string;
  meeting_date: string;
  start_time: string;
  end_time: string;
  location: string;
  room?: string;
  qr_secret?: string;
  materials_pdf_url?: string;
}

export interface AttendanceRecord {
  id: string;
  meeting_id: string;
  user_id: string;
  user_name?: string;
  user_cpf?: string;
  user_secretariat?: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  registered_at: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  order_index: number;
}

export interface Question {
  id: string;
  organization_id: string;
  course_id: string;
  module_id?: string;
  prompt: string;
  explanation?: string;
  difficulty: QuestionDifficulty;
  category: string;
  options: QuestionOption[];
}

export interface Assessment {
  id: string;
  course_id: string;
  course_title?: string;
  title: string;
  description: string;
  time_limit_minutes: number;
  min_score_percent: number;
  max_attempts: number;
  max_exit_tolerated: number;
  shuffle_questions: boolean;
  num_questions: number;
  questions?: Question[];
}

export interface AssessmentAttempt {
  id: string;
  assessment_id: string;
  user_id: string;
  started_at: string;
  expires_at: string;
  finished_at?: string;
  score?: number;
  passed?: boolean;
  exit_count: number;
  status: AssessmentAttemptStatus;
  answers: Record<string, string>; // questionId -> optionId
  incidents: {
    incident_type: 'tab_switch' | 'window_blur' | 'exit_fullscreen';
    occurred_at: string;
    details?: string;
  }[];
}

export interface Enrollment {
  id: string;
  organization_id: string;
  user_id: string;
  course_id: string;
  class_id?: string;
  is_mandatory: boolean;
  due_date?: string;
  status: 'ativo' | 'concluido' | 'expirado';
  progress_percent: number;
  ead_progress_percent?: number;
  presencial_progress_percent?: number;
  enrolled_at: string;
  completed_at?: string;
  course?: Course;
  last_lesson_id?: string;
}

export interface Certificate {
  id: string;
  code: string;
  enrollment_id?: string;
  user_id: string;
  user_name: string;
  user_cpf: string;
  user_registration?: string;
  course_id: string;
  course_title: string;
  course_category: string;
  organization_id: string;
  organization_name: string;
  coat_of_arms_url?: string;
  workload_hours: number;
  grade_percent?: number;
  attendance_percent?: number;
  issued_at: string;
  qr_code_data_url?: string;
}

export interface CourseEvaluation {
  id: string;
  course_id: string;
  user_id: string;
  user_name?: string;
  rating: number; // 1 to 5
  usefulness_score: number; // 1 to 5
  comment: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id?: string;
  organization_name?: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_name: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}
