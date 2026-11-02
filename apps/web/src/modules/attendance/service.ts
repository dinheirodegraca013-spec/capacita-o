import type { Actor } from '@/modules/identity/model';

export type AttendanceClient = { rpc(name: 'issue_attendance_token' | 'confirm_attendance' | 'correct_attendance', args: Record<string, unknown>): Promise<{ data: string | null; error: { message: string } | null }> };
const validId = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
export async function issueAttendanceToken(actor: Actor, meetingId: string, client: AttendanceClient) {
  if (!actor.roles.includes('manager') && !actor.roles.includes('instructor')) throw new Error('Instructor role required');
  if (!validId(meetingId)) throw new Error('MEETING_INVALID');
  const { data, error } = await client.rpc('issue_attendance_token', { p_meeting_id: meetingId });
  if (error || !data) throw new Error(error?.message ?? 'Token failed');
  return data;
}
export async function confirmAttendance(actor: Actor, meetingId: string, token: string, client: AttendanceClient) {
  if (!actor.roles.includes('student')) throw new Error('Student role required');
  if (!validId(meetingId) || typeof token !== 'string' || !token.trim() || token.trim().length > 256) throw new Error('ATTENDANCE_TOKEN_INVALID');
  const { data, error } = await client.rpc('confirm_attendance', { p_meeting_id: meetingId, p_token: token.trim() });
  if (error || !data) throw new Error(error?.message ?? 'Attendance failed');
  return data;
}
export async function correctAttendance(actor: Actor, meetingId: string, enrollmentId: string, status: 'present' | 'absent' | 'justified', client: AttendanceClient) {
  if (!actor.roles.includes('manager') && !actor.roles.includes('instructor')) throw new Error('Instructor role required');
  if (!validId(meetingId) || !validId(enrollmentId) || !['present', 'absent', 'justified'].includes(status)) throw new Error('ATTENDANCE_INVALID');
  const { data, error } = await client.rpc('correct_attendance', { p_meeting_id: meetingId, p_enrollment_id: enrollmentId, p_status: status });
  if (error || !data) throw new Error(error?.message ?? 'Attendance correction failed');
  return data;
}
