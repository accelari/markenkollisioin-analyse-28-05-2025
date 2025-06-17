"use client"

import type React from "react"
import { useAIChat } from "../hooks/useAIChat"
import ComparisonChat from "../components/comparison-chat"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Bot, Trash2, Settings2, Clock, CheckCircle, FileText, Zap } from "lucide-react"
import { useState, useCallback } from "react"

export default function ChatPage() {
  const [selectedModel, setSelectedModel] = useState<"anthropic" | "deepseek" | "gemini" | "openai">("anthropic")
  const [activeTab, setActiveTab] = useState<"single" | "comparison">("comparison")

  const [auftragsmarke, setAuftragsmarke] = useState("")
  const [gegenmarke, setGegenmarke] = useState("")
  const [showSettings, setShowSettings] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState<string | null>(null)

  const handleAnalysisComplete = useCallback((content: string) => {
    setModalContent(content)
    setIsModalOpen(true)
  }, [])

  const chat = useAIChat(selectedModel, { onAnalysisComplete: handleAnalysisComplete })

  const getModelDisplayName = (model?: typeof selectedModel) => {
    const current = model || selectedModel
    switch (current) {
      case "anthropic":
        return "Claude (Anthropic)"
      case "deepseek":
        return "DeepSeek"
      case "gemini":
        return "Gemini (Google)"
      case "openai":
        return "GPT-4o (OpenAI)"
      default:
        return current
    }
  }

  const getModelIcon = (model?: typeof selectedModel) => {
    const current = model || selectedModel
    switch (current) {
      case "anthropic":
        return "🧠"
      case "deepseek":
        return "🔍"
      case "gemini":
        return "💎"
      case "openai":
        return "🤖"
      default:
        return "🤖"
    }
  }

  const handleDirectAnalysis = useCallback(async () => {
    if (chat.isLoading || (!auftragsmarke.trim() && !gegenmarke.trim())) return
    setIsModalOpen(false)
    setModalContent(null)

    const analysisMessage = `MARKENINFORMATIONEN:

${
  auftragsmarke.trim()
    ? `AUFTRAGSMARKE:
${auftragsmarke.trim()}

`
    : ""
}${
  gegenmarke.trim()
    ? `GEGENMARKE:
${gegenmarke.trim()}

`
    : ""
}ANALYSE-ANFRAGE:
Bitte führen Sie eine vollständige Markenrechtsanalyse basierend auf den oben genannten Markeninformationen durch. Prüfen Sie insbesondere die Verwechslungsgefahr zwischen den beiden Marken.`

    const syntheticEvent = {
      preventDefault: () => {},
    } as React.FormEvent

    await chat.handleSubmit(syntheticEvent, analysisMessage)
  }, [chat, auftragsmarke, gegenmarke])

  if (activeTab === "comparison") {
    return <ComparisonChat />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4 flex justify-center items-center">
      <Card className="w-full max-w-3xl h-auto sm:h-[95vh] flex flex-col shadow-2xl rounded-xl">
        <CardHeader className="border-b bg-slate-50 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-7 w-7 text-indigo-600" />
              <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800">
                Einzelanalyse: {getModelDisplayName()}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "single" | "comparison")}>
                <TabsList>
                  <TabsTrigger value="single">Einzelanalyse</TabsTrigger>
                  <TabsTrigger value="comparison">Vergleichsanalyse</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} title="Einstellungen">
                <Settings2 className="h-5 w-5 text-slate-600 hover:text-indigo-600" />
              </Button>
            </div>
          </div>
          {showSettings && (
            <div className="mt-3 p-3 bg-slate-100 rounded-md border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700">KI-Modell wählen:</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as "anthropic" | "deepseek" | "gemini" | "openai")}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="anthropic">🧠 Claude (Anthropic)</option>
                  <option value="deepseek">🔍 DeepSeek</option>
                  <option value="gemini">💎 Gemini (Google)</option>
                  <option value="openai">🤖 GPT-4o (OpenAI)</option>
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  chat.setMessages()
                  setAuftragsmarke("")
                  setGegenmarke("")
                  setIsModalOpen(false)
                  setModalContent(null)
                }}
                className="flex items-center gap-2 text-slate-700 border-slate-300 hover:bg-slate-200"
              >
                <Trash2 className="h-4 w-4" />
                Analyse zurücksetzen
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 sm:p-6 bg-slate-50 border-b border-slate-200">
            <div className="space-y-2">
              <label className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <span className="bg-blue-600 text-white px-2.5 py-1 rounded-md text-xs font-medium">AUFTRAGSMARKE</span>
              </label>
              <textarea
                value={auftragsmarke}
                onChange={(e) => setAuftragsmarke(e.target.value)}
                placeholder="Markenname, Register, Klassen, Waren/Dienstleistungen..."
                className="w-full h-32 sm:h-40 p-3 border border-slate-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                disabled={chat.isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <span className="bg-red-600 text-white px-2.5 py-1 rounded-md text-xs font-medium">GEGENMARKE</span>
              </label>
              <textarea
                value={gegenmarke}
                onChange={(e) => setGegenmarke(e.target.value)}
                placeholder="Markenname, Register, Klassen, Waren/Dienstleistungen..."
                className="w-full h-32 sm:h-40 p-3 border border-slate-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                disabled={chat.isLoading}
              />
            </div>
            <div className="md:col-span-2 flex justify-center mt-2">
              <Button
                onClick={handleDirectAnalysis}
                disabled={chat.isLoading || (!auftragsmarke.trim() && !gegenmarke.trim())}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-base flex items-center gap-3 transform hover:scale-105"
                size="lg"
              >
                {chat.isLoading ? (
                  <>
                    <Clock className="h-5 w-5 animate-spin" />
                    {getModelIcon()} analysiert...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Markenrechtsanalyse starten
                    <div className="hidden sm:flex items-center gap-1 ml-2 text-xs bg-white/20 px-2 py-1 rounded">
                      {getModelIcon()}
                      {getModelDisplayName().split(" ")[0]}
                    </div>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-6 bg-white flex items-center justify-center">
            {!chat.isLoading && !modalContent && (
              <div className="text-center text-slate-400 max-w-md">
                <div className="bg-slate-50 p-4 rounded-lg border mb-4">
                  <div className="text-3xl mb-2">{getModelIcon()}</div>
                  <p className="text-sm font-medium text-slate-700">{getModelDisplayName()}</p>
                  <p className="text-xs text-slate-500">Einzelanalyse</p>
                </div>
                <p className="text-lg font-medium mb-2">Markeninformationen eingeben</p>
                <p className="text-sm mb-1">Füllen Sie die Felder oben aus und starten Sie die Analyse.</p>
                <p className="text-sm text-indigo-600 font-medium">→ Ergebnis erscheint automatisch im Popup ←</p>
              </div>
            )}
            {chat.isLoading && (
              <div className="text-center text-slate-500 max-w-md">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  </div>
                  <div className="w-20 h-20 mx-auto flex items-center justify-center text-2xl">{getModelIcon()}</div>
                </div>
                <p className="text-lg font-medium mb-2">Markenanwalt {getModelDisplayName()} analysiert...</p>
                <p className="text-sm">Das Ergebnis wird gleich in einem Popup erscheinen.</p>
              </div>
            )}
            {!chat.isLoading && modalContent && !isModalOpen && (
              <div className="text-center text-slate-500 max-w-md">
                <CheckCircle className="h-20 w-20 mx-auto mb-4 text-green-400" />
                <p className="text-xl font-bold text-green-600 mb-2">Analyse abgeschlossen!</p>
                <p className="text-sm mb-4">{getModelDisplayName()} hat die Analyse fertiggestellt</p>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 mx-auto"
                >
                  <FileText className="h-4 w-4" />
                  Analyseergebnis öffnen
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl w-[95vw] sm:w-full h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-600" />
              Analyseergebnis: {getModelDisplayName()}
            </DialogTitle>
            <p className="text-sm text-slate-600 mt-1">
              Markenrechtsanalyse von {getModelIcon()} {getModelDisplayName()}
            </p>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 whitespace-pre-wrap break-words prose prose-sm max-w-none">
              {modalContent || "Kein Inhalt verfügbar."}
            </div>
          </ScrollArea>
          <DialogFooter className="p-4 border-t bg-slate-50">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="font-semibold">
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
