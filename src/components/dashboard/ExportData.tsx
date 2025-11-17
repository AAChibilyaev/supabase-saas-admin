import { useState } from 'react'
import { Button } from '../ui/button'
import { Download, FileText, Table, FileDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { useToast } from '../../hooks/use-toast'
import { format } from 'date-fns'

interface ExportDataProps {
  data: Record<string, unknown>[]
  filename?: string
}

export const ExportData = ({ data, filename = 'dashboard-data' }: ExportDataProps) => {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const exportToCSV = () => {
    try {
      setIsExporting(true)

      if (!data || data.length === 0) {
        toast({
          title: 'No data to export',
          description: 'There is no data available to export.',
          variant: 'destructive'
        })
        return
      }

      // Get headers from first object
      const headers = Object.keys(data[0])

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => {
            const value = row[header]
            // Escape values that contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value ?? ''
          }).join(',')
        )
      ].join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Export successful',
        description: `Data exported to ${filename}.csv`
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const exportToJSON = () => {
    try {
      setIsExporting(true)

      if (!data || data.length === 0) {
        toast({
          title: 'No data to export',
          description: 'There is no data available to export.',
          variant: 'destructive'
        })
        return
      }

      const jsonContent = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.json`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Export successful',
        description: `Data exported to ${filename}.json`
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const exportToPDF = async () => {
    try {
      setIsExporting(true)

      if (!data || data.length === 0) {
        toast({
          title: 'No data to export',
          description: 'There is no data available to export.',
          variant: 'destructive'
        })
        return
      }

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${filename} - Analytics Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            h1 {
              color: #1e40af;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 10px;
            }
            .header {
              margin-bottom: 30px;
            }
            .date {
              color: #666;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #3b82f6;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #e5e7eb;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            .summary {
              background-color: #eff6ff;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .summary h2 {
              margin-top: 0;
              color: #1e40af;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${filename}</h1>
            <p class="date">Generated on ${format(new Date(), 'PPpp')}</p>
          </div>

          <div class="summary">
            <h2>Summary</h2>
            <p>Total Records: ${data.length.toLocaleString()}</p>
          </div>

          <table>
            <thead>
              <tr>
                ${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${Object.values(row).map(value =>
                    `<td>${value !== null && value !== undefined ? String(value) : ''}</td>`
                  ).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>This report was automatically generated by the Analytics Dashboard</p>
          </div>
        </body>
        </html>
      `

      // Create blob and download as HTML (can be opened and printed to PDF)
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.html`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Export successful',
        description: 'Report exported. Open the HTML file and use browser Print to save as PDF.'
      })
    } catch (error) {
      console.error('PDF export error:', error)
      toast({
        title: 'Export failed',
        description: 'Failed to export report. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const printReport = () => {
    try {
      window.print()
    } catch (error) {
      console.error('Print error:', error)
      toast({
        title: 'Print failed',
        description: 'Failed to print report. Please try again.',
        variant: 'destructive'
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToCSV}>
          <Table className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileDown className="h-4 w-4 mr-2" />
          Export as PDF/HTML
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={printReport}>
          <FileText className="h-4 w-4 mr-2" />
          Print Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
