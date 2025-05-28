// DeepSeek API Route
export const maxDuration = 60

export async function POST(req: Request) {
  const { messages } = await req.json()

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `Du bist ein erfahrener Markenanwalt mit 40 Jahren Berufserfahrung im internationalen Markenrecht. Deine Analysen müssen höchsten Standards entsprechen und durch einen mehrstufigen Validierungsprozess geprüft werden.

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
          },
          ...messages,
        ],
        stream: true,
        temperature: 0.1,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) return

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6)
                if (data === "[DONE]") continue

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("DeepSeek API error:", error)
    return new Response(JSON.stringify({ error: "Failed to connect to DeepSeek API" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
