import { NextRequest } from 'next/server';

// Ollama local model config
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

// 30-second hard timeout so a slow/offline Ollama never hangs the server
const REQUEST_TIMEOUT_MS = 30_000;

// Sanitize a string: strip control chars, limit length
function sanitizeText(val: unknown, maxLen: number): string {
    if (!val || typeof val !== 'string') return '';
    return val
        .replace(/[\x00-\x1F\x7F]/g, ' ') // strip control characters (prevents prompt injection)
        .trim()
        .slice(0, maxLen);
}

/**
 * POST /api/sop-draft
 * AI-assisted essay/SOP drafting using local Ollama (Llama 3).
 * Body: { university: string, program: string, profile: object, fieldLabel: string, maxLength?: number }
 */
export async function POST(req: NextRequest) {
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const university = sanitizeText(body.university, 200);
    const fieldLabel = sanitizeText(body.fieldLabel, 100);
    const program = sanitizeText(body.program, 200);

    if (!university || !fieldLabel) {
        return Response.json(
            { error: 'Missing required fields: university, fieldLabel' },
            { status: 400 }
        );
    }

    const rawProfile = (body.profile && typeof body.profile === 'object')
        ? body.profile as Record<string, unknown>
        : {};
    const maxLength = Math.min(Math.max(Number(body.maxLength) || 500, 100), 2000);

    // Sanitize all profile fields used in the prompt to prevent prompt injection
    const profile = {
        full_name: sanitizeText(rawProfile.full_name, 100) || 'Student',
        city: sanitizeText(rawProfile.city, 100) || 'Pakistan',
        fsc_marks: sanitizeText(rawProfile.fsc_marks, 10) || 'N/A',
        fsc_total: sanitizeText(rawProfile.fsc_total, 10) || 'N/A',
        board_name: sanitizeText(rawProfile.board_name, 100) || 'N/A',
    };

    const prompt = `You are helping a Pakistani student draft a ${fieldLabel} for their university application.

CONTEXT:
- University: ${university}
- Program: ${program || 'Not specified'}
- Student Name: ${profile.full_name}
- City: ${profile.city}
- FSc Marks: ${profile.fsc_marks}/${profile.fsc_total}
- Board: ${profile.board_name}

INSTRUCTIONS:
- Write a draft of approximately ${maxLength} characters
- Be authentic and personal — avoid generic phrases
- Focus on genuine motivation and specific interests
- Reference the university and program specifically
- Use a natural, confident tone appropriate for a Pakistani student
- Do NOT include placeholder brackets like [insert here]
- This is a DRAFT — the student will personalize it further

Write the draft now:`;

    // Abort if Ollama doesn't respond within timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const aiResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
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
            const errText = await aiResponse.text().catch(() => 'Unknown error');
            return Response.json(
                { error: 'Local AI draft generation failed', detail: errText },
                { status: 502 }
            );
        }

        const aiData = await aiResponse.json();
        const draft = typeof aiData.message?.content === 'string' ? aiData.message.content : '';

        return Response.json({
            draft,
            charCount: draft.length,
            model: OLLAMA_MODEL,
            note: 'Please review and personalize this draft before inserting.',
        });
    } catch (err) {
        const isTimeout = (err as Error).name === 'AbortError';
        return Response.json(
            {
                error: isTimeout
                    ? 'Draft generation timed out (30s). Is Ollama running and responsive?'
                    : 'Draft generation failed — is Ollama running?',
                detail: (err as Error).message,
            },
            { status: isTimeout ? 504 : 500 }
        );
    } finally {
        clearTimeout(timeout);
    }
}
