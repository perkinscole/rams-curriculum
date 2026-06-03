import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import mammoth from 'mammoth';

const FORMAT_GUIDANCE: Record<string, string> = {
  ubd: `This is already a UBD (Understanding by Design) document. Extract its fields as-is; do not invent content that isn't present.`,
  scope_sequence: `This is a SCOPE AND SEQUENCE document — it covers WHAT will be taught WHEN over a term/year, but typically doesn't contain UBD's pedagogical depth (essential questions, transfer goals, etc.). Use the scope-and-sequence content to populate unit title, summary, knowledge, and learning_events (week-by-week). For UBD-specific fields like enduring_understandings, essential_questions, and transfer, SUGGEST plausible content based on the topics covered, prefixed with "AI-suggested: " so the teacher knows to revise.`,
  lesson_plan: `This is a single LESSON PLAN, not a multi-week unit. Extract its content into a UBD unit by treating the lesson's objective(s) as the basis for Stage 1, its assessment as Stage 2, and its activities as Stage 3 learning_events. Note that the resulting "unit" will be small in scope — that's expected.`,
  pacing_guide: `This is a PACING GUIDE — it shows topic-by-topic timing and standards alignment, usually in a table. Pull standards into learning_standards, topics into knowledge and learning_events, and SUGGEST essential questions and enduring understandings based on the topics, prefixed with "AI-suggested: ".`,
  curriculum_map: `This is a CURRICULUM MAP — a high-level overview tying standards to units across a year. Treat each major unit row as the content; pull standards into learning_standards and topics into knowledge. For Stage 2 evidence and Stage 3 activities not present in the map, SUGGEST plausible items prefixed with "AI-suggested: ".`,
  other: `The document type is custom. Read it carefully and extract whatever maps cleanly to the UBD fields below. For UBD fields not addressed by the source, SUGGEST plausible content based on the document's content, prefixed with "AI-suggested: " so the teacher knows to revise.`,
};

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = String(formData.get('document_type') || 'ubd').toLowerCase();
    const customDescription = String(formData.get('custom_description') || '').trim();

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (fileName.endsWith('.pdf')) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Upload .docx or .pdf' }, { status: 400 });
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'Could not extract text from file' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      const guidance = FORMAT_GUIDANCE[documentType] || FORMAT_GUIDANCE.other;
      const customLine = documentType === 'other' && customDescription
        ? `\nThe teacher describes the source document as: "${customDescription}".`
        : '';

      const prompt = `You are a curriculum specialist converting an existing curriculum document into the Understanding by Design (UBD) format used by the Curriclio platform.

${guidance}${customLine}

Whenever you generate content that isn't directly drawn from the source, PREFIX that content with "AI-suggested: " so the teacher knows to review it before submitting.

Document text:
${text.substring(0, 12000)}

Respond with ONLY valid JSON in this exact format. Leave fields as empty strings if you genuinely can't infer anything:
{
  "subject_area": "",
  "course": "",
  "unit_title": "",
  "grade": "",
  "start_date": "",
  "end_date": "",
  "unit_summary": "",
  "stage1": {
    "learning_standards": "",
    "vog_outcomes": "",
    "transfer": "",
    "enduring_understandings": "",
    "essential_questions": "",
    "knowledge": "",
    "skills": ""
  },
  "stage2": {
    "transfer_tasks": "",
    "formative_assessments": "",
    "summative_assessments": "",
    "other_evidence": ""
  },
  "stage3": {
    "learning_events": "",
    "resources_materials": "",
    "differentiation": ""
  }
}`;

      const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.content[0]?.text || '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({
            fields: parsed,
            raw_text: text.substring(0, 2000),
            document_type: documentType,
          });
        }
      }
    }

    const fields = parseUBDText(text);
    return NextResponse.json({ fields, raw_text: text.substring(0, 2000), document_type: documentType });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}

function parseUBDText(text: string) {
  const extract = (pattern: RegExp): string => {
    const match = text.match(pattern);
    return match ? match[1].trim() : '';
  };

  return {
    subject_area: extract(/Subject\s*Area:\s*(.+?)(?:\n|$)/i),
    course: extract(/Course:\s*(.+?)(?:\n|$)/i),
    unit_title: extract(/Unit\s*Title:\s*(.+?)(?:\n|$)/i),
    grade: extract(/Grade\(?s?\)?:\s*(.+?)(?:\n|$)/i),
    start_date: extract(/Start:\s*(.+?)(?:\n|$)/i),
    end_date: extract(/End:\s*(.+?)(?:\n|$)/i),
    unit_summary: extract(/Unit\s*Summary:\s*([\s\S]+?)(?=Stage\s*1|$)/i),
    stage1: {
      learning_standards: extract(/(?:Learning\s*Standards|Standards)[\s:]*(.+?)(?=Vision|Transfer|Enduring|Essential|$)/i),
      vog_outcomes: extract(/Vision\s*of\s*a\s*Graduate[\s\S]*?(?:Outcome|Performance)[\s:]*(.+?)(?=Transfer|Enduring|$)/i),
      transfer: extract(/Transfer[\s\S]*?(?:independently|learning\s*to)[\s:]*(.+?)(?=Meaning|Enduring|$)/i),
      enduring_understandings: extract(/Enduring\s*Understanding[\s\S]*?(?:understand\s*that)[\s:]*(.+?)(?=Essential|$)/i),
      essential_questions: extract(/Essential\s*Question[\s\S]*?(?:consider)[\s:]*(.+?)(?=Acquisition|Knowledge|$)/i),
      knowledge: extract(/Knowledge[\s\S]*?(?:know)[\s:]*(.+?)(?=Skills|$)/i),
      skills: extract(/Skills[\s\S]*?(?:skilled\s*at)[\s:]*(.+?)(?=Stage\s*2|$)/i),
    },
    stage2: {
      transfer_tasks: extract(/(?:Transfer|Performance)\s*Task[\s:]*(.+?)(?=Formative|$)/i),
      formative_assessments: extract(/Formative\s*Assessment[\s:]*(.+?)(?=Summative|$)/i),
      summative_assessments: extract(/Summative\s*Assessment[\s:]*(.+?)(?=Other|$)/i),
      other_evidence: extract(/Other\s*Evidence[\s:]*(.+?)(?=Stage\s*3|$)/i),
    },
    stage3: {
      learning_events: extract(/Learning\s*Events[\s\S]*?(?:Instruction)?[\s:]*(.+?)(?=Resources|$)/i),
      resources_materials: extract(/Resources[\s\S]*?(?:Materials)?[\s:]*(.+?)(?=Differentiation|$)/i),
      differentiation: extract(/Differentiation[\s\S]*?(.+?)$/i),
    },
  };
}
