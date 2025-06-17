import { supabase } from "@/lib/supabase"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const caseData = await request.json()

    // Insert case into database
    const { data, error } = await supabase.from("cases").insert([caseData]).select().single()

    if (error) {
      console.error("Supabase error:", error)
      return new Response(JSON.stringify({ error: "Database error", details: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ case: data }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("API error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const caseNumber = searchParams.get("case_number")

    if (!caseNumber) {
      return new Response(JSON.stringify({ error: "Case number required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { data, error } = await supabase.from("cases").select("*").eq("case_number", caseNumber).single()

    if (error) {
      console.error("Supabase error:", error)
      return new Response(JSON.stringify({ error: "Case not found", details: error.message }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ case: data }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("API error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
