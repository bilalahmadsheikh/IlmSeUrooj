import { NextRequest } from 'next/server';

// Ollama local model config
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

/**
 * POST /api/sop-draft
 * AI-assisted essay/SOP drafting using local Ollama (Llama 3).
 * Body: { university: string, program: string, profile: object, fieldLabel: string, maxLength?: number }
 */
export async function POST(req: NextRequest) {
    const body = await req.json();

    if (!body.university || !body.fieldLabel) {
        return Response.json(
            { error: 'Missing required fields: university, fieldLabel' },
            { status: 400 }
        );
    }

    const profile = body.profile || {};
    const maxLength = body.maxLength || 500;

    const prompt = `You are helping a Pakistani student draft a ${body.fieldLabel} for their university application.

CONTEXT:
- University: ${body.university}
- Program: ${body.program || 'Not specified'}
- Student Name: ${profile.full_name || 'Student'}
- City: ${profile.city || 'Pakistan'}
- FSc Marks: ${profile.fsc_marks || 'N/A'}/${profile.fsc_total || 'N/A'}
- Board: ${profile.board_name || 'N/A'}

INSTRUCTIONS:
- Write a draft of approximately ${maxLength} characters
- Be authentic and personal — avoid generic phrases
- Focus on genuine motivation and specific interests
- Reference the university and program specifically
- Use a natural, confident tone appropriate for a Pakistani student
- Do NOT include placeholder brackets like [insert here]
- This is a DRAFT — the student will personalize it further

Write the draft now:`;

    try {
        const aiResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful academic writing assistant. Write naturally and authentically.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                stream: false,
                options: {
                    temperature: 0.7,
                    num_predict: 2048,
                },
            }),
        });

        if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            return Response.json(
                { error: 'Local AI draft generation failed', detail: errText },
                { status: 502 }
            );
        }

        const aiData = await aiResponse.json();
        const draft = aiData.message?.content || '';

        return Response.json({
            draft,
            charCount: draft.length,
            model: OLLAMA_MODEL,
            note: 'Please review and personalize this draft before inserting.',
        });
    } catch (err) {
        return Response.json(
            { error: 'Draft generation failed — is Ollama running?', detail: (err as Error).message },
            { status: 500 }
        );
    }
}
