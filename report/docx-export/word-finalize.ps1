# Opens the generated .docx in Word, updates the TOC / list fields, saves it, and exports a PDF for checking.
param([string]$Docx, [string]$Pdf)
$w = New-Object -ComObject Word.Application
$w.Visible = $false
$w.DisplayAlerts = 0
try {
  $d = $w.Documents.Open($Docx, $false, $false, $false)
  $d.Repaginate()
  foreach ($t in $d.TablesOfContents) { $t.Update() }
  $d.Fields.Update() | Out-Null
  foreach ($t in $d.TablesOfContents) { $t.UpdatePageNumbers() }
  $d.Save()
  $d.ExportAsFixedFormat($Pdf, 17)
  "pages: " + $d.ComputeStatistics(2) + " | TOCs: " + $d.TablesOfContents.Count + " | tables: " + $d.Tables.Count + " | images: " + $d.InlineShapes.Count
  $d.Close($false)
} finally {
  $w.Quit()
}
