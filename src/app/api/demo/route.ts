import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, queryOne, DEFAULT_SUBJECTS, DEFAULT_GRADES } from '@/lib/db';
import { createToken, COOKIE_NAME } from '@/lib/auth';

interface SampleDoc {
  subject_area: string;
  unit_title: string;
  grade: string;
  unit_summary: string;
  status: 'draft' | 'submitted' | 'approved' | 'revision_requested';
  stage1: object;
  stage2: object;
  stage3: object;
  complete: [boolean, boolean, boolean];
  teacher: string;
}

const SAMPLE_TEACHERS = [
  { name: 'Jane Smith', email: 'jane.smith@demo.curriclio.app', department: 'Science' },
  { name: 'Marcus Garcia', email: 'marcus.garcia@demo.curriclio.app', department: 'Social Studies' },
  { name: 'Riya Patel', email: 'riya.patel@demo.curriclio.app', department: 'Mathematics' },
];

const SAMPLE_DOCS: Omit<SampleDoc, 'teacher'>[] = [
  {
    subject_area: 'Science', grade: '8',
    unit_title: 'Forces and Motion',
    unit_summary: 'Students investigate how forces interact to cause motion through hands-on labs and design challenges.',
    status: 'approved',
    complete: [true, true, true],
    stage1: {
      learning_standards: 'NGSS MS-PS2-1, MS-PS2-2',
      essential_questions: 'How do forces affect the motion of objects? Why do some objects keep moving and others stop?',
      enduring_understandings: 'A force is a push or pull, and Newton\'s laws predict how objects respond to them.',
      knowledge: 'Newton\'s three laws; friction, gravity, normal force; balanced vs unbalanced forces.',
      skills: 'Design and run controlled experiments; interpret force diagrams; calculate net force.',
      transfer: 'Predict the motion of real-world objects from a force analysis.',
      vog_outcomes: 'Critical Thinking; Problem Solving',
    },
    stage2: {
      transfer_tasks: 'Design a marble-track challenge that meets target travel time using friction principles.',
      formative_assessments: 'Daily exit tickets on force diagrams; lab notebook checks.',
      summative_assessments: 'Unit exam plus marble-track engineering design report.',
      other_evidence: 'Peer review of partner lab notebooks.',
    },
    stage3: {
      learning_events: '4-week sequence: intro labs → Newton\'s laws → friction investigations → design challenge.',
      resources_materials: 'Marble tracks, spring scales, video probes, Phet simulations.',
      differentiation: 'Sentence frames for ML learners; extension challenges for advanced students; collaborative grouping.',
    },
  },
  {
    subject_area: 'Social Studies', grade: '8',
    unit_title: 'The American Revolution',
    unit_summary: 'Students examine the political, economic, and ideological causes of the American Revolution and evaluate its global impact.',
    status: 'approved',
    complete: [true, true, true],
    stage1: {
      learning_standards: 'C3 D2.His.1.6-8, D2.His.3.6-8',
      essential_questions: 'When is revolution justified? Whose voices are included in the story of independence?',
      enduring_understandings: 'Revolutions arise from a mix of ideas, grievances, and leadership; the histories we tell shape national identity.',
      knowledge: 'Key events 1763-1783; Enlightenment ideas; perspectives of women, enslaved people, and Indigenous nations.',
      skills: 'Source analysis; argument writing; perspective-taking.',
      transfer: 'Analyze a modern independence movement using the same framework.',
      vog_outcomes: 'Global Citizenship; Communication',
    },
    stage2: {
      transfer_tasks: 'Write a 5-paragraph DBQ essay using 6 primary sources.',
      formative_assessments: 'Weekly source analysis worksheets; Socratic seminar participation.',
      summative_assessments: 'DBQ essay; Revolution-era newspaper project.',
      other_evidence: 'Class discussion contributions; reflection journal.',
    },
    stage3: {
      learning_events: 'Document-based inquiry units culminating in a mock Continental Congress simulation.',
      resources_materials: 'Stanford History Education Group primary sources; Hamilton excerpts; textbook chapters 6-8.',
      differentiation: 'Tiered source packets; choice in final project format; flexible grouping.',
    },
  },
  {
    subject_area: 'Mathematics', grade: '7',
    unit_title: 'Ratios, Proportions, and Percent',
    unit_summary: 'Students develop fluency with ratio reasoning and apply it to real-world percent problems.',
    status: 'revision_requested',
    complete: [true, true, false],
    stage1: {
      learning_standards: 'CCSS 7.RP.A.1, 7.RP.A.2, 7.RP.A.3',
      essential_questions: 'How are ratios and proportions used to compare quantities? When is percent the right tool?',
      enduring_understandings: 'Proportional reasoning describes a multiplicative relationship between quantities.',
      knowledge: 'Unit rates; constant of proportionality; percent change.',
      skills: 'Set up and solve proportions; calculate tax, tip, discount, and markup.',
      transfer: 'Apply proportional reasoning to comparison shopping and recipe scaling.',
      vog_outcomes: 'Quantitative Reasoning',
    },
    stage2: {
      transfer_tasks: 'Plan a class party on a budget, computing discounts and tax.',
      formative_assessments: 'Daily warm-up problems; partner whiteboard work.',
      summative_assessments: 'Unit test and budget project.',
      other_evidence: '',
    },
    stage3: { learning_events: 'Work in progress.', resources_materials: '', differentiation: '' },
  },
  {
    subject_area: 'English Language Arts', grade: '6',
    unit_title: 'The Hero\'s Journey',
    unit_summary: 'Students analyze the hero\'s journey across cultures and craft their own short hero narrative.',
    status: 'submitted',
    complete: [true, true, true],
    stage1: {
      learning_standards: 'CCSS RL.6.2, RL.6.3, W.6.3',
      essential_questions: 'What makes a hero? How do stories shape who we think we can become?',
      enduring_understandings: 'Story patterns recur across cultures because they reflect shared human experience.',
      knowledge: 'Stages of the hero\'s journey; archetypes; narrative structure.',
      skills: 'Close reading; narrative writing; revision through peer feedback.',
      transfer: 'Identify the hero\'s journey pattern in a film or novel of choice.',
      vog_outcomes: 'Cultural Awareness; Communication',
    },
    stage2: {
      transfer_tasks: 'Write a 1500-word original hero narrative.',
      formative_assessments: 'Quick-writes; reading response journal entries.',
      summative_assessments: 'Hero narrative; analytical essay comparing two heroes from different cultures.',
      other_evidence: 'Peer-edit logs.',
    },
    stage3: {
      learning_events: '6-week arc: shared reading of \"The Lightning Thief\" + 2 short hero texts → narrative writing workshop.',
      resources_materials: '\"The Lightning Thief\"; mentor texts from Indigenous and African oral traditions; writing notebooks.',
      differentiation: 'Audiobook access; tiered writing prompts; choice in mentor text.',
    },
  },
  {
    subject_area: 'Science', grade: '6',
    unit_title: 'Ecosystems and Energy Flow',
    unit_summary: 'Students model how matter and energy move through ecosystems and predict the impact of disturbances.',
    status: 'draft',
    complete: [true, false, false],
    stage1: {
      learning_standards: 'NGSS MS-LS2-1, MS-LS2-3',
      essential_questions: 'How does energy flow through an ecosystem? What happens when something is removed?',
      enduring_understandings: 'Ecosystems depend on the cycling of matter and the one-way flow of energy.',
      knowledge: 'Producers, consumers, decomposers; food webs; the carbon and water cycles.',
      skills: 'Build and interpret food web models; predict cascade effects.',
      transfer: 'Analyze a local ecosystem disturbance from a news article.',
      vog_outcomes: 'Systems Thinking',
    },
    stage2: {},
    stage3: {},
  },
];

