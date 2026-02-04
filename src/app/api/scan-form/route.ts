import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// The Master List of BMU Faculties & Departments for the AI to cross-reference
const BMU_STRUCTURE = `
FACULTIES: Basic Clinical Sciences, Basic Medical Sciences, Clinical Sciences, Dentistry, Health Sciences, Pharmaceutical Sciences, Science.
DEPARTMENTS: Anatomy Pathology, Biochemistry, Biology, Chemistry, Community Health, Computer Science, Dental Therapy, Dental Technology, Health Care Administration and Hospital Management, Health Information, Human Anatomy, Human Nutrition and Dietetics, Human Physiology, Mathematics, Medical Laboratory Science, Medicine and Surgery, Microbiology, Nursing Science, Optometry, Pharmacy, Physics with Electronics, Physiotherapy, Public Health, Radiography and Radiation Science, Statistics.
`;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a professional Registry Assistant at Bayelsa Medical University (BMU). 
              Task: Extract data from the provided Student Registration Form.
              
              Academic Structure Reference:
              ${BMU_STRUCTURE}

              Instructions:
              1. Extract Student Name and Matric Number.
              2. Extract all Course Codes (e.g., MTH 101, BIO 102).
              3. Identify the Faculty and Department. Ensure the names match the "Academic Structure Reference" exactly.
              
              Return ONLY a valid JSON object with these exact keys: 
              "studentName", "matricNo", "courses" (array), "faculty", "department".`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.type};base64,${base64Data}`,
              },
            },
          ],
        },
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      response_format: { type: "json_object" },
      temperature: 0.1, 
    });

    const rawContent = chatCompletion.choices[0].message.content;
    if (!rawContent) throw new Error("AI returned an empty response");

    const aiData = JSON.parse(rawContent);
    return NextResponse.json(aiData);

  } catch (error: any) {
    console.error("🚨 GROQ ERROR:", error.message || error);
    return NextResponse.json(
      { error: "AI processing failed", details: error.message }, 
      { status: 500 }
    );
  }
}