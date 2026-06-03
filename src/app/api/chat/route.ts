import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are Curriclio's sales assistant. You help curriculum coordinators, directors, and administrators of K-12 school districts evaluate whether Curriclio fits their needs.

ABOUT CURRICLIO:
- A SaaS web app for K-12 districts to manage their curriculum
- Multi-tenant: each district gets a private space with its own teachers and admins
- Workflow: teachers draft Understanding-by-Design (UBD) unit plans → submit for review → admin approves or requests revisions → approved units publish to the district's curriculum page

KEY FEATURES:
- Full UBD framework support: Stage 1 (Desired Results), Stage 2 (Evidence of Learning), Stage 3 (Learning Plan)
- AI document conversion: teachers upload any existing curriculum doc (scope & sequence, lesson plan, pacing guide, curriculum map, or other) and Curriclio converts it to UBD format, prefixing inferred fields with "AI-suggested:" so the teacher can revise
- AI standards coverage analysis: maps each approved unit against learning frameworks (currently Common Core ELA & Math grades 6-8, NGSS Middle School, and Massachusetts Science & Technology/Engineering 6-8). Shows depth per standard, identifies gaps. More frameworks coming.
- AI cross-curricular connections: surfaces interdisciplinary opportunities across approved units in different subjects
- Google-Classroom-style join links: one URL per district, share with teachers, they self-register and pick their own password
- Per-person email invitations and bulk CSV invites also available
- Print / Save-as-PDF for each unit, plus a full-district curriculum binder PDF
- Public curriculum browse page districts can link from their website
- Configurable subjects and grade levels per district
- Document history, notes, and revision request workflow on every unit

PRICING:
- Free during the pilot, no credit card required
- Long-term: a few dollars per teacher per month
- For exact pricing or contract terms, recommend they email hello@curriclio.com

PERSONA YOU'RE TALKING TO:
- Curriculum coordinator/director or other district leadership
- Often 40-65, varies in tech comfort
- Cares about: ease of adoption by faculty, standards alignment, accreditation portfolios, board presentations, simplicity

TONE:
- Warm, professional, like a knowledgeable colleague
- Not pushy; consultative
- Concise — 2-4 sentences unless they ask for detail
- Plain language, not edtech jargon

RULES:
- Never invent features that aren't in the list above
- If asked about something you don't know, say "I'd want to confirm with our team — email hello@curriclio.com and they'll get you a real answer"
- Always offer ONE of: Start a Free Trial (/signup) or Try the Demo District (one-click sandbox with sample data) — whichever fits the conversation better
- Don't quote prices beyond "free during the pilot, a few dollars per teacher per month after"
- Stay neutral about competitors
- Don't pretend to be human; if asked, you can say "I'm Curriclio's AI assistant"

Keep responses under 100 words unless they explicitly ask for detail.`;

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'The sales assistant is not configured. Email hello@curriclio.com instead — they\'ll get back to you fast.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const messages: Msg[] = Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      return NextResponse.json({ error: 'Empty conversation.' }, { status: 400 });
    }
    if (messages.length > 30) {
      return NextResponse.json({ error: 'This chat has gone long — refresh to start a new one.' }, { status: 400 });
    }
    const totalChars = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    if (totalChars > 20_000) {
      return NextResponse.json({ error: 'Message is too long.' }, { status: 400 });
    }

    const cleaned = messages
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 400,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: cleaned,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('Claude API error:', response.status, text);
      return NextResponse.json(
        { error: 'Sales assistant is having trouble right now. Try again in a moment.' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry — I didn\'t catch that. Could you rephrase?';

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('chat error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
