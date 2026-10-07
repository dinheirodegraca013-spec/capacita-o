import { fetchApi } from '../lib/supabase.ts';
import {
  User,
  Organization,
  Course,
  ClassGroup,
  AttendanceRecord,
  Assessment,
  AssessmentAttempt,
  Certificate,
  AuditLog,
  UserRole,
} from '../types/index.ts';

export const api = {
  // Auth
  getMe: () => fetchApi<{ user: User; organization: Organization | null }>('/auth/me'),
  switchRole: (params: { role?: UserRole; userId?: string }) =>
    fetchApi<{ user: User; organization: Organization | null }>('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  login: (emailOrCpf: string) =>
    fetchApi<{ user: User; organization: Organization | null }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrCpf }),
    }),

  // Organizations
  getOrganizations: () => fetchApi<Organization[]>('/organizations'),
  getOrganization: (id: string) => fetchApi<Organization & { secretariats: any[]; departments: any[] }>(`/organizations/${id}`),
  createOrganization: (data: Partial<Organization>) =>
    fetchApi<Organization>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateOrganization: (id: string, data: Partial<Organization>) =>
    fetchApi<Organization>(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Secretariats & Departments
  getSecretariats: (orgId?: string) =>
    fetchApi<any[]>(`/secretariats${orgId ? `?organizationId=${orgId}` : ''}`),
  getDepartments: (orgId?: string, secId?: string) => {
    const params = new URLSearchParams();
    if (orgId) params.append('organizationId', orgId);
    if (secId) params.append('secretariatId', secId);
    return fetchApi<any[]>(`/departments?${params.toString()}`);
  },

  // Users
  getUsers: (filters?: { role?: string; secretariatId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.secretariatId) params.append('secretariatId', filters.secretariatId);
    return fetchApi<(User & { secretariat_name?: string; department_name?: string })[]>(`/users?${params.toString()}`);
  },

  // Courses
  getCourses: () => fetchApi<(Course & { enrollment?: any })[]>('/courses'),
  getCourse: (id: string) =>
    fetchApi<
      Course & {
        modules: any[];
        classes: ClassGroup[];
        assessment: Assessment | null;
        enrollment: any;
        certificate: Certificate | null;
        evaluation: any;
      }
    >(`/courses/${id}`),
  createCourse: (data: any) =>
    fetchApi<Course>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateLessonProgress: (lessonId: string, data: { watch_time_seconds?: number; last_position_seconds?: number; completed?: boolean; course_id: string }) =>
    fetchApi<{ success: boolean; progress: any }>(`/lessons/${lessonId}/progress`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Classes & Meetings & Attendance
  getClasses: () => fetchApi<ClassGroup[]>('/classes'),
  getMeetingAttendances: (meetingId: string) => fetchApi<AttendanceRecord[]>(`/meetings/${meetingId}/attendances`),
  markAttendance: (meetingId: string, data: { user_id: string; status: string }) =>
    fetchApi<AttendanceRecord>(`/meetings/${meetingId}/attendance`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMeetingQr: (meetingId: string) =>
    fetchApi<{ meeting_id: string; token: string; qr_data_url: string; meeting_title: string; location: string; room?: string }>(
      `/meetings/${meetingId}/qr-code`
    ),
  verifyMeetingQr: (data: { meeting_id: string; token: string }) =>
    fetchApi<{ success: boolean; message: string; record: AttendanceRecord }>('/attendances/verify-qr', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Assessments
  getAssessment: (id: string) => fetchApi<Assessment>(`/assessments/${id}`),
  startAssessment: (id: string) =>
    fetchApi<{ attempt: AssessmentAttempt; remainingSeconds: number; questions: any[] }>(`/assessments/${id}/start`, {
      method: 'POST',
    }),
  saveAssessmentAnswer: (attemptId: string, data: { questionId: string; optionId: string }) =>
    fetchApi<{ success: boolean; savedAnswers: Record<string, string> }>(`/assessments/attempts/${attemptId}/answer`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  recordAssessmentIncident: (attemptId: string, data: { incident_type: string; details?: string }) =>
    fetchApi<{ exit_count: number; max_allowed: number; terminated: boolean; status: string }>(
      `/assessments/attempts/${attemptId}/incident`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  finishAssessment: (attemptId: string) =>
    fetchApi<{
      attempt: AssessmentAttempt;
      correctCount: number;
      totalQuestions: number;
      scorePercent: number;
      passed: boolean;
      certificate: Certificate | null;
    }>(`/assessments/attempts/${attemptId}/finish`, {
      method: 'POST',
    }),

  // Certificates
  getCertificates: () => fetchApi<Certificate[]>('/certificates'),
  verifyPublicCertificate: (code: string) =>
    fetchApi<{
      valid: boolean;
      message?: string;
      certificate?: {
        code: string;
        student_name: string;
        masked_cpf: string;
        registration_number: string;
        course_title: string;
        course_category: string;
        workload_hours: number;
        organization_name: string;
        coat_of_arms_url?: string;
        grade_percent?: number;
        attendance_percent?: number;
        issued_at: string;
      };
    }>(`/certificates/verify/${encodeURIComponent(code)}`),

  // CSV Import
  validateCsvImport: (rows: any[]) =>
    fetchApi<{
      summary: { total: number; valid: number; errors: number };
      validRows: any[];
      invalidRows: any[];
    }>('/servants/import-validate', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    }),
  commitCsvImport: (validRows: any[]) =>
    fetchApi<{ success: boolean; importedCount: number }>('/servants/import-commit', {
      method: 'POST',
      body: JSON.stringify({ validRows }),
    }),

  // Evaluations
  submitEvaluation: (courseId: string, data: { rating: number; usefulness_score: number; comment: string }) =>
    fetchApi<{ success: boolean; evaluation: any; courseAvg: number }>(`/courses/${courseId}/evaluation`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Audit Logs
  getAuditLogs: () => fetchApi<AuditLog[]>('/audit-logs'),
};
