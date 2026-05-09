export type UserRole = 'teacher' | 'admin';
export type DocStatus = 'draft' | 'submitted' | 'revision_requested' | 'approved';

export interface District {
  id: number;
  slug: string;
  name: string;
  subjects: string[];
  grades: string[];
  created_at: string;
}

export interface User {
  id: number;
  district_id: number;
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
  district_id: number;
  teacher_id: number;
  subject_area: string;
  course: string;
  unit_title: string;
  grade: string;
  start_date: string;
  end_date: string;
  unit_summary: string;
  stage1: Stage1 | string;
  stage2: Stage2 | string;
  stage3: Stage3 | string;
  stage1_complete: boolean;
  stage2_complete: boolean;
  stage3_complete: boolean;
  status: DocStatus;
  created_at: string;
  updated_at: string;
  teacher_name?: string;
  teacher_email?: string;
}

export interface DocHistory {
  id: number;
  doc_id: number;
  user_id: number;
  action: string;
  changes_json: string | object;
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
  districtId: number;
  districtSlug: string;
  districtName: string;
  email: string;
  name: string;
  role: UserRole;
}

export function parseStage<T>(value: T | string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value;
}
