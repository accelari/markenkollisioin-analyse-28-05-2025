"use client"

import type React from "react"
import { useState, useCallback } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export function useAIChat(provider: "anthropic" | "deepseek" = "anthropic") {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input.trim(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsLoading(true)

      try {
        // Direkte API-Endpunkte ohne generischen Router
        const apiEndpoint = `/api/${provider}`

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to get response from ${provider}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("No response body")
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
        }

        setMessages((prev) => [...prev, assistantMessage])

        // Handle streaming response
        if (provider === "anthropic") {
          // Use AI SDK streaming format for Anthropic
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("0:")) {
                try {
                  const data = JSON.parse(line.slice(2))
                  if (data.content) {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessage.id ? { ...msg, content: msg.content + data.content } : msg,
                      ),
                    )
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } else {
          // Handle DeepSeek streaming format
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6))
                  if (data.content) {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessage.id ? { ...msg, content: msg.content + data.content } : msg,
                      ),
                    )
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error:", error)
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Entschuldigung, es gab einen Fehler bei der Verbindung zu ${provider}. Bitte versuchen Sie es erneut.`,
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [input, messages, isLoading, provider],
  )

  const stop = useCallback(() => {
    setIsLoading(false)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    setMessages: clearMessages,
  }
}
