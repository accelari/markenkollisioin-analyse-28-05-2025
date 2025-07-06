import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Scale, Calendar, User, Mail } from "lucide-react"
import { notFound } from "next/navigation"

interface PageProps {
  params: { caseNumber: string }
}

export default async function CasePage({ params }: PageProps) {
  const { data: caseData, error } = await supabase
    .from("cases")
    .select("*")
    .eq("case_number", params.caseNumber)
    .single()

  if (error || !caseData) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Scale className="h-6 w-6 text-indigo-600" />
                  Fall {caseData.case_number}
                </CardTitle>
                <p className="text-slate-600 mt-1">Markenrechts-Analyse</p>
              </div>
              <Badge className={getStatusColor(caseData.status)}>
                {caseData.status === "active" ? "Aktiv" : caseData.status}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Case Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Markeninformationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-blue-600">Auftragsmarke</h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{caseData.auftragsmarke}</p>
              </div>
              <div>
                <h4 className="font-semibold text-red-600">Gegenmarke</h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{caseData.gegenmarke}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Mandant & Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" />
                <span className="text-sm">{caseData.client_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="text-sm">{caseData.client_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-sm">{formatDate(caseData.created_at)}</span>
              </div>
              {caseData.recommendation && (
                <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <h4 className="font-semibold text-indigo-800">Empfehlung</h4>
                  <p className="text-sm text-indigo-700">{caseData.recommendation}</p>
                  {caseData.confidence_level && (
                    <p className="text-xs text-indigo-600 mt-1">Konfidenz: {caseData.confidence_level}%</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analyse-Ergebnisse</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="final" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="final">Finale Analyse</TabsTrigger>
                <TabsTrigger value="claude">Claude</TabsTrigger>
                <TabsTrigger value="deepseek">DeepSeek</TabsTrigger>
                <TabsTrigger value="gemini">Gemini</TabsTrigger>
                <TabsTrigger value="openai">GPT-4o</TabsTrigger>
              </TabsList>

              <TabsContent value="final">
                <ScrollArea className="h-96 w-full rounded-md border p-4">
                  <div className="whitespace-pre-wrap text-sm">
                    {caseData.final_analysis || "Keine finale Analyse verfügbar."}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="claude">
                <ScrollArea className="h-96 w-full rounded-md border p-4">
                  <div className="whitespace-pre-wrap text-sm">
                    {caseData.claude_analysis || "Keine Claude-Analyse verfügbar."}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="deepseek">
                <ScrollArea className="h-96 w-full rounded-md border p-4">
                  <div className="whitespace-pre-wrap text-sm">
                    {caseData.deepseek_analysis || "Keine DeepSeek-Analyse verfügbar."}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="gemini">
                <ScrollArea className="h-96 w-full rounded-md border p-4">
                  <div className="whitespace-pre-wrap text-sm">
                    {caseData.gemini_analysis || "Keine Gemini-Analyse verfügbar."}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="openai">
                <ScrollArea className="h-96 w-full rounded-md border p-4">
                  <div className="whitespace-pre-wrap text-sm">
                    {caseData.openai_analysis || "Keine GPT-4o-Analyse verfügbar."}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
