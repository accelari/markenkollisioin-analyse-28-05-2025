import { supabase } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Generate case number
    const caseNumber = `TM-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    const caseData = {
      case_number: caseNumber,
      status: "active",
      auftragsmarke: body.auftragsmarke,
      gegenmarke: body.gegenmarke,
      claude_analysis: body.claude_analysis,
      deepseek_analysis: body.deepseek_analysis,
      gemini_analysis: body.gemini_analysis,
      openai_analysis: body.openai_analysis,
      final_analysis: body.final_analysis,
      recommendation: body.recommendation,
      confidence_level: body.confidence_level,
      client_email: body.client_email,
      client_name: body.client_name,
      opposition_prepared: true,
      opposition_email_sent: false,
      analysis_date: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("cases").insert([caseData]).select().single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error", details: error.message }, { status: 500 })
    }

    // Generate case URL
    const caseUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/case/${data.case_number}`

    return NextResponse.json({
      success: true,
      case_number: data.case_number,
      case_url: caseUrl,
      case_id: data.id,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
