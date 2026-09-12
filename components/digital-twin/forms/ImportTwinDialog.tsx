"use client"

import { useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react"
import {
  parseFile,
  buildTwin,
  sampleNodesCsv,
  sampleEdgesCsv,
  type Row,
  type BuildResult,
} from "@/lib/import/twin-import"

export interface ImportPayload {
  name: string
  nodes: BuildResult["nodes"]
  edges: BuildResult["edges"]
}

interface ImportTwinDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (payload: ImportPayload) => void | Promise<void>
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ImportTwinDialog({ isOpen, onClose, onImport }: ImportTwinDialogProps) {
  const [name, setName] = useState("Imported Supply Chain")
  const [nodeFileName, setNodeFileName] = useState<string | null>(null)
  const [edgeFileName, setEdgeFileName] = useState<string | null>(null)
  const [nodeRows, setNodeRows] = useState<Row[] | null>(null)
  const [edgeRows, setEdgeRows] = useState<Row[]>([])
  const [result, setResult] = useState<BuildResult | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const nodeInputRef = useRef<HTMLInputElement>(null)
  const edgeInputRef = useRef<HTMLInputElement>(null)

  // Rebuild whenever inputs change.
  useEffect(() => {
    if (!nodeRows) {
      setResult(null)
      return
    }
    setResult(buildTwin(nodeRows, edgeRows))
  }, [nodeRows, edgeRows])

  function reset() {
    setNodeFileName(null)
    setEdgeFileName(null)
    setNodeRows(null)
    setEdgeRows([])
    setResult(null)
    setParseError(null)
    setImportError(null)
  }

  async function handleFile(file: File, kind: "nodes" | "edges") {
    setParseError(null)
    setParsing(true)
    try {
      const rows = await parseFile(file)
      if (kind === "nodes") {
        setNodeRows(rows)
        setNodeFileName(file.name)
        if (name === "Imported Supply Chain") {
          setName(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") || "Imported Supply Chain")
        }
      } else {
        setEdgeRows(rows)
        setEdgeFileName(file.name)
      }
    } catch (e: any) {
      setParseError(`Could not read ${file.name}: ${e?.message || "unknown error"}`)
    } finally {
      setParsing(false)
    }
  }

  const canImport = !!result && result.errors.length === 0 && result.stats.nodeCount > 0

  async function handleImport() {
    if (!result || !canImport || importing) return
    setImporting(true)
    setImportError(null)
    try {
      await onImport({ name: name.trim() || "Imported Supply Chain", nodes: result.nodes, edges: result.edges })
      reset()
    } catch (e: any) {
      setImportError(e?.message || "Import failed. Please try again.")
    } finally {
      setImporting(false)
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="top-[4.5rem] translate-y-0 w-[95vw] max-w-2xl max-h-[calc(100vh-5.5rem)] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border p-5 sm:p-6">
          <DialogTitle className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import from CSV / Excel
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload a nodes file (and optionally an edges file) to build a digital twin from your own data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 p-5 sm:p-6">
          {/* Templates */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/50 p-3">
            <span className="text-xs font-medium text-muted-foreground">Need the format?</span>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full text-xs" onClick={() => downloadCsv("nodes-template.csv", sampleNodesCsv())}>
              <Download className="h-3.5 w-3.5" /> Nodes template
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full text-xs" onClick={() => downloadCsv("edges-template.csv", sampleEdgesCsv())}>
              <Download className="h-3.5 w-3.5" /> Edges template
            </Button>
          </div>

          {/* Uploads */}
          <div className="grid gap-3 sm:grid-cols-2">
            <UploadTile
              label="Nodes file"
              required
              fileName={nodeFileName}
              inputRef={nodeInputRef}
              onPick={(f) => handleFile(f, "nodes")}
              onClear={() => { setNodeRows(null); setNodeFileName(null); if (nodeInputRef.current) nodeInputRef.current.value = "" }}
            />
            <UploadTile
              label="Edges file (optional)"
              fileName={edgeFileName}
              inputRef={edgeInputRef}
              onPick={(f) => handleFile(f, "edges")}
              onClear={() => { setEdgeRows([]); setEdgeFileName(null); if (edgeInputRef.current) edgeInputRef.current.value = "" }}
            />
          </div>

          {parsing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Parsing…
            </div>
          )}
          {parseError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{parseError}</p>
          )}

          {/* Preview */}
          {result && (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Twin name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-sm" />
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-2">
                <Stat ok label={`${result.stats.nodeCount} nodes`} />
                <Stat ok={result.stats.edgeCount > 0} label={`${result.stats.edgeCount} edges`} />
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-destructive">
                    <AlertTriangle className="h-4 w-4" /> {result.errors.length} error{result.errors.length > 1 ? "s" : ""} — fix before importing
                  </p>
                  <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-destructive/90">
                    {result.errors.slice(0, 20).map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="rounded-xl border border-theme-amber/30 bg-theme-amber-soft p-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-theme-amber">
                    <AlertTriangle className="h-4 w-4" /> {result.warnings.length} warning{result.warnings.length > 1 ? "s" : ""}
                  </p>
                  <ul className="max-h-24 space-y-1 overflow-y-auto text-xs text-theme-amber">
                    {result.warnings.slice(0, 12).map((w, i) => <li key={i}>• {w}</li>)}
                  </ul>
                </div>
              )}

              {/* Node preview table */}
              {result.nodes.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Type</th>
                        <th className="px-3 py-2 font-medium">Location</th>
                        <th className="px-3 py-2 font-medium">Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {result.nodes.slice(0, 8).map((n) => (
                        <tr key={n.id}>
                          <td className="px-3 py-2 font-medium text-foreground">{(n.data as any).label}</td>
                          <td className="px-3 py-2 text-muted-foreground">{(n.data as any).type}</td>
                          <td className="px-3 py-2 text-muted-foreground">{(n.data as any).address || (n.data as any).country || "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{(((n.data as any).riskScore ?? 0) as number).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.nodes.length > 8 && (
                    <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">+ {result.nodes.length - 8} more…</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border p-5 sm:p-6">
          {importError && (
            <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{importError}</p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="rounded-full" disabled={importing} onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button className="gap-2 rounded-full" disabled={!canImport || importing} onClick={handleImport}>
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {importing ? "Saving…" : "Import & open"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function UploadTile({
  label,
  required,
  fileName,
  inputRef,
  onPick,
  onClear,
}: {
  label: string
  required?: boolean
  fileName: string | null
  inputRef: React.RefObject<HTMLInputElement | null>
  onPick: (f: File) => void
  onClear: () => void
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </span>
        {fileName && (
          <button onClick={onClear} className="text-muted-foreground hover:text-foreground" aria-label="Remove file">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {fileName ? (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-theme-green" />
          <span className="truncate">{fileName}</span>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Upload className="h-4 w-4" />
          Choose .csv / .xlsx
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onPick(f)
        }}
      />
    </div>
  )
}

function Stat({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${ok ? "border-theme-green/30 bg-theme-green-soft text-theme-green" : "border-border bg-muted text-muted-foreground"}`}>
      <CheckCircle2 className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}
