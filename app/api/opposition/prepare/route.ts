import { supabase } from "@/lib/supabase"
import type { NextRequest } from "next/server"
import { config } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const { caseId, clientEmail, clientName } = await request.json()

    if (!caseId) {
      return new Response(JSON.stringify({ error: "Case ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get case data
    const { data: caseData, error: caseError } = await supabase.from("cases").select("*").eq("id", caseId).single()

    if (caseError || !caseData) {
      return new Response(JSON.stringify({ error: "Case not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Calculate opposition deadline (typically 3 months from now)
    const oppositionDeadline = new Date()
    oppositionDeadline.setMonth(oppositionDeadline.getMonth() + 3)

    // Update case with client info and opposition preparation
    const { data: updatedCase, error: updateError } = await supabase
      .from("cases")
      .update({
        client_email: clientEmail,
        client_name: clientName,
        opposition_prepared: true,
        opposition_deadline: oppositionDeadline.toISOString().split("T")[0],
        status: "opposition_prepared",
      })
      .eq("id", caseId)
      .select()
      .single()

    if (updateError) {
      console.error("Update error:", updateError)
      return new Response(JSON.stringify({ error: "Failed to update case" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Prepare email content
    const emailContent = generateOppositionEmail(updatedCase)

    const caseUrl = `${config.baseUrl}/case/${updatedCase.case_number}`

    return new Response(
      JSON.stringify({
        success: true,
        case: updatedCase,
        emailContent,
        caseUrl,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("API error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

function generateOppositionEmail(caseData: any) {
  const caseUrl = `${config.baseUrl}/case/${caseData.case_number}`

  return {
    subject: `Markenrechts-Analyse ${caseData.case_number} - Widerspruch empfohlen`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🏛️ Markenrechts-Analyse</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Fall-Nr.: ${caseData.case_number}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #495057; margin-top: 0;">Sehr geehrte/r ${caseData.client_name || "Mandant/in"},</h2>
          
          <p style="color: #6c757d; line-height: 1.6;">
            unsere KI-gestützte Markenrechtsanalyse für Ihren Fall ist abgeschlossen. 
            <strong style="color: #dc3545;">Basierend auf der Analyse wird ein Widerspruch empfohlen.</strong>
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #28a745; margin-top: 0;">📋 Falldetails</h3>
            <p style="margin: 5px 0;"><strong>Auftragsmarke:</strong> ${caseData.auftragsmarke.substring(0, 100)}...</p>
            <p style="margin: 5px 0;"><strong>Gegenmarke:</strong> ${caseData.gegenmarke.substring(0, 100)}...</p>
            <p style="margin: 5px 0;"><strong>Empfehlung:</strong> ${caseData.recommendation || "Widerspruch einlegen"}</p>
            <p style="margin: 5px 0;"><strong>Konfidenz:</strong> ${caseData.confidence_level || "Hoch"}%</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${caseUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
              🔍 Vollständige Analyse & Widerspruch anzeigen
            </a>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffeaa7; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>⏰ Wichtiger Hinweis:</strong> 
              Widerspruchsfrist beachten! Deadline: ${new Date(caseData.opposition_deadline).toLocaleDateString("de-DE")}
            </p>
          </div>
          
          <p style="color: #6c757d; line-height: 1.6; margin-top: 30px;">
            Im verlinkten System finden Sie:
          </p>
          <ul style="color: #6c757d; line-height: 1.6;">
            <li>Vollständige KI-Analyse aller 4 Modelle</li>
            <li>Finale Empfehlung des Haupt-KI-Anwalts</li>
            <li>Vorbereitete Widerspruchsschrift</li>
            <li>E-Mail-Vorlage an den Gegenmarkeninhaber</li>
          </ul>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          
          <p style="color: #6c757d; font-size: 14px; text-align: center; margin: 0;">
            Diese E-Mail wurde automatisch generiert von unserem KI-Markenanwalt-System.<br>
            Bei Fragen kontaktieren Sie uns unter: support@markenanwalt-ki.de
          </p>
        </div>
      </div>
    `,
    text: `
Markenrechts-Analyse ${caseData.case_number} - Widerspruch empfohlen

Sehr geehrte/r ${caseData.client_name || "Mandant/in"},

unsere KI-gestützte Markenrechtsanalyse für Ihren Fall ist abgeschlossen. 
Basierend auf der Analyse wird ein Widerspruch empfohlen.

Falldetails:
- Auftragsmarke: ${caseData.auftragsmarke.substring(0, 100)}...
- Gegenmarke: ${caseData.gegenmarke.substring(0, 100)}...
- Empfehlung: ${caseData.recommendation || "Widerspruch einlegen"}
- Konfidenz: ${caseData.confidence_level || "Hoch"}%

Vollständige Analyse anzeigen: ${caseUrl}

WICHTIG: Widerspruchsfrist beachten! Deadline: ${new Date(caseData.opposition_deadline).toLocaleDateString("de-DE")}

Im verlinkten System finden Sie die vollständige KI-Analyse, vorbereitete Widerspruchsschrift und E-Mail-Vorlage.

Diese E-Mail wurde automatisch generiert von unserem KI-Markenanwalt-System.
    `,
  }
}
