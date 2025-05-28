// Gemini API Route with improved error handling
export const maxDuration = 60

export async function POST(req: Request) {
  const { messages } = await req.json()

  try {
    console.log("Starting Gemini API call with messages:", JSON.stringify(messages).substring(0, 100) + "...")

    // Konvertiere die Messages in das Gemini-Format
    const geminiMessages = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }))

    // System-Prompt als erste Nachricht hinzufügen
    const systemPrompt = `Du bist ein erfahrener Markenanwalt mit 40 Jahren Berufserfahrung im internationalen Markenrecht. Deine Analysen müssen höchsten Standards entsprechen und durch einen mehrstufigen Validierungsprozess geprüft werden.

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

WICHTIG: Du darfst NUR dann eine endgültige Empfehlung abgeben, wenn alle vier Validierungsmethoden ein konsistentes Ergebnis liefern. Bei Inkonsistenzen musst du deine Analyse überarbeiten, bis ein stimmiges Gesamtbild entsteht.`

    // Füge System-Prompt als erste User-Nachricht hinzu
    const fullMessages = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [
          {
            text: "Verstanden. Ich bin bereit, eine professionelle Markenrechtsanalyse nach den genannten Kriterien durchzuführen. Bitte beschreiben Sie den zu analysierenden Markenrechtsfall.",
          },
        ],
      },
      ...geminiMessages,
    ]

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: fullMessages,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4000,
            topP: 0.8,
            topK: 40,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API error:", response.status, errorText)

      // Handle specific error cases
      if (response.status === 429) {
        const errorData = JSON.parse(errorText)
        const retryAfter = errorData.error?.details?.find((d: any) => d["@type"]?.includes("RetryInfo"))?.retryDelay

        return new Response(
          JSON.stringify({
            error: "Gemini API Quota erreicht",
            details: `Das kostenlose Kontingent für Gemini wurde überschritten. ${retryAfter ? `Versuchen Sie es in ${retryAfter} erneut.` : "Bitte versuchen Sie es später erneut."}`,
            fallback: "Die Analyse wird mit Claude und DeepSeek fortgesetzt.",
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("Gemini API response:", JSON.stringify(data).substring(0, 200) + "...")

    // Extrahiere den Text aus der Gemini-Antwort
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content || typeof content !== "string" || !content.trim()) {
      console.error("Invalid Gemini response:", data)
      throw new Error("No content received from Gemini")
    }

    console.log("Gemini API call completed, text length:", content.length)

    // Return the complete response as JSON
    return new Response(JSON.stringify({ content: content }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Gemini API error:", error)

    // Return a more user-friendly error message
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"

    return new Response(
      JSON.stringify({
        error: "Gemini API nicht verfügbar",
        details:
          errorMessage.includes("429") || errorMessage.includes("quota")
            ? "Das kostenlose Kontingent für Gemini wurde überschritten. Die Analyse wird mit Claude und DeepSeek fortgesetzt."
            : `Verbindungsfehler zu Gemini: ${errorMessage}`,
        fallback: true,
      }),
      {
        status: error instanceof Error && error.message.includes("429") ? 429 : 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
