// OpenAI API Route
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages } = await req.json()

  try {
    console.log("Starting OpenAI API call with messages:", JSON.stringify(messages).substring(0, 100) + "...")

    const result = await generateText({
      model: openai("gpt-4o"),
      messages,
      system: `Du bist ein erfahrener Markenanwalt mit 40 Jahren Berufserfahrung im internationalen Markenrecht. Deine Analysen müssen höchsten Standards entsprechen und durch einen mehrstufigen Validierungsprozess geprüft werden.

Analysiere den folgenden Markenrechtsfall basierend auf diesen VERBINDLICHEN rechtlichen Kriterien:

1. Verwechslungsgefahr: 
 a) Prüfe die visuelle, klangliche und konzeptionelle Ähnlichkeit der Marken
 b) Recherchiere die EXAKTEN Waren/Dienstleistungsverzeichnisse aus dem spezifischen Markenregister
 c) Bewerte die Ähnlichkeit der Waren/Dienstleistungen nach lokaler Rechtsprechung

2. Priorität: Prüfe die Anmeldedaten im jeweiligen Register
3. Unterscheidungskraft: Bewerte nach den Maßstäben des jeweiligen Landes
4. Verkehrsgeltung: Berücksichtige die territoriale Bekanntheit
5. Benutzungslage: Prüfe nach lokalem Recht
6. Territoriale Besonderheiten: Berücksichtige lokale Regelungen

VALIDIERUNGSPROZESS - Du MUSST deine Analyse durch folgende Methoden validieren:

A. RECHTSPRECHUNGSVERGLEICH:
 - Recherchiere mindestens zwei vergleichbare Präzedenzfälle aus der relevanten Jurisdiktion
 - Prüfe, ob deine Schlussfolgerung mit der etablierten Rechtsprechung übereinstimmt
 - Bei Abweichungen: Begründe detailliert, warum dein Fall anders zu bewerten ist

B. GEGENPRÜFUNG:
 - Formuliere aktiv Gegenargumente zu deiner eigenen Einschätzung
 - Stelle die stärksten Argumente gegen deine Position dar
 - Bewerte, ob diese Gegenargumente deine ursprüngliche Analyse widerlegen

C. NUMERISCHE BEWERTUNG:
 - Bewerte jedes der sechs Hauptkriterien auf einer Skala von 0-10
 - Berechne einen gewichteten Gesamtwert für die Erfolgsaussichten
 - Prüfe, ob dieser numerische Wert mit deiner qualitativen Einschätzung übereinstimmt

D. KONSISTENZPRÜFUNG:
 - Prüfe deine Argumentation auf innere Widersprüche
 - Stelle sicher, dass alle Fakten korrekt und konsistent berücksichtigt wurden
 - Überprüfe, ob alle relevanten Markenklassen und ihre Ähnlichkeiten korrekt bewertet wurden

Deine Antwort MUSS diesem Format folgen:
1. Widerspruch: Ja/Nein
2. Erfolgsaussichten: XX% (falls Widerspruch empfohlen)
3. Zusammenfassung: 3-5 Sätze zum Sachverhalt
4. Detaillierte Analyse: Systematische Prüfung aller sechs Kriterien
5. Validierungsergebnisse:
 a) Rechtsprechungsvergleich: Identifizierte Präzedenzfälle und Bewertung
 b) Gegenprüfung: Stärkste Gegenargumente und deren Widerlegung/Bestätigung
 c) Numerische Bewertung: Einzelwerte und gewichteter Gesamtwert
 d) Konsistenzprüfung: Bestätigung der Widerspruchsfreiheit oder Korrektur

WICHTIG: Du darfst NUR dann eine endgültige Empfehlung abgeben, wenn alle vier Validierungsmethoden ein konsistentes Ergebnis liefern. Bei Inkonsistenzen musst du deine Analyse überarbeiten, bis ein stimmiges Gesamtbild entsteht.`,
      temperature: 0.2,
      maxTokens: 4000,
    })

    console.log("OpenAI API call completed, text length:", result.text.length)

    // Return the complete response as JSON
    return new Response(JSON.stringify({ content: result.text }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("OpenAI API error:", error)

    // Spezifische Fehlerbehandlung für Rate Limits
    if (error instanceof Error && error.message.includes("429")) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API Quota erreicht",
          details: "Das Kontingent für OpenAI wurde überschritten. Bitte versuchen Sie es später erneut.",
          fallback: "Die Analyse wird mit den anderen Modellen fortgesetzt.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return new Response(JSON.stringify({ error: "Failed to connect to OpenAI API", details: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
