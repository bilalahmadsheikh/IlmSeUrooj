import { NextRequest } from 'next/server';
import { createPublicClient } from '@/lib/supabase';

// Ollama local model config
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

const FIELD_MAPPING_PROMPT = `You are mapping a university registration form to a student profile schema.

PROFILE FIELDS:
full_name, father_name, cnic (format: XXXXX-XXXXXXX-X), date_of_birth,
gender, email, phone, address, city, province, fsc_marks, fsc_total,
fsc_percentage, matric_marks, matric_total, matric_percentage,
board_name, passing_year, school_name

FORM HTML:
{FORM_HTML}

Return ONLY a JSON array (no explanation, no markdown, no extra text):
[{
  "selector": "#css-selector or [name=fieldname]",
  "profileKey": "exact_profile_field",
  "label": "Human readable label",
  "required": true/false,
  "inputType": "text|select|file|radio|checkbox|textarea",
  "transform": null | "percent_to_marks_1100" | "percent_to_marks_1050" | "marks_to_percent" | "date_dmy" | "date_ymd" | "phone_pak" | "cnic_dashes" | "cnic_no_dashes"
}]
Only include fields you are confident about. Use the most specific CSS selector possible.
IMPORTANT: Return ONLY the JSON array, nothing else.`;

/**
 * GET /api/fieldmap?domain=admissions.nust.edu.pk
 */
export async function GET(req: NextRequest) {
    const domain = req.nextUrl.searchParams.get('domain');

    if (!domain) {
        return Response.json(
            { error: 'Missing required query parameter: domain' },
            { status: 400 }
        );
    }

    const supabase = createPublicClient();

    const { data, error } = await supabase
        .from('field_maps')
        .select('*')
        .eq('domain', domain)
        .single();

    if (error && error.code === 'PGRST116') {
        return Response.json({
            mapping: null,
            message: `No field mapping cached for domain: ${domain}`,
        });
    }

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ fieldMap: data });
}

/**
 * POST /api/fieldmap
 * AI-powered field mapping using local Ollama (Llama 3).
 * Body: { domain: string, formHTML: string, universitySlug?: string }
 */
export async function POST(req: NextRequest) {
    const body = await req.json();

    if (!body.domain || !body.formHTML) {
        return Response.json(
            { error: 'Missing required fields: domain, formHTML' },
            { status: 400 }
        );
    }

    const supabase = createPublicClient();

    // 1. Check cache first
    const { data: cached } = await supabase
        .from('field_maps')
        .select('*')
        .eq('domain', body.domain)
        .single();

    if (cached) {
        return Response.json({
            fieldMap: cached,
            source: 'cache',
        });
    }

    // 2. Call local Ollama for AI mapping
    const trimmedHTML = body.formHTML.substring(0, 6000);
    const prompt = FIELD_MAPPING_PROMPT.replace('{FORM_HTML}', trimmedHTML);

    try {
        const aiResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a JSON-only assistant. Always respond with valid JSON arrays only. No explanation, no markdown.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                stream: false,
                options: {
                    temperature: 0.1,
                    num_predict: 4096,
                },
            }),
        });

        if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            console.error('[fieldmap] Ollama error:', errText);
            return Response.json(
                { error: 'Local AI mapping failed', detail: errText },
                { status: 502 }
            );
        }

        const aiData = await aiResponse.json();
        const rawText = aiData.message?.content || '';

        // Parse the JSON array from the response
        let mapping;
        try {
            const jsonMatch = rawText.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON array found in AI response');
            }
            mapping = JSON.parse(jsonMatch[0]);
        } catch (parseErr) {
            console.error('[fieldmap] Failed to parse AI response:', rawText.substring(0, 500));
            return Response.json(
                { error: 'Failed to parse AI mapping response', rawText: rawText.substring(0, 500) },
                { status: 502 }
            );
        }

        if (!Array.isArray(mapping) || mapping.length === 0) {
            return Response.json(
                { error: 'AI returned empty or invalid mapping' },
                { status: 502 }
            );
        }

        // 3. Store in field_maps table
        const universitySlug = body.universitySlug || body.domain.split('.')[0];
        const { data: stored, error: storeErr } = await supabase
            .from('field_maps')
            .insert({
                domain: body.domain,
                university_slug: universitySlug,
                mapping: mapping,
                verified_working: false,
            })
            .select()
            .single();

        if (storeErr) {
            console.error('[fieldmap] Storage error:', storeErr);
            return Response.json({
                fieldMap: { domain: body.domain, mapping },
                source: 'ai-local',
                storageError: storeErr.message,
            });
        }

        return Response.json({
            fieldMap: stored,
            source: 'ai-local',
        });
    } catch (err) {
        console.error('[fieldmap] Unexpected error:', err);
        return Response.json(
            { error: 'AI mapping request failed — is Ollama running?', detail: (err as Error).message },
            { status: 500 }
        );
    }
}
