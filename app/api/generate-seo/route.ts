import { NextResponse } from "next/server"
import OpenAI from "openai"

const API_KEY = process.env.SEO_OPEN_AI_API_KEY
if (!API_KEY) {
  console.error("Error: Missing SEO_OPEN_AI_API_KEY in environment variables.")
  process.exit(1)
}

const openai = new OpenAI({ apiKey: API_KEY })

export async function POST(request: Request) {
  console.log("API called with rows:", rows)
  const { rows } = await request.json()

  if (!rows || !rows.length) {
    return NextResponse.json({ error: "No rows provided." }, { status: 400 })
  }

  const domains = rows.map((row: any) => row.email.split("@")[1]).join(", ")
  const prompt = `Generate one concise SEO description (1-2 sentences) for each domain below. Return as JSON key-value pairs: ${domains}`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    })

    const content = response.choices[0].message.content || "{}"
    const result = JSON.parse(content)
    console.log(`OpenAI response for prompt:\n${prompt}\nResponse:\n${JSON.stringify(response, null, 2)}`);
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error generating SEO descriptions:", error)
    return NextResponse.json({ error: "Failed to generate SEO descriptions." }, { status: 500 })
  }
}


