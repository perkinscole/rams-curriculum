import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import mammoth from 'mammoth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    // Extract text based on file type
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

    // Use Claude API to parse UBD fields if available
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 3000,
          messages: [{
            role: 'user',
            content: `Parse this UBD (Understanding by Design) curriculum document into structured fields. Extract all available information into the JSON format below. If a field isn't found in the document, leave it as an empty string.

Document text:
${text.substring(0, 8000)}

Respond with ONLY valid JSON in this exact format:
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
}`
          }]
        })
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.content[0]?.text || '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({ fields: parsed, raw_text: text.substring(0, 2000) });
        }
      }
    }

    // Fallback: try basic regex parsing without AI
    const fields = parseUBDText(text);
    return NextResponse.json({ fields, raw_text: text.substring(0, 2000) });
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
