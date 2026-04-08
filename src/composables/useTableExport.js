export function useTableExport(defaultFileName = 'export') {
  function exportCsv(data, columns, fileName) {
    const name = fileName || defaultFileName
    const header = columns.map((col) => col.label).join(',')
    const rows = data.map((row) =>
      columns.map((col) => {
        const value = String(row[col.key] ?? '')
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, `${name}.csv`)
  }

  async function exportExcel(data, columns, fileName) {
    const XLSX = await import('xlsx')
    const name = fileName || defaultFileName
    const headers = columns.map((col) => col.label)
    const rows = data.map((row) => columns.map((col) => row[col.key] ?? ''))
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws['!cols'] = columns.map((col) => {
      const maxLen = Math.max(col.label.length, ...data.map((row) => String(row[col.key] ?? '').length))
      return { wch: Math.min(maxLen + 2, 50) }
    })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    XLSX.writeFile(wb, `${name}.xlsx`)
  }

  async function exportPdf(data, columns, fileName, title) {
    const { default: jsPDF } = await import('jspdf')
    await import('jspdf-autotable')
    const name = fileName || defaultFileName
    const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait' })
    if (title) {
      doc.setFontSize(14)
      doc.text(title, 14, 20)
    }
    const headers = columns.map((col) => col.label)
    const rows = data.map((row) => columns.map((col) => String(row[col.key] ?? '')))
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: title ? 30 : 14,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [15, 76, 129], textColor: 255 },
      alternateRowStyles: { fillColor: [241, 245, 249] }
    })
    doc.save(`${name}.pdf`)
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return { exportCsv, exportExcel, exportPdf }
}
