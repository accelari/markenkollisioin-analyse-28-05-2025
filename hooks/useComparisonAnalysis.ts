"use client"

import { useState, useCallback } from "react"

export interface Message {
  // Keep if you plan to use it for user input display or internal logging
  id: string
  role: "user" | "assistant"
  content: string
  provider?: "anthropic" | "deepseek" | "gemini" | "openai"
  timestamp?: number
}

export type AnalysisStep = "idle" | "claude" | "deepseek" | "gemini" | "openai" | "complete" | "final" | "all_complete"

export interface AnalysisResult {
  provider: "anthropic" | "deepseek" | "gemini" | "openai"
  content: string
  timestamp: number
}

export function useComparisonAnalysis() {
  // const [messages, setMessages] = useState<Message[]>([]) // Potentially remove if not displayed
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentStep, setCurrentStep] = useState<AnalysisStep>("idle")
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [finalAnalysis, setFinalAnalysis] = useState<string | null>(null)

  const runComparisonAnalysis = useCallback(
    async (userInput: string) => {
      if (isAnalyzing) return

      setIsAnalyzing(true)
      setCurrentStep("claude")
      setAnalysisResults([])
      setError(null)
      // setMessages([]) // Clear previous messages if they were used

      // Optional: Add user message to internal log if needed
      // const userMessage: Message = {
      //   id: Date.now().toString(),
      //   role: "user",
      //   content: userInput,
      //   timestamp: Date.now(),
      // }
      // setMessages([userMessage])

      const providers: ("anthropic" | "deepseek" | "gemini" | "openai")[] = [
        "anthropic",
        "deepseek",
        "gemini",
        "openai",
      ]
      const steps: ("claude" | "deepseek" | "gemini" | "openai")[] = ["claude", "deepseek", "gemini", "openai"]
      const analysisFunctions = [
        performClaudeAnalysis,
        performDeepSeekAnalysis,
        performGeminiAnalysis,
        performOpenAIAnalysis,
      ]

      let overallError = null
      const currentResults: AnalysisResult[] = []

      for (let i = 0; i < providers.length; i++) {
        const provider = providers[i]
        const step = steps[i]
        const analyzeFn = analysisFunctions[i]

        console.log(`Starting ${provider} analysis...`)
        setCurrentStep(step)

        try {
          const result = await analyzeFn(userInput)
          console.log(`${provider} analysis completed:`, result.content.length, "characters")
          currentResults.push(result)
          setAnalysisResults([...currentResults]) // Update incrementally
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : `Unbekannter Fehler mit ${provider}`
          console.error(`${provider} analysis error:`, e)
          currentResults.push({
            provider,
            content: `❌ Fehler bei der ${getProviderDisplayName(provider)}-Analyse: ${errorMessage}`,
            timestamp: Date.now(),
          })
          setAnalysisResults([...currentResults]) // Update incrementally with error
          overallError = overallError ? `${overallError}, ${provider}-Fehler` : `${provider}-Fehler`
        }
      }

      if (overallError) {
        setError(overallError)
      }
      setCurrentStep("complete")

      // Trigger final analysis if there are any valid results
      if (currentResults.some((r) => r.content && !r.content.startsWith("❌") && !r.content.startsWith("⚠️"))) {
        await performFinalAnalysis(currentResults)
      } else {
        // If all initial analyses failed, skip final analysis
        setCurrentStep("all_complete")
      }

      setIsAnalyzing(false)
    },
    [isAnalyzing],
  )

  const getProviderDisplayName = (provider: "anthropic" | "deepseek" | "gemini" | "openai") => {
    switch (provider) {
      case "anthropic":
        return "Claude"
      case "deepseek":
        return "DeepSeek"
      case "gemini":
        return "Gemini"
      case "openai":
        return "GPT-4o"
      default:
        return provider
    }
  }

  // Claude
  const performClaudeAnalysis = async (userInput: string): Promise<AnalysisResult> => {
    const response = await fetch("/api/anthropic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: userInput }] }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.details || `Claude API Fehler: ${response.status}`)
    if (!data.content?.trim()) throw new Error("Kein Inhalt von Claude erhalten")
    return { provider: "anthropic", content: data.content, timestamp: Date.now() }
  }

  // Gemini
  const performGeminiAnalysis = async (userInput: string): Promise<AnalysisResult> => {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: userInput }] }),
    })
    const data = await response.json()
    if (response.status === 429) {
      // Quota exceeded
      return {
        provider: "gemini",
        content: `⚠️ **Gemini API Quota erreicht**\n\n${data.details || "Das kostenlose Kontingent für Gemini wurde überschritten."}`,
        timestamp: Date.now(),
      }
    }
    if (!response.ok) throw new Error(data.details || `Gemini API Fehler: ${response.status}`)
    if (!data.content?.trim()) throw new Error("Kein Inhalt von Gemini erhalten")
    return { provider: "gemini", content: data.content, timestamp: Date.now() }
  }

  // OpenAI
  const performOpenAIAnalysis = async (userInput: string): Promise<AnalysisResult> => {
    const response = await fetch("/api/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: userInput }] }),
    })
    const data = await response.json()
    if (response.status === 429) {
      // Quota exceeded
      return {
        provider: "openai",
        content: `⚠️ **OpenAI API Quota erreicht**\n\n${data.details || "Das Kontingent für OpenAI wurde überschritten."}`,
        timestamp: Date.now(),
      }
    }
    if (!response.ok) throw new Error(data.details || `OpenAI API Fehler: ${response.status}`)
    if (!data.content?.trim()) throw new Error("Kein Inhalt von OpenAI erhalten")
    return { provider: "openai", content: data.content, timestamp: Date.now() }
  }

  // DeepSeek (Streaming)
  const performDeepSeekAnalysis = async (userInput: string): Promise<AnalysisResult> => {
    const response = await fetch("/api/deepseek", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: userInput }] }),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.details || `DeepSeek API Fehler: ${response.status}`)
    }
    const reader = response.body?.getReader()
    if (!reader) throw new Error("Kein Response Body von DeepSeek")

    const decoder = new TextDecoder()
    let fullContent = ""
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataContent = line.slice(6).trim()
            if (dataContent === "[DONE]") continue
            try {
              const data = JSON.parse(dataContent)
              if (data.content) fullContent += data.content
              else if (data.choices?.[0]?.delta?.content) fullContent += data.choices[0].delta.content
            } catch (e) {
              /* Skip invalid JSON */
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
    if (!fullContent.trim()) throw new Error("Kein Inhalt von DeepSeek erhalten")
    return { provider: "deepseek", content: fullContent.trim(), timestamp: Date.now() }
  }

  const performFinalAnalysis = async (reports: AnalysisResult[]) => {
    console.log("Starting final analysis...")
    setCurrentStep("final")
    try {
      const response = await fetch("/api/final-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reports }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.details || "Final analysis failed")
      }
      setFinalAnalysis(data.content)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unbekannter Fehler"
      console.error("Final analysis error:", e)
      setFinalAnalysis(`❌ Fehler bei der finalen Analyse: ${errorMessage}`)
    } finally {
      setCurrentStep("all_complete")
    }
  }

  const clearAnalysis = useCallback(() => {
    // setMessages([])
    setAnalysisResults([])
    setCurrentStep("idle")
    setError(null)
    setFinalAnalysis(null)
  }, [])

  return {
    // messages, // Expose if needed for any reason
    analysisResults,
    isAnalyzing,
    currentStep,
    error,
    runComparisonAnalysis,
    clearAnalysis,
    finalAnalysis,
  }
}

export type { AnalysisResult }