export async function POST() {
  try {
    const suffix = crypto.randomBytes(4).toString('hex');
    const slug = `demo-${suffix}`;
    const districtName = `Demo District (${suffix})`;

    const district = await queryOne<{ id: string; slug: string; name: string }>(
      `INSERT INTO districts (slug, name, subjects, grades, is_demo)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, true)
       RETURNING id, slug, name`,
      [slug, districtName, JSON.stringify(DEFAULT_SUBJECTS), JSON.stringify(DEFAULT_GRADES)]
    );
    if (!district) throw new Error('Could not create demo district');

    const adminEmail = `admin+${suffix}@demo.curriclio.app`;
    const adminPasswordHash = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);

    const admin = await queryOne<{ id: string }>(
      `INSERT INTO users (district_id, email, password_hash, name, role, department)
       VALUES ($1, $2, $3, 'Demo Admin', 'admin', 'Curriculum Office')
       RETURNING id`,
      [district.id, adminEmail, adminPasswordHash]
    );
    if (!admin) throw new Error('Could not create demo admin');

    // Seed sample teachers
    const teacherIds: Record<string, number> = {};
    for (const t of SAMPLE_TEACHERS) {
      const teacherHash = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);
      const tRow = await queryOne<{ id: string }>(
        `INSERT INTO users (district_id, email, password_hash, name, role, department)
         VALUES ($1, $2, $3, $4, 'teacher', $5)
         RETURNING id`,
        [district.id, t.email, teacherHash, t.name, t.department]
      );
      if (tRow) teacherIds[t.name] = Number(tRow.id);
    }

    const teacherList = Object.values(teacherIds);
    for (let i = 0; i < SAMPLE_DOCS.length; i++) {
      const doc = SAMPLE_DOCS[i];
      const teacherId = teacherList[i % teacherList.length];
      const inserted = await queryOne<{ id: string }>(
        `INSERT INTO curriculum_docs
          (district_id, teacher_id, subject_area, unit_title, grade, unit_summary,
           stage1, stage2, stage3, stage1_complete, stage2_complete, stage3_complete, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,$12,$13)
         RETURNING id`,
        [
          district.id, teacherId, doc.subject_area, doc.unit_title, doc.grade, doc.unit_summary,
          JSON.stringify(doc.stage1), JSON.stringify(doc.stage2), JSON.stringify(doc.stage3),
          doc.complete[0], doc.complete[1], doc.complete[2], doc.status,
        ]
      );
      if (inserted) {
        await query(
          `INSERT INTO doc_history (district_id, doc_id, user_id, action, note)
           VALUES ($1, $2, $3, 'created', 'Sample doc seeded by demo')`,
          [district.id, inserted.id, teacherId]
        );
      }
    }

    const jwt = createToken({
      userId: Number(admin.id),
      districtId: Number(district.id),
      districtSlug: district.slug,
      districtName: district.name,
      email: adminEmail,
      name: 'Demo Admin',
      role: 'admin',
    });

    const response = NextResponse.json({
      district: { slug: district.slug, name: district.name },
      redirect: '/admin',
    });

    response.cookies.set(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 4, // 4 hours
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('demo POST error:', err);
    return NextResponse.json({ error: 'Could not create demo district' }, { status: 500 });
  }
}
