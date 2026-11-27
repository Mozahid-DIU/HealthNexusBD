# Opens the report in Microsoft Word, fills the table of contents, list of figures, list of tables and
# page numbers, saves the .docx and exports a PDF next to it.
# Usage: powershell -ExecutionPolicy Bypass -File update_fields.ps1 <path-to-docx>
param([Parameter(Mandatory = $true)][string]$DocPath)

$full = (Resolve-Path $DocPath).Path
$pdf = [System.IO.Path]::ChangeExtension($full, '.pdf')
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open($full)
    # Twice: the first pass fills the lists, which moves page numbers; the second pass fixes them.
    for ($i = 0; $i -lt 2; $i++) {
        foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
        $doc.Fields.Update() | Out-Null
        $doc.Repaginate()
    }
    $doc.Save()
    $doc.ExportAsFixedFormat($pdf, 17)   # 17 = wdExportFormatPDF
    "pages: " + $doc.ComputeStatistics(2)
    $doc.Close()
    "saved $full"
    "saved $pdf"
}
finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
