export type UserRole = 'teacher' | 'admin';
export type DocStatus = 'draft' | 'submitted' | 'revision_requested' | 'approved';
export type Grade = '6' | '7' | '8';

export const SUBJECTS = [
  'ELA',
  'Mathematics',
  'Science',
  'Social Studies',
  'Art',
  'Computer Science / Digital Literacy',
  'Music',
  'Wellness',
  'World Language',
] as const;

export type Subject = typeof SUBJECTS[number];

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  department: string;
  created_at: string;
}

export interface Stage1 {
  learning_standards: string;
  vog_outcomes: string;
  transfer: string;
  enduring_understandings: string;
  essential_questions: string;
  knowledge: string;
  skills: string;
}

export interface Stage2 {
  transfer_tasks: string;
  formative_assessments: string;
  summative_assessments: string;
  other_evidence: string;
}

export interface Stage3 {
  learning_events: string;
  resources_materials: string;
  differentiation: string;
}

export interface CurriculumDoc {
  id: number;
  teacher_id: number;
  subject_area: string;
  course: string;
  unit_title: string;
  grade: Grade;
  start_date: string;
  end_date: string;
  unit_summary: string;
  stage1: string; // JSON string of Stage1
  stage2: string; // JSON string of Stage2
  stage3: string; // JSON string of Stage3
  stage1_complete: number; // 0 or 1
  stage2_complete: number;
  stage3_complete: number;
  status: DocStatus;
  created_at: string;
  updated_at: string;
  // Joined fields
  teacher_name?: string;
  teacher_email?: string;
}

export interface DocHistory {
  id: number;
  doc_id: number;
  user_id: number;
  action: string;
  changes_json: string;
  note: string;
  created_at: string;
  user_name?: string;
}

export interface Note {
  id: number;
  doc_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user_name?: string;
  user_role?: string;
}

export interface SessionPayload {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
}
