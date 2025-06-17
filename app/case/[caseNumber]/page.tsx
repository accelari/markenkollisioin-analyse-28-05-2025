"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Mail, Download, Calendar, AlertTriangle, CheckCircle, Copy, Send, Scale, Clock } from "lucide-react"
import type { CaseData } from "@/lib/supabase"

export default function CasePage() {
  const params = useParams()
  const caseNumber = params.caseNumber as string

  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [oppositionEmail, setOppositionEmail] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (caseNumber) {
      fetchCaseData()
    }
  }, [caseNumber])

  const fetchCaseData = async () => {
    try {
      const response = await fetch(`/api/cases?case_number=${caseNumber}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch case")
      }

      setCaseData(data.case)
      generateOppositionEmail(data.case)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const generateOppositionEmail = (caseData: CaseData) => {
    const email = `Betreff: Widerspruch gegen Markenanmeldung - ${caseData.gegenmarke?.substring(0, 50)}

Sehr geehrte Damen und Herren,

hiermit lege ich namens meines Mandanten Widerspruch gegen die Markenanmeldung ein:

Gegenmarke: ${caseData.gegenmarke}
Auftragsmarke: ${caseData.auftragsmarke}

BEGRÜNDUNG:

${
  caseData.final_analysis
    ? `Basierend auf unserer umfassenden Markenrechtsanalyse bestehen erhebliche Verwechslungsgefahren zwischen den Marken.

DETAILLIERTE ANALYSE:
${caseData.final_analysis.substring(0, 1000)}...

`
    : "Eine detaillierte Begründung folgt in separater Anlage."
}

ANTRAG:
Wir beantragen, die Markenanmeldung zurückzuweisen bzw. den Widerspruch als begründet anzuerkennen.

FRISTEN:
Bitte beachten Sie die gesetzlichen Fristen für Ihre Stellungnahme.

Mit freundlichen Grüßen

[Ihr Name]
[Ihre Kanzlei]
[Kontaktdaten]

---
Diese E-Mail wurde mit Unterstützung unseres KI-Markenanwalt-Systems erstellt.
Fall-Nr.: ${caseData.case_number}
Analyse-Datum: ${caseData.analysis_date ? new Date(caseData.analysis_date).toLocaleDateString("de-DE") : "N/A"}`

    setOppositionEmail(email)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "analysis_complete":
        return "bg-blue-100 text-blue-800"
      case "opposition_prepared":
        return "bg-yellow-100 text-yellow-800"
      case "opposition_sent":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case "analysis_complete":
        return "Analyse abgeschlossen"
      case "opposition_prepared":
        return "Widerspruch vorbereitet"
      case "opposition_sent":
        return "Widerspruch versendet"
      default:
        return "Unbekannt"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-indigo-400 animate-spin" />
          <p className="text-lg font-medium text-slate-700">Fall wird geladen...</p>
        </div>
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Fall nicht gefunden</h2>
            <p className="text-slate-600 mb-4">{error || "Der angeforderte Fall konnte nicht gefunden werden."}</p>
            <Button onClick={() => (window.location.href = "/")}>Zurück zur Startseite</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Scale className="h-7 w-7 text-indigo-600" />
                  Fall {caseData.case_number}
                </CardTitle>
                <p className="text-slate-600 mt-1">
                  Erstellt am {caseData.created_at ? new Date(caseData.created_at).toLocaleDateString("de-DE") : "N/A"}
                </p>
              </div>
              <div className="text-right">
                <Badge className={`${getStatusColor(caseData.status)} mb-2`}>{getStatusText(caseData.status)}</Badge>
                {caseData.opposition_deadline && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    Frist: {new Date(caseData.opposition_deadline).toLocaleDateString("de-DE")}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="analysis">KI-Analyse</TabsTrigger>
            <TabsTrigger value="opposition">Widerspruch</TabsTrigger>
            <TabsTrigger value="documents">Dokumente</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trademark Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Markeninformationen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Auftragsmarke</label>
                    <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm">{caseData.auftragsmarke}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Gegenmarke</label>
                    <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm">{caseData.gegenmarke}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Empfehlung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                      <p className="font-semibold text-green-800">
                        {caseData.recommendation || "Widerspruch einlegen"}
                      </p>
                      <p className="text-sm text-green-600 mt-1">Konfidenz: {caseData.confidence_level || 85}%</p>
                    </div>
                    {caseData.final_analysis && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <p className="text-sm text-slate-700">{caseData.final_analysis.substring(0, 200)}...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <Tabs defaultValue="final" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="final">Finale Analyse</TabsTrigger>
                <TabsTrigger value="claude">Claude</TabsTrigger>
                <TabsTrigger value="deepseek">DeepSeek</TabsTrigger>
                <TabsTrigger value="gemini">Gemini</TabsTrigger>
                <TabsTrigger value="openai">GPT-4o</TabsTrigger>
              </TabsList>

              <TabsContent value="final">
                <Card>
                  <CardHeader>
                    <CardTitle>Finale Analyse & Empfehlung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="whitespace-pre-wrap text-sm">
                        {caseData.final_analysis || "Keine finale Analyse verfügbar."}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="claude">
                <Card>
                  <CardHeader>
                    <CardTitle>Claude Analyse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="whitespace-pre-wrap text-sm">
                        {caseData.claude_analysis || "Keine Claude-Analyse verfügbar."}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deepseek">
                <Card>
                  <CardHeader>
                    <CardTitle>DeepSeek Analyse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="whitespace-pre-wrap text-sm">
                        {caseData.deepseek_analysis || "Keine DeepSeek-Analyse verfügbar."}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gemini">
                <Card>
                  <CardHeader>
                    <CardTitle>Gemini Analyse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="whitespace-pre-wrap text-sm">
                        {caseData.gemini_analysis || "Keine Gemini-Analyse verfügbar."}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="openai">
                <Card>
                  <CardHeader>
                    <CardTitle>GPT-4o Analyse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="whitespace-pre-wrap text-sm">
                        {caseData.openai_analysis || "Keine OpenAI-Analyse verfügbar."}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="opposition" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Widerspruchs-E-Mail
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => copyToClipboard(oppositionEmail)} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Kopieren
                  </Button>
                  <Button onClick={() => window.open(`mailto:?body=${encodeURIComponent(oppositionEmail)}`)} size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    E-Mail öffnen
                  </Button>
                </div>
                <Textarea
                  value={oppositionEmail}
                  onChange={(e) => setOppositionEmail(e.target.value)}
                  className="min-h-96 font-mono text-sm"
                  placeholder="Widerspruchs-E-Mail wird generiert..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Dokumente & Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Vollständige Analyse (PDF)
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Widerspruchsschrift (DOCX)
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Fallakte (ZIP)
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Zusammenfassung (PDF)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
