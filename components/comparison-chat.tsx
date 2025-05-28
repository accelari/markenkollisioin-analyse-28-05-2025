"use client"

import type React from "react"

import { useComparisonAnalysis } from "../hooks/useComparisonAnalysis"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Bot, User, Trash2, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useRef, useEffect, useState } from "react"

export default function ComparisonChat() {
  const { messages, analysisResults, isAnalyzing, currentStep, error, runComparisonAnalysis, clearAnalysis } =
    useComparisonAnalysis()
  const [input, setInput] = useState("")
  const [activeTab, setActiveTab] = useState<"combined" | "claude" | "deepseek">("combined")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isAnalyzing) return

    await runComparisonAnalysis(input.trim())
    setInput("")
  }

  const getStepStatus = (step: string) => {
    if (currentStep === "idle") return "pending"
    if (currentStep === step) return "active"
    if (
      (step === "claude" && (currentStep === "deepseek" || currentStep === "complete")) ||
      (step === "deepseek" && currentStep === "complete")
    ) {
      return "completed"
    }
    return "pending"
  }

  const getProviderDisplayName = (provider: "anthropic" | "deepseek") => {
    return provider === "anthropic" ? "Claude (Anthropic)" : "DeepSeek"
  }

  // Filter messages by provider
  const claudeMessages = messages.filter((m) => m.provider === "anthropic" || m.role === "user")
  const deepseekMessages = messages.filter((m) => m.provider === "deepseek" || m.role === "user")

  // Get analysis results for display
  const claudeAnalysis = analysisResults.find((r) => r.provider === "anthropic")
  const deepseekAnalysis = analysisResults.find((r) => r.provider === "deepseek")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="h-[90vh] flex flex-col">
          <CardHeader className="border-b bg-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-indigo-600" />
                <CardTitle className="text-xl font-semibold text-gray-800">Markenanwalt Vergleichsanalyse</CardTitle>
              </div>
              <div className="flex items-center gap-4">
                {/* Analysis Progress */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {getStepStatus("claude") === "completed" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : getStepStatus("claude") === "active" ? (
                      <Clock className="h-4 w-4 text-blue-600 animate-spin" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className="text-sm">Claude</span>
                    {claudeAnalysis && (
                      <span className="text-xs text-gray-500">({claudeAnalysis.content.length} Zeichen)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {getStepStatus("deepseek") === "completed" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : getStepStatus("deepseek") === "active" ? (
                      <Clock className="h-4 w-4 text-blue-600 animate-spin" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className="text-sm">DeepSeek</span>
                    {deepseekAnalysis && (
                      <span className="text-xs text-gray-500">({deepseekAnalysis.content.length} Zeichen)</span>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={clearAnalysis} className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Analyse löschen
                </Button>
              </div>
            </div>

            {error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Fehler: {error}</span>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "combined" | "claude" | "deepseek")}
              className="flex-1 flex flex-col"
            >
              <div className="border-b px-4 py-2">
                <TabsList>
                  <TabsTrigger value="combined">Kombinierte Ansicht</TabsTrigger>
                  <TabsTrigger value="claude">
                    Claude
                    {claudeAnalysis && <span className="ml-1 text-xs">✓</span>}
                  </TabsTrigger>
                  <TabsTrigger value="deepseek">
                    DeepSeek
                    {deepseekAnalysis && <span className="ml-1 text-xs">✓</span>}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="combined" className="flex-1 p-0 m-0">
                <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center text-gray-500 mt-8">
                        <Bot className="h-12 w-12 mx-auto mb-4 text-indigo-400" />
                        <p className="text-lg font-medium">Willkommen zur Markenanwalt Vergleichsanalyse!</p>
                        <p className="text-sm">
                          Beschreiben Sie Ihren Markenrechtsfall. Beide AI-Modelle werden nacheinander eine vollständige
                          Analyse durchführen.
                        </p>
                      </div>
                    )}

                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
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
                            {message.provider && (
                              <div className="mb-2 flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {getProviderDisplayName(message.provider)}
                                </Badge>
                                <span className="text-xs text-gray-500">{message.content.length} Zeichen</span>
                              </div>
                            )}
                            <div className="whitespace-pre-wrap break-words">
                              {message.content || (
                                <div className="flex items-center gap-2 text-gray-500">
                                  <AlertCircle className="h-4 w-4" />
                                  <span>Keine Antwort erhalten</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {isAnalyzing && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex gap-3 max-w-[85%]">
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
                                {currentStep === "claude" && "Claude führt Markenrechtsanalyse durch..."}
                                {currentStep === "deepseek" && "DeepSeek führt Markenrechtsanalyse durch..."}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="claude" className="flex-1 p-0 m-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {!claudeAnalysis ? (
                      <div className="text-center text-gray-500 mt-8">
                        <Bot className="h-12 w-12 mx-auto mb-4 text-indigo-400" />
                        <p className="text-lg font-medium">Claude (Anthropic) Analyse</p>
                        <p className="text-sm">Starten Sie eine Analyse, um Claude's Ergebnisse hier zu sehen.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* User message */}
                        {messages.find((m) => m.role === "user") && (
                          <div className="flex gap-3 justify-end">
                            <div className="flex gap-3 max-w-[85%] flex-row-reverse">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                              <div className="bg-indigo-600 text-white rounded-lg px-4 py-2">
                                <div className="whitespace-pre-wrap break-words">
                                  {messages.find((m) => m.role === "user")?.content}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Claude response */}
                        <div className="flex gap-3 justify-start">
                          <div className="flex gap-3 max-w-[85%]">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                              <Bot className="h-4 w-4" />
                            </div>
                            <div className="bg-white border border-gray-200 text-gray-800 rounded-lg px-4 py-2">
                              <div className="mb-2 flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  Claude (Anthropic)
                                </Badge>
                                <span className="text-xs text-gray-500">{claudeAnalysis.content.length} Zeichen</span>
                              </div>
                              <div className="whitespace-pre-wrap break-words">
                                {claudeAnalysis.content || (
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>Keine Antwort von Claude erhalten</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {isAnalyzing && currentStep === "claude" && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex gap-3 max-w-[85%]">
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
                              <span className="text-sm text-gray-500">Claude führt Markenrechtsanalyse durch...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="deepseek" className="flex-1 p-0 m-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {!deepseekAnalysis ? (
                      <div className="text-center text-gray-500 mt-8">
                        <Bot className="h-12 w-12 mx-auto mb-4 text-indigo-400" />
                        <p className="text-lg font-medium">DeepSeek Analyse</p>
                        <p className="text-sm">Starten Sie eine Analyse, um DeepSeek's Ergebnisse hier zu sehen.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* User message */}
                        {messages.find((m) => m.role === "user") && (
                          <div className="flex gap-3 justify-end">
                            <div className="flex gap-3 max-w-[85%] flex-row-reverse">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                              <div className="bg-indigo-600 text-white rounded-lg px-4 py-2">
                                <div className="whitespace-pre-wrap break-words">
                                  {messages.find((m) => m.role === "user")?.content}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* DeepSeek response */}
                        <div className="flex gap-3 justify-start">
                          <div className="flex gap-3 max-w-[85%]">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                              <Bot className="h-4 w-4" />
                            </div>
                            <div className="bg-white border border-gray-200 text-gray-800 rounded-lg px-4 py-2">
                              <div className="mb-2 flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  DeepSeek
                                </Badge>
                                <span className="text-xs text-gray-500">{deepseekAnalysis.content.length} Zeichen</span>
                              </div>
                              <div className="whitespace-pre-wrap break-words">
                                {deepseekAnalysis.content || (
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>Keine Antwort von DeepSeek erhalten</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {isAnalyzing && currentStep === "deepseek" && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex gap-3 max-w-[85%]">
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
                              <span className="text-sm text-gray-500">DeepSeek führt Markenrechtsanalyse durch...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <div className="border-t bg-white/50 backdrop-blur-sm p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Beschreiben Sie Ihren Markenrechtsfall für eine Vergleichsanalyse..."
                  disabled={isAnalyzing}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={isAnalyzing || !input.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              {isAnalyzing && (
                <div className="mt-2 text-sm text-gray-600">
                  Vergleichsanalyse läuft... Bitte warten Sie, bis beide Modelle ihre Analyse abgeschlossen haben.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
