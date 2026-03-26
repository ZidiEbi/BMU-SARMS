import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status })
}

function normalizeRole(role: unknown) {
  const value = String(role || '').trim()
  if (!value) return ''
  if (value === 'SUPER_ADMIN') return 'super_admin'
  return value.toLowerCase().replace(/\s+/g, '_')
}

function extractJsonText(payload: any) {
  const text =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text || '')
      .join('') || ''

  return text.trim()
}

function parseJsonSafely(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function normalizeSession(value: unknown) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '')
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return jsonError('Unauthorized. Please sign in again.', 401, {
        message: authError?.message,
      })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return jsonError('Unable to verify your profile.', 403, {
        message: profileError?.message,
      })
    }

    const role = normalizeRole(profile.role)
    const allowedRoles = new Set(['registry', 'admin', 'super_admin'])

    if (!allowedRoles.has(role)) {
      return jsonError('Only Registry or Admin users can scan enrollment forms.', 403, {
        role,
      })
    }

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return jsonError('No file uploaded.')
    }

    const supportedMimeTypes = new Set([
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
    ])

    if (!supportedMimeTypes.has(file.type)) {
      return jsonError('Unsupported file type. Upload a PDF, PNG, JPG, or WEBP file.')
    }

    const maxBytes = 15 * 1024 * 1024
    if (file.size > maxBytes) {
      return jsonError('File is too large. Please upload a file under 15MB.')
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return jsonError('Server misconfigured: GEMINI_API_KEY is missing.', 500)
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64Data = buffer.toString('base64')

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        session: { type: 'STRING' },
        admission_year: { type: 'STRING' },
        student: {
          type: 'OBJECT',
          properties: {
            surname: { type: 'STRING' },
            other_names: { type: 'STRING' },
            full_name: { type: 'STRING' },
            matric_number: { type: 'STRING' },
            faculty: { type: 'STRING' },
            department: { type: 'STRING' },
            programme_of_study: { type: 'STRING' },
            year_of_study: { type: 'STRING' },
            sex: { type: 'STRING' },
            registered_number_of_courses: { type: 'NUMBER' },
            total_number_of_units: { type: 'NUMBER' },
          },
          required: ['full_name', 'matric_number'],
        },
        first_semester: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              course_code: { type: 'STRING' },
              course_title: { type: 'STRING' },
              course_status: { type: 'STRING' },
              unit: { type: 'NUMBER' },
            },
          },
        },
        second_semester: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              course_code: { type: 'STRING' },
              course_title: { type: 'STRING' },
              course_status: { type: 'STRING' },
              unit: { type: 'NUMBER' },
            },
          },
        },
        notes: { type: 'STRING' },
      },
      required: ['student', 'first_semester', 'second_semester'],
    }

    const prompt = `
You are extracting structured registry data from a university student course enrolment form.

Return valid JSON only.

Rules:
- Extract the academic session shown on the form, like 2023/2024.
- Extract admission year if present. If the form shows admission session like 2023/2024, admission_year should be the first year only, e.g. 2023.
- Build student.full_name from surname + other names when needed.
- Preserve matric number exactly as much as possible.
- For sex, return only M, F, or empty string if not visible.
- For year_of_study, return values like 100, 200, 300, 400, 500, 600 where possible.
- Extract course rows into first_semester and second_semester separately.
- Ignore signature fields, stamps, empty table rows, and decorative text.
- Only include rows that look like actual registered courses.
- If a field is unclear, use empty string for text fields and null-like omission is not allowed because schema expects strings; prefer empty string.
- Units should be numeric when visible.
- notes should briefly mention major uncertainty, if any.

Important:
- This is a Nigerian university course enrolment form.
- Course code matching later will rely heavily on course_code values, so preserve them carefully.
`

    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: file.type,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema,
          },
        }),
      }
    )

    const raw = await geminiResponse.json()

    if (!geminiResponse.ok) {
      return jsonError('Gemini extraction failed.', 502, {
        providerError: raw,
      })
    }

    const text = extractJsonText(raw)
    const parsed = parseJsonSafely(text)

    if (!parsed) {
      return jsonError('Could not parse structured scan output.', 502, {
        rawText: text,
      })
    }

    const normalized = {
      session: normalizeSession(parsed.session || ''),
      admission_year: String(parsed.admission_year || '').trim(),
      student: {
        surname: String(parsed?.student?.surname || '').trim(),
        other_names: String(parsed?.student?.other_names || '').trim(),
        full_name: String(parsed?.student?.full_name || '').trim(),
        matric_number: String(parsed?.student?.matric_number || '')
          .trim()
          .toUpperCase(),
        faculty: String(parsed?.student?.faculty || '').trim(),
        department: String(parsed?.student?.department || '').trim(),
        programme_of_study: String(parsed?.student?.programme_of_study || '').trim(),
        year_of_study: String(parsed?.student?.year_of_study || '').trim(),
        sex: String(parsed?.student?.sex || '').trim().toUpperCase(),
        registered_number_of_courses:
          typeof parsed?.student?.registered_number_of_courses === 'number'
            ? parsed.student.registered_number_of_courses
            : null,
        total_number_of_units:
          typeof parsed?.student?.total_number_of_units === 'number'
            ? parsed.student.total_number_of_units
            : null,
      },
      first_semester: Array.isArray(parsed.first_semester)
        ? parsed.first_semester.map((row: any) => ({
            course_code: String(row?.course_code || '').trim().toUpperCase(),
            course_title: String(row?.course_title || '').trim(),
            course_status: String(row?.course_status || '').trim(),
            unit: typeof row?.unit === 'number' ? row.unit : null,
          }))
        : [],
      second_semester: Array.isArray(parsed.second_semester)
        ? parsed.second_semester.map((row: any) => ({
            course_code: String(row?.course_code || '').trim().toUpperCase(),
            course_title: String(row?.course_title || '').trim(),
            course_status: String(row?.course_status || '').trim(),
            unit: typeof row?.unit === 'number' ? row.unit : null,
          }))
        : [],
      notes: String(parsed.notes || '').trim(),
    }

    return NextResponse.json({
      ok: true,
      extracted: normalized,
      meta: {
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      },
    })
  } catch (error) {
    return jsonError('Unexpected server error while scanning form.', 500, {
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}