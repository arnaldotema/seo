"use client"

import type React from "react"
import { useState } from "react"
import Papa from "papaparse"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CSVRow {
  email: string
  seo: string
  [key: string]: string
}

export default function SEOGenerator() {
  const [file, setFile] = useState<File | null>(null)
  const [rowsMissingSEO, setRowsMissingSEO] = useState<CSVRow[]>([])
  const [processing, setProcessing] = useState(false)
  const [downloadURL, setDownloadURL] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [previewData, setPreviewData] = useState<CSVRow[]>([])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setRowsMissingSEO([])
      setDownloadURL(null)
      setError(null)
      setProgress(0)
      setPreviewData([])
    }
  }

  const processCSV = async () => {
    if (!file) {
      setError("Please upload a CSV file first.")
      return
    }

    setProcessing(true)
    setError(null)
    setProgress(0)

    const reader = new FileReader()
    reader.onload = async (event) => {
      if (event.target && typeof event.target.result === "string") {
        const csvContent = event.target.result
        const parsed = Papa.parse<CSVRow>(csvContent, { header: true, skipEmptyLines: true })
        const rows = parsed.data

        if (!rows.length) {
          setError("The CSV file is empty or improperly formatted.")
          setProcessing(false)
          return
        }

        const rowsMissing = rows.filter((row) => !row.seo || row.seo.trim() === "")
        setRowsMissingSEO(rowsMissing)

        const domains = rowsMissing.map((row) => row.email.split("@")[1])
        console.log("Domains missing SEO:", domains)

        try {
        console.log("Calling the API:")
          const response = await axios.post("/api/generate-seo", { rows: rowsMissing })

          const updatedRows = rows.map((row) => {
            const domain = row.email.split("@")[1]
            if (response.data[domain]) {
              row.seo = response.data[domain]
            }
            return row
          })

          setPreviewData(updatedRows.slice(0, 10))

          const csv = Papa.unparse(updatedRows)
          const blob = new Blob([csv], { type: "text/csv" })
          const url = URL.createObjectURL(blob)
          setDownloadURL(url)
          setProgress(100)
        } catch (error) {
          console.error("Error generating SEO descriptions:", error)
          setError("Failed to generate SEO descriptions. Please try again.")
        } finally {
          setProcessing(false)
        }
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">SEO Description Generator</h1>
      <Input type="file" accept=".csv" onChange={handleFileUpload} className="mb-4" aria-label="Upload CSV file" />
      {file && (
        <div className="mt-4">
          <p>File uploaded: {file.name}</p>
          {rowsMissingSEO.length > 0 && <p>Rows missing SEO descriptions: {rowsMissingSEO.length}</p>}
          <Button onClick={processCSV} disabled={processing} className="mt-4">
            {processing ? "Processing..." : "Generate SEO Descriptions"}
          </Button>
        </div>
      )}
      {processing && <Progress value={progress} className="mt-4" />}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {downloadURL && (
        <div className="mt-4">
          <Button asChild>
            <a href={downloadURL} download="updated.csv">
              Download Updated CSV
            </a>
          </Button>
        </div>
      )}
      {previewData.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Preview (First 10 Results)</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>SEO Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.seo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}


