"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Scale, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import type { CaseData } from "@/lib/supabase"

interface OppositionDialogProps {
  isOpen: boolean
  onClose: () => void
  caseData: {
    auftragsmarke: string
    gegenmarke: string
    final_analysis?: string
    recommendation?: string
    confidence_level?: number
  }
  analysisResults: any[]
}

export default function OppositionDialog({ isOpen, onClose, caseData, analysisResults }: OppositionDialogProps) {
  const [step, setStep] = useState<"form" | "processing" | "success">("form")
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [caseNumber, setCaseNumber] = useState<string | null>(null)
  const [caseUrl, setCaseUrl] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!clientName.trim() || !clientEmail.trim()) {
      return
    }

    setStep("processing")

    try {
      // Prepare case data
      const caseDataToSave: Partial<CaseData> = {
        auftragsmarke: caseData.auftragsmarke,
        gegenmarke: caseData.gegenmarke,
        final_analysis: caseData.final_analysis,
        recommendation: caseData.recommendation,
        confidence_level: caseData.confidence_level,
        client_name: clientName,
        client_email: clientEmail,
        // Add analysis results
        claude_analysis: analysisResults.find((r) => r.provider === "anthropic")?.content,
        deepseek_analysis: analysisResults.find((r) => r.provider === "deepseek")?.content,
        gemini_analysis: analysisResults.find((r) => r.provider === "gemini")?.content,
        openai_analysis: analysisResults.find((r) => r.provider === "openai")?.content,
      }

      // Save to database
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseDataToSave),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.details || "Failed to save case")
      }

      setCaseNumber(result.case_number)
      setCaseUrl(result.case_url)
      setStep("success")
    } catch (error) {
      console.error("Error saving case:", error)
      setStep("form")
      // You could add error handling here
    }
  }

  const handleClose = () => {
    setStep("form")
    setClientName("")
    setClientEmail("")
    setAdditionalNotes("")
    setCaseNumber(null)
    setCaseUrl(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Scale className="h-6 w-6 text-indigo-600" />
            {step === "form" && "Widerspruch vorbereiten"}
            {step === "processing" && "Widerspruch wird vorbereitet..."}
            {step === "success" && "Informationen für Widerspruch erfasst!"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Basierend auf der KI-Analyse wird ein Widerspruch empfohlen. Wir bereiten alle notwendigen Dokumente vor
                und senden Ihnen eine E-Mail mit dem Link zum Fall.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Ihr Name *</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Max Mustermann"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">E-Mail-Adresse *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="max@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Zusätzliche Hinweise (optional)</Label>
              <Textarea
                id="additionalNotes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Besondere Umstände, Fristen, oder andere wichtige Informationen..."
                rows={3}
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-slate-800 mb-2">Was passiert als nächstes?</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>✅ Fall wird in unserem System gespeichert</li>
                <li>✅ Widerspruchsschrift wird vorbereitet</li>
                <li>✅ E-Mail mit Link zum Fall wird versendet</li>
                <li>✅ Alle KI-Analysen und Dokumente verfügbar</li>
              </ul>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 mx-auto mb-4 text-indigo-600 animate-spin" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Widerspruch wird vorbereitet...</h3>
            <p className="text-slate-600">Wir speichern Ihren Fall und bereiten alle Dokumente vor.</p>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8 space-y-4">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
            <h3 className="text-xl font-bold text-green-800">Fall erfolgreich gespeichert!</h3>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-700 text-sm">
                <strong>Fall-Nummer:</strong> {caseNumber}
              </p>
              <p className="text-green-700 text-sm mt-1">
                <strong>Fall-Link:</strong>{" "}
                <a href={caseUrl} className="underline" target="_blank" rel="noopener noreferrer">
                  {caseUrl}
                </a>
              </p>
              <p className="text-green-700 text-sm mt-2">
                Alle Analysen und Dokumente wurden gespeichert. Sie können den Fall über den Link aufrufen.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "form" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Abbrechen
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!clientName.trim() || !clientEmail.trim()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Scale className="h-4 w-4 mr-2" />
                Widerspruch vorbereiten
              </Button>
            </>
          )}
          {step === "success" && <Button onClick={handleClose}>Schließen</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
