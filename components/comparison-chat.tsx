"use client"
import { useComparisonAnalysis } from "../hooks/useComparisonAnalysis"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Bot,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings2,
  FileText,
  Zap,
  Users,
  Target,
  Scale,
} from "lucide-react"
import { useEffect, useState } from "react"
import type { AnalysisResult } from "../hooks/useComparisonAnalysis"
import OppositionDialog from "./opposition-dialog"

export default function ComparisonChat() {
  const { analysisResults, isAnalyzing, currentStep, error, runComparisonAnalysis, clearAnalysis, finalAnalysis } =
    useComparisonAnalysis()

  const [auftragsmarke, setAuftragsmarke] = useState("")
  const [gegenmarke, setGegenmarke] = useState("")
  const [showSettings, setShowSettings] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalResults, setModalResults] = useState<AnalysisResult[]>([])
  const [activeModalTab, setActiveModalTab] = useState<string>("final-analysis")
  const [showOppositionDialog, setShowOppositionDialog] = useState(false)

  // Calculate progress percentage
  const getProgressPercentage = () => {
    const steps = ["claude", "deepseek", "gemini", "openai", "final", "all_complete"]
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex === -1) return 0
    return Math.round((currentIndex / (steps.length - 1)) * 100)
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: Effect for modal opening
  useEffect(() => {
    if (currentStep === "all_complete" && (analysisResults.length > 0 || finalAnalysis)) {
      setModalResults(analysisResults.filter((ar) => ar.content && ar.content.trim() !== ""))
      setActiveModalTab("final-analysis") // Always start with final analysis
      setIsModalOpen(true)
    }
  }, [currentStep, analysisResults, finalAnalysis])

  const getStepStatus = (step: "claude" | "deepseek" | "gemini" | "openai" | "final") => {
    const providerMap = {
      claude: "anthropic",
      deepseek: "deepseek",
      gemini: "gemini",
      openai: "openai",
    }
    const providerKey = providerMap[step] as "anthropic" | "deepseek" | "gemini" | "openai"

    if (step === "final") {
      if (currentStep === "final") return "active"
      if (currentStep === "all_complete" && finalAnalysis) return "completed"
      if (currentStep === "all_complete" && !finalAnalysis) return "error"
      return "pending"
    }

    const resultExists = analysisResults.some(
      (r) => r.provider === providerKey && r.content && !r.content.startsWith("❌") && !r.content.startsWith("⚠️"),
    )
    const errorExists = analysisResults.some(
      (r) => r.provider === providerKey && (r.content.startsWith("❌") || r.content.startsWith("⚠️")),
    )

    if (currentStep === "idle" && !resultExists && !errorExists) return "pending"
    if (currentStep === step) return "active"
    if (resultExists) return "completed"
    if (errorExists) return "error"

    const stepOrder = ["claude", "deepseek", "gemini", "openai", "complete", "final", "all_complete"]
    const currentStepIndex = stepOrder.indexOf(currentStep)
    const thisStepIndex = stepOrder.indexOf(step)

    if (currentStepIndex > thisStepIndex && !errorExists) return "completed"
    return "pending"
  }

  const getProviderDisplayName = (provider: "anthropic" | "deepseek" | "gemini" | "openai" | string) => {
    switch (provider) {
      case "anthropic":
      case "claude":
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

  const getProviderColorClass = (provider: "anthropic" | "deepseek" | "gemini" | "openai" | string) => {
    switch (provider) {
      case "anthropic":
      case "claude":
        return "bg-orange-400 text-white"
      case "deepseek":
        return "bg-sky-500 text-white"
      case "gemini":
        return "bg-emerald-500 text-white"
      case "openai":
        return "bg-teal-500 text-white"
      default:
        return "bg-slate-200 text-slate-600"
    }
  }

  const claudeAnalysis = analysisResults.find((r) => r.provider === "anthropic")
  const deepseekAnalysis = analysisResults.find((r) => r.provider === "deepseek")
  const geminiAnalysis = analysisResults.find((r) => r.provider === "gemini")
  const openaiAnalysis = analysisResults.find((r) => r.provider === "openai")

  const handleDirectAnalysis = async () => {
    if (isAnalyzing || (!auftragsmarke.trim() && !gegenmarke.trim())) return
    setIsModalOpen(false)
    setModalResults([])

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

    await runComparisonAnalysis(analysisMessage)
  }

  const renderAnalysisProgress = (provider: "claude" | "deepseek" | "gemini" | "openai" | "final", analysis: any) => {
    if (provider === "final") {
      const status = getStepStatus("final")
      return (
        <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo-700">
          {status === "completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
          {status === "active" && <Clock className="h-4 w-4 text-blue-500 animate-spin" />}
          {status === "pending" && <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" />}
          {status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
          <span>Finale Analyse</span>
        </div>
      )
    }
    const status = getStepStatus(provider)
    const displayName = getProviderDisplayName(provider === "claude" ? "anthropic" : provider)

    let characterCount = ""
    if (analysis && analysis.content && !analysis.content.startsWith("❌") && !analysis.content.startsWith("⚠️")) {
      characterCount = `(${analysis.content.length} Z.)`
    } else if (analysis && (analysis.content.startsWith("❌") || analysis.content.startsWith("⚠️"))) {
      characterCount = "(Fehler)"
    }

    return (
      <div className="flex items-center gap-1.5 text-sm text-slate-600">
        {status === "completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
        {status === "active" && <Clock className="h-4 w-4 text-blue-500 animate-spin" />}
        {status === "pending" && <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" />}
        {status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
        <span>{displayName}</span>
        {characterCount && <span className="text-xs text-slate-400">{characterCount}</span>}
      </div>
    )
  }

  const providerKeys: ("anthropic" | "deepseek" | "gemini" | "openai")[] = ["anthropic", "deepseek", "gemini", "openai"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4 flex justify-center items-center">
      <Card className="w-full max-w-5xl h-auto sm:h-[95vh] flex flex-col shadow-2xl rounded-xl">
        <CardHeader className="border-b bg-slate-50 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-7 w-7 text-indigo-600" />
              <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800">Vergleichsanalyse</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} title="Einstellungen">
              <Settings2 className="h-5 w-5 text-slate-600 hover:text-indigo-600" />
            </Button>
          </div>
          {showSettings && (
            <div className="mt-3 p-3 bg-slate-100 rounded-md border border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearAnalysis()
                  setAuftragsmarke("")
                  setGegenmarke("")
                  setIsModalOpen(false)
                  setModalResults([])
                }}
                className="flex items-center gap-2 text-slate-700 border-slate-300 hover:bg-slate-200"
              >
                <Trash2 className="h-4 w-4" />
                Analyse zurücksetzen & Felder leeren
              </Button>
            </div>
          )}
          {isAnalyzing && currentStep !== "idle" && (
            <div className="mt-3 p-4 bg-indigo-50 rounded-md border border-indigo-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-800">Analyse-Fortschritt</span>
                  <span className="text-sm text-indigo-600">{getProgressPercentage()}%</span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
                <div className="flex items-center justify-center gap-x-3 sm:gap-x-4 gap-y-2 flex-wrap">
                  {renderAnalysisProgress("claude", claudeAnalysis)}
                  <div className="text-slate-300 hidden sm:inline">&rarr;</div>
                  {renderAnalysisProgress("deepseek", deepseekAnalysis)}
                  <div className="text-slate-300 hidden sm:inline">&rarr;</div>
                  {renderAnalysisProgress("gemini", geminiAnalysis)}
                  <div className="text-slate-300 hidden sm:inline">&rarr;</div>
                  {renderAnalysisProgress("openai", openaiAnalysis)}
                  <div className="text-slate-300 hidden sm:inline">&rarr;</div>
                  {renderAnalysisProgress("final", null)}
                </div>
              </div>
            </div>
          )}
          {error && !isAnalyzing && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>Fehler bei der Analyse: {error}</span>
              </div>
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
                disabled={isAnalyzing}
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
                disabled={isAnalyzing}
              />
            </div>
            <div className="md:col-span-2 flex justify-center mt-2">
              <Button
                onClick={handleDirectAnalysis}
                disabled={isAnalyzing || (!auftragsmarke.trim() && !gegenmarke.trim())}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-base flex items-center gap-3 transform hover:scale-105"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Clock className="h-5 w-5 animate-spin" />
                    Analysiere mit 4 KI-Anwälten...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Vergleichsanalyse starten
                    <div className="hidden sm:flex items-center gap-1 ml-2 text-xs bg-white/20 px-2 py-1 rounded">
                      <Users className="h-3 w-3" />4 KI + Finale
                    </div>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-6 bg-white flex items-center justify-center">
            {!isAnalyzing && currentStep === "idle" && !finalAnalysis && (
              <div className="text-center text-slate-400 max-w-md">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-3 rounded-lg border">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-indigo-400" />
                    <p className="text-xs font-medium">4 KI-Anwälte</p>
                    <p className="text-xs text-slate-500">Einzelanalysen</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border">
                    <Target className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                    <p className="text-xs font-medium">Finale Analyse</p>
                    <p className="text-xs text-slate-500">Zusammenfassung</p>
                  </div>
                </div>
                <p className="text-lg font-medium mb-2">Markeninformationen eingeben</p>
                <p className="text-sm mb-1">Füllen Sie die Felder oben aus, um die Vergleichsanalyse zu starten.</p>
                <p className="text-sm text-indigo-600 font-medium">→ Ergebnisse erscheinen automatisch im Popup ←</p>
              </div>
            )}
            {isAnalyzing && (
              <div className="text-center text-slate-500 max-w-md">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  </div>
                  <div className="w-20 h-20 mx-auto"></div>
                </div>
                <p className="text-lg font-medium mb-2">Vergleichsanalyse läuft...</p>
                <p className="text-sm mb-3">4 KI-Anwälte arbeiten parallel an Ihrem Fall</p>
                <div className="bg-slate-50 p-3 rounded-lg border text-xs">
                  <p className="font-medium text-slate-700">
                    {currentStep === "claude" && "Claude analysiert..."}
                    {currentStep === "deepseek" && "DeepSeek analysiert..."}
                    {currentStep === "gemini" && "Gemini analysiert..."}
                    {currentStep === "openai" && "GPT-4o analysiert..."}
                    {currentStep === "final" && "Haupt-Anwalt erstellt finale Analyse..."}
                    {currentStep === "complete" && "Abschluss..."}
                  </p>
                </div>
              </div>
            )}
            {!isAnalyzing && currentStep === "all_complete" && !isModalOpen && (
              <div className="text-center text-slate-500 max-w-md">
                <CheckCircle className="h-20 w-20 mx-auto mb-4 text-green-400" />
                <p className="text-xl font-bold text-green-600 mb-2">Analyse abgeschlossen!</p>
                <p className="text-sm mb-4">Alle 4 KI-Anwälte + finale Analyse sind fertig</p>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 mx-auto"
                >
                  <FileText className="h-4 w-4" />
                  Analyseergebnisse öffnen
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-full h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-600" />
              Markenrechts-Analyseergebnisse
            </DialogTitle>
            <p className="text-sm text-slate-600 mt-1">4 KI-Anwälte + finale Zusammenfassung</p>
          </DialogHeader>

          {modalResults.length > 0 || finalAnalysis ? (
            <Tabs
              value={activeModalTab}
              onValueChange={setActiveModalTab}
              className="flex-1 flex flex-col min-h-0 p-1 sm:p-2 md:p-4"
            >
              <div className="flex overflow-x-auto sm:justify-center border-b pb-2 mb-2">
                <TabsList className="space-x-1 sm:space-x-0 flex-shrink-0 sm:grid sm:grid-cols-2 md:grid-cols-5">
                  <TabsTrigger
                    value="final-analysis"
                    className="px-3 py-2 text-sm flex-shrink-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-100 data-[state=active]:to-purple-100 data-[state=active]:text-indigo-800 data-[state=active]:shadow-sm font-bold border-2 border-transparent data-[state=active]:border-indigo-200"
                  >
                    <Target className="h-4 w-4 mr-1.5" />
                    Finale Analyse
                    {finalAnalysis && <CheckCircle className="h-3 w-3 ml-1.5 text-green-500 inline" />}
                  </TabsTrigger>
                  {providerKeys.map((pKey) => {
                    const analysis = modalResults.find((r) => r.provider === pKey)
                    const tabValue = pKey === "anthropic" ? "claude" : pKey
                    const hasError = analysis?.content.startsWith("❌") || analysis?.content.startsWith("⚠️")
                    return (
                      <TabsTrigger
                        key={tabValue}
                        value={tabValue}
                        className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm flex-shrink-0 data-[state=active]:bg-slate-100 data-[state=active]:shadow-sm"
                      >
                        {getProviderDisplayName(pKey)}
                        {analysis && !hasError && <CheckCircle className="h-3 w-3 ml-1.5 text-green-500 inline" />}
                        {analysis && hasError && <AlertCircle className="h-3 w-3 ml-1.5 text-red-500 inline" />}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>

              <TabsContent value="final-analysis" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full p-1 sm:p-2">
                  {finalAnalysis ? (
                    <div className="p-3 sm:p-4 rounded-lg border-2 border-indigo-200 shadow-inner bg-gradient-to-br from-indigo-50 to-purple-50">
                      <div className="mb-3 flex items-center gap-2 border-b border-indigo-200 pb-2">
                        <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold">
                          <Target className="h-3 w-3 mr-1" />
                          Haupt-KI-Anwalt
                        </Badge>
                        <span className="text-xs text-slate-500">Finale Zusammenfassung & Empfehlung</span>
                      </div>
                      <div className="whitespace-pre-wrap break-words prose prose-sm max-w-none">{finalAnalysis}</div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 mt-10">
                      <Clock className="h-12 w-12 mx-auto mb-3 text-slate-300 animate-spin" />
                      <p>Finale Analyse wird erstellt...</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {providerKeys.map((pKey) => {
                const analysis = modalResults.find((r) => r.provider === pKey)
                const tabValue = pKey === "anthropic" ? "claude" : pKey
                return (
                  <TabsContent key={tabValue} value={tabValue} className="flex-1 overflow-hidden m-0">
                    <ScrollArea className="h-full p-1 sm:p-2">
                      {analysis ? (
                        <div className={`p-2 sm:p-3 rounded-lg border shadow-inner bg-white`}>
                          <div className="mb-2 flex items-center gap-2 border-b pb-1.5">
                            <Badge
                              variant="outline"
                              className={`text-sm font-semibold ${getProviderColorClass(pKey)} border-none`}
                            >
                              {getProviderDisplayName(pKey)}
                            </Badge>
                            <span className="text-xs text-slate-500">{analysis.content.length} Zeichen</span>
                          </div>
                          <div className="whitespace-pre-wrap break-words prose prose-sm max-w-none">
                            {analysis.content}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-slate-400 mt-10">
                          <Bot className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                          <p>Keine Ergebnisse für {getProviderDisplayName(pKey)}.</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                )
              })}
            </Tabs>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <AlertCircle className="h-8 w-8 mr-2" /> Keine Analyseergebnisse zum Anzeigen.
            </div>
          )}
          <DialogFooter className="p-4 border-t bg-slate-50 flex justify-between">
            <Button
              onClick={() => setShowOppositionDialog(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold"
              disabled={!finalAnalysis}
            >
              <Scale className="h-4 w-4 mr-2" />
              Widerspruch einlegen
            </Button>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="font-semibold">
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <OppositionDialog
        isOpen={showOppositionDialog}
        onClose={() => setShowOppositionDialog(false)}
        caseData={{
          auftragsmarke,
          gegenmarke,
          final_analysis: finalAnalysis || undefined,
          recommendation: "Widerspruch einlegen", // You could extract this from finalAnalysis
          confidence_level: 85, // You could extract this from finalAnalysis
        }}
        analysisResults={analysisResults}
      />
    </div>
  )
}
