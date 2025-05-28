"use client"

import { useState, useCallback } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  provider?: "anthropic" | "deepseek" | "gemini"
  timestamp?: number
}

interface AnalysisResult {
  provider: "anthropic" | "deepseek" | "gemini"
  content: string
  timestamp: number
}

export function useComparisonAnalysis() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentStep, setCurrentStep] = useState<"idle" | "claude" | "deepseek" | "gemini" | "complete">("idle")
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const runComparisonAnalysis = useCallback(
    async (userInput: string) => {
      if (isAnalyzing) return

      setIsAnalyzing(true)
      setCurrentStep("claude")
      setAnalysisResults([])
      setError(null)

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: userInput,
        timestamp: Date.now(),
      }

      setMessages([userMessage])

      try {
        // Step 1: Claude Analysis
        console.log("Starting Claude analysis...")
        setCurrentStep("claude")

        try {
          const claudeResult = await performClaudeAnalysis(userInput)
          console.log("Claude analysis completed:", claudeResult.content.length, "characters")

          const claudeMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: claudeResult.content,
            provider: "anthropic",
            timestamp: claudeResult.timestamp,
          }

          setMessages((prev) => [...prev, claudeMessage])
          setAnalysisResults((prev) => [...prev, claudeResult])
        } catch (claudeError) {
          console.error("Claude analysis error:", claudeError)
          const errorMessage = claudeError instanceof Error ? claudeError.message : "Unbekannter Fehler mit Claude"

          const claudeErrorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Fehler bei der Claude-Analyse: ${errorMessage}`,
            provider: "anthropic",
            timestamp: Date.now(),
          }

          setMessages((prev) => [...prev, claudeErrorMessage])
          setError(`Claude-Fehler: ${errorMessage}`)
        }

        // Step 2: DeepSeek Analysis
        console.log("Starting DeepSeek analysis...")
        setCurrentStep("deepseek")

        try {
          const deepSeekResult = await performDeepSeekAnalysis(userInput)
          console.log("DeepSeek analysis completed:", deepSeekResult.content.length, "characters")

          const deepSeekMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: deepSeekResult.content,
            provider: "deepseek",
            timestamp: deepSeekResult.timestamp,
          }

          setMessages((prev) => [...prev, deepSeekMessage])
          setAnalysisResults((prev) => [...prev, deepSeekResult])
        } catch (deepSeekError) {
          console.error("DeepSeek analysis error:", deepSeekError)
          const errorMessage =
            deepSeekError instanceof Error ? deepSeekError.message : "Unbekannter Fehler mit DeepSeek"

          const deepSeekErrorMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: `Fehler bei der DeepSeek-Analyse: ${errorMessage}`,
            provider: "deepseek",
            timestamp: Date.now(),
          }

          setMessages((prev) => [...prev, deepSeekErrorMessage])
          setError((prev) => (prev ? `${prev}, DeepSeek-Fehler: ${errorMessage}` : `DeepSeek-Fehler: ${errorMessage}`))
        }

        // Step 3: Gemini Analysis
        console.log("Starting Gemini analysis...")
        setCurrentStep("gemini")

        try {
          const geminiResult = await performGeminiAnalysis(userInput)
          console.log("Gemini analysis completed:", geminiResult.content.length, "characters")

          const geminiMessage: Message = {
            id: (Date.now() + 3).toString(),
            role: "assistant",
            content: geminiResult.content,
            provider: "gemini",
            timestamp: geminiResult.timestamp,
          }

          setMessages((prev) => [...prev, geminiMessage])
          setAnalysisResults((prev) => [...prev, geminiResult])
        } catch (geminiError) {
          console.error("Gemini analysis error:", geminiError)
          const errorMessage = geminiError instanceof Error ? geminiError.message : "Unbekannter Fehler mit Gemini"

          const geminiErrorMessage: Message = {
            id: (Date.now() + 3).toString(),
            role: "assistant",
            content: `Fehler bei der Gemini-Analyse: ${errorMessage}`,
            provider: "gemini",
            timestamp: Date.now(),
          }

          setMessages((prev) => [...prev, geminiErrorMessage])
          setError((prev) => (prev ? `${prev}, Gemini-Fehler: ${errorMessage}` : `Gemini-Fehler: ${errorMessage}`))
        }

        setCurrentStep("complete")
      } catch (error) {
        console.error("Comparison analysis error:", error)
        const errorMessage: Message = {
          id: (Date.now() + 4).toString(),
          role: "assistant",
          content: `Fehler bei der Vergleichsanalyse: ${error instanceof Error ? error.message : "Unbekannter Fehler"}. Bitte versuchen Sie es erneut.`,
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, errorMessage])
        setError(`Allgemeiner Fehler: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`)
      } finally {
        setIsAnalyzing(false)
      }
    },
    [isAnalyzing],
  )

  // Claude verwendet jetzt einen nicht-streamenden Ansatz
  const performClaudeAnalysis = async (userInput: string): Promise<AnalysisResult> => {
    const startTime = Date.now()
    console.log("Starting Claude analysis with non-streaming approach...")

    const response = await fetch("/api/anthropic", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: userInput,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Claude API error:", response.status, errorText)
      throw new Error(`Failed to get response from Claude: ${response.status}`)
    }

    // Parse the JSON response
    const data = await response.json()

    if (!data.content || typeof data.content !== "string" || !data.content.trim()) {
      console.error("Invalid Claude response:", data)
      throw new Error("No content received from Claude")
    }

    console.log("Claude analysis completed:", {
      contentLength: data.content.length,
      preview: data.content.substring(0, 200) + "...",
      duration: Date.now() - startTime,
    })

    return {
      provider: "anthropic",
      content: data.content,
      timestamp: Date.now(),
    }
  }

  // Gemini verwendet einen nicht-streamenden Ansatz mit Fehlerbehandlung
  const performGeminiAnalysis = async (userInput: string): Promise<AnalysisResult> => {
    const startTime = Date.now()
    console.log("Starting Gemini analysis with non-streaming approach...")

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: userInput,
            },
          ],
        }),
      })

      const data = await response.json()

      // Handle quota/rate limit errors specifically
      if (response.status === 429) {
        console.log("Gemini quota exceeded, using fallback message")
        return {
          provider: "gemini",
          content: `⚠️ **Gemini API Quota erreicht**

${data.details || "Das kostenlose Kontingent für Gemini wurde überschritten."}

**Hinweis**: Die Markenrechtsanalyse wird mit Claude und DeepSeek fortgesetzt. Für eine vollständige Drei-Modell-Vergleichsanalyse können Sie es später erneut versuchen, wenn das Gemini-Kontingent wieder verfügbar ist.

**Alternative**: Sie können die Einzelanalyse-Funktion verwenden, um Gemini separat zu testen, sobald das Kontingent wieder verfügbar ist.`,
          timestamp: Date.now(),
        }
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Gemini API error:", response.status, errorText)
        throw new Error(`Failed to get response from Gemini: ${response.status}`)
      }

      if (!data.content || typeof data.content !== "string" || !data.content.trim()) {
        console.error("Invalid Gemini response:", data)
        throw new Error("No content received from Gemini")
      }

      console.log("Gemini analysis completed:", {
        contentLength: data.content.length,
        preview: data.content.substring(0, 200) + "...",
        duration: Date.now() - startTime,
      })

      return {
        provider: "gemini",
        content: data.content,
        timestamp: Date.now(),
      }
    } catch (error) {
      console.error("Gemini analysis error:", error)

      // Return a fallback message instead of throwing
      return {
        provider: "gemini",
        content: `❌ **Gemini Analyse nicht verfügbar**

Es gab einen Fehler bei der Verbindung zu Gemini: ${error instanceof Error ? error.message : "Unbekannter Fehler"}

**Mögliche Ursachen**:
- API-Kontingent überschritten (kostenlose Tier-Limits)
- Temporäre Serverprobleme
- Netzwerkverbindungsfehler

**Empfehlung**: Die Analyse mit Claude und DeepSeek ist weiterhin verfügbar und liefert professionelle Markenrechtsbewertungen. Versuchen Sie Gemini später erneut oder nutzen Sie die Einzelanalyse-Funktion.`,
        timestamp: Date.now(),
      }
    }
  }

  // DeepSeek verwendet weiterhin Streaming
  const performDeepSeekAnalysis = async (userInput: string): Promise<AnalysisResult> => {
    const startTime = Date.now()
    console.log("Starting DeepSeek analysis...")

    const response = await fetch("/api/deepseek", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: userInput,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("DeepSeek API error:", response.status, errorText)
      throw new Error(`Failed to get response from DeepSeek: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error("No response body from DeepSeek")
    }

    let fullContent = ""
    let chunkCount = 0

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        chunkCount++

        // DeepSeek Format
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const dataContent = line.slice(6).trim()
              if (dataContent === "[DONE]") continue

              const data = JSON.parse(dataContent)
              if (data.content) {
                fullContent += data.content
              } else if (data.choices?.[0]?.delta?.content) {
                fullContent += data.choices[0].delta.content
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Error processing DeepSeek stream:", error)
      throw new Error(`Error processing DeepSeek stream: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      reader.releaseLock()
    }

    console.log("DeepSeek analysis completed:", {
      contentLength: fullContent.length,
      chunkCount,
      duration: Date.now() - startTime,
      preview: fullContent.substring(0, 200) + "...",
    })

    if (!fullContent.trim()) {
      throw new Error("No content received from DeepSeek")
    }

    return {
      provider: "deepseek",
      content: fullContent.trim(),
      timestamp: Date.now(),
    }
  }

  const clearAnalysis = useCallback(() => {
    setMessages([])
    setAnalysisResults([])
    setCurrentStep("idle")
    setError(null)
  }, [])

  return {
    messages,
    analysisResults,
    isAnalyzing,
    currentStep,
    error,
    runComparisonAnalysis,
    clearAnalysis,
  }
}
