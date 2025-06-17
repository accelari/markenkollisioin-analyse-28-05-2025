"use client"

import type React from "react"
import { useState, useCallback } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface UseAIChatOptions {
  onAnalysisComplete?: (content: string) => void
}

export function useAIChat(
  provider: "anthropic" | "deepseek" | "gemini" | "openai" = "anthropic",
  options?: UseAIChatOptions,
) {
  const [messages, setMessages] = useState<Message[]>([]) // Internal message history
  const [input, setInput] = useState("") // Not used if customMessage is always provided
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent, customMessage?: string) => {
      e.preventDefault()
      const messageToSend = customMessage || input.trim()
      if (!messageToSend || isLoading) return

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: messageToSend,
      }

      // Update internal messages, but UI will primarily use modal for final result
      setMessages((prev) => [...prev, userMessage])

      if (!customMessage) {
        setInput("")
      }
      setIsLoading(true)
      let fullAssistantContent = ""

      try {
        const apiEndpoint = `/api/${provider}`

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Send only current user message and system prompt (handled by API route)
            // Or, if your API expects history, map messages state:
            messages: [{ role: userMessage.role, content: userMessage.content }],
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.details || `Failed to get response from ${provider}: ${response.status}`)
        }

        // Non-streaming for Claude, Gemini, OpenAI as per current API routes
        if (provider === "anthropic" || provider === "openai" || provider === "gemini") {
          const data = await response.json()
          if (data.content) {
            fullAssistantContent = data.content
            // Update internal messages if needed
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: fullAssistantContent,
            }
            setMessages((prev) => [...prev, assistantMessage])
          } else {
            throw new Error(`No content in response from ${provider}`)
          }
        } else {
          // DeepSeek streaming
          const reader = response.body?.getReader()
          const decoder = new TextDecoder()
          if (!reader) throw new Error("No response body for DeepSeek")

          // Add a placeholder for assistant message internally if needed
          const assistantMessageId = (Date.now() + 1).toString()
          setMessages((prev) => [...prev, { id: assistantMessageId, role: "assistant", content: "" }])

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const dataContent = line.slice(6).trim()
                  if (dataContent === "[DONE]") continue
                  const data = JSON.parse(dataContent)
                  if (data.content) {
                    fullAssistantContent += data.content
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId ? { ...msg, content: fullAssistantContent } : msg,
                      ),
                    )
                  } else if (data.choices?.[0]?.delta?.content) {
                    fullAssistantContent += data.choices[0].delta.content
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId ? { ...msg, content: fullAssistantContent } : msg,
                      ),
                    )
                  }
                } catch (e) {
                  /* Skip invalid JSON */
                }
              }
            }
          }
        }

        if (options?.onAnalysisComplete && fullAssistantContent) {
          options.onAnalysisComplete(fullAssistantContent)
        }
      } catch (error) {
        console.error("Error:", error)
        const errorMessageContent =
          error instanceof Error
            ? error.message
            : `Entschuldigung, es gab einen Fehler bei der Verbindung zu ${provider}. Bitte versuchen Sie es erneut.`
        if (options?.onAnalysisComplete) {
          options.onAnalysisComplete(`❌ Fehler: ${errorMessageContent}`)
        }
        // Update internal messages with error
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `❌ Fehler: ${errorMessageContent}`,
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [input, isLoading, provider, options], // Removed `messages` from deps to avoid stale closure if API doesn't need full history
  )

  const stop = useCallback(() => {
    // Stop function might need more robust implementation if requests are truly cancellable
    setIsLoading(false)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages, // Internal messages, primarily for potential debugging or future history features
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    setMessages: clearMessages, // Exposes a way to clear internal messages
  }
}
