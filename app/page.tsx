"use client"

import { useAIChat } from "../hooks/useAIChat"
import ComparisonChat from "../components/comparison-chat"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Bot, User, Trash2 } from "lucide-react"
import { useRef, useEffect, useState } from "react"

export default function ChatPage() {
  const [selectedModel, setSelectedModel] = useState<"anthropic" | "deepseek" | "gemini" | "openai">("anthropic")
  const [activeTab, setActiveTab] = useState<"single" | "comparison">("comparison")
  const chat = useAIChat(selectedModel)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [chat.messages])

  // Clear messages when switching models
  useEffect(() => {
    chat.setMessages()
  }, [selectedModel])

  const getModelDisplayName = () => {
    switch (selectedModel) {
      case "anthropic":
        return "Claude (Anthropic)"
      case "deepseek":
        return "DeepSeek"
      case "gemini":
        return "Gemini (Google)"
      case "openai":
        return "GPT-4o (OpenAI)"
      default:
        return selectedModel
    }
  }

  if (activeTab === "comparison") {
    return <ComparisonChat />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="h-[90vh] flex flex-col">
          <CardHeader className="border-b bg-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-indigo-600" />
                <CardTitle className="text-xl font-semibold text-gray-800">
                  Markenanwalt {getModelDisplayName()}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "single" | "comparison")}>
                  <TabsList>
                    <TabsTrigger value="single">Einzelanalyse</TabsTrigger>
                    <TabsTrigger value="comparison">Vergleichsanalyse</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex items-center gap-2 mr-4">
                  <label className="text-sm font-medium">Modell:</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as "anthropic" | "deepseek" | "gemini" | "openai")}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="anthropic">Claude (Anthropic)</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="gemini">Gemini (Google)</option>
                    <option value="openai">GPT-4o (OpenAI)</option>
                  </select>
                </div>
                <Button variant="outline" size="sm" onClick={chat.setMessages} className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Chat löschen
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {chat.messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-indigo-400" />
                    <p className="text-lg font-medium">Willkommen beim Markenanwalt {getModelDisplayName()}!</p>
                    <p className="text-sm">Beschreiben Sie Ihren Markenrechtsfall für eine professionelle Analyse.</p>
                  </div>
                )}

                {chat.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === "user" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-indigo-600 text-white"
                            : "bg-white border border-gray-200 text-gray-800"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">{message.content}</div>
                      </div>
                    </div>
                  </div>
                ))}

                {chat.isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-white border border-gray-200 text-gray-800 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500">
                            Markenanwalt {getModelDisplayName()} analysiert...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t bg-white/50 backdrop-blur-sm p-4">
              <form onSubmit={chat.handleSubmit} className="flex gap-2">
                <Input
                  value={chat.input}
                  onChange={chat.handleInputChange}
                  placeholder="Beschreiben Sie Ihren Markenrechtsfall..."
                  disabled={chat.isLoading}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={chat.isLoading || !chat.input.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
                {chat.isLoading && (
                  <Button type="button" variant="outline" onClick={chat.stop}>
                    Stopp
                  </Button>
                )}
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
