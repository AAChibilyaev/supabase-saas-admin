/**
 * Convert array of objects to CSV string (browser-compatible)
 * @param data Array of objects to convert
 * @returns CSV string
 */
export function jsonToCsv(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) {
    return ''
  }

  // Get all unique keys from all objects
  const allKeys = new Set<string>()
  data.forEach((obj) => {
    Object.keys(obj).forEach((key) => allKeys.add(key))
  })
  const headers = Array.from(allKeys)

  // Escape CSV values (handle commas, quotes, newlines)
  const escapeCsvValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return ''
    }
    const stringValue = String(value)
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  // Build CSV rows
  const rows: string[] = []
  
  // Header row
  rows.push(headers.map(escapeCsvValue).join(','))

  // Data rows
  data.forEach((obj) => {
    const row = headers.map((header) => {
      const value = obj[header]
      // Handle arrays and objects
      if (Array.isArray(value)) {
        return escapeCsvValue(value.join('; '))
      }
      if (value && typeof value === 'object') {
        return escapeCsvValue(JSON.stringify(value))
      }
      return escapeCsvValue(value)
    })
    rows.push(row.join(','))
  })

  return rows.join('\n')
}

/**
 * Generic CSV exporter for react-admin
 * @param data Array of records to export
 * @param fetchRelatedRecords Optional function to fetch related records
 * @param resourceName Name of the resource (used for filename)
 * @param fieldMapping Optional mapping to transform field names/values
 */
export const createExporter = (
  resourceName: string,
  fieldMapping?: Record<string, string | ((record: Record<string, unknown>) => unknown)>
) => {
  return async (data: Record<string, unknown>[], fetchRelatedRecords?: (data: Record<string, unknown>[]) => Promise<Record<string, unknown>[]>) => {
    try {
      let dataToExport = data

      // Fetch related records if function is provided
      if (fetchRelatedRecords) {
        try {
          dataToExport = await fetchRelatedRecords(data)
        } catch (error) {
          console.error("Failed to fetch related records:", error)
        }
      }

      // Transform data according to field mapping
      const transformedData = dataToExport.map((record) => {
        const transformed: Record<string, unknown> = {}

        if (fieldMapping) {
          Object.entries(fieldMapping).forEach(([key, mapper]) => {
            if (typeof mapper === "function") {
              transformed[key] = mapper(record)
            } else if (typeof mapper === "string") {
              transformed[key] = record[mapper]
            }
          })
        } else {
          // If no mapping, export all fields
          Object.assign(transformed, record)
        }

        // Remove null and undefined values
        Object.keys(transformed).forEach((key) => {
          if (transformed[key] === null || transformed[key] === undefined) {
            delete transformed[key]
          }
        })

        return transformed
      })

      // Convert to CSV
      const csv = jsonToCsv(transformedData)

      // Create download link
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)

      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `${resourceName}-${new Date().toISOString().split("T")[0]}.csv`
      )
      link.style.visibility = "hidden"

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to export CSV:", error)
    }
  }
}

/**
 * Helper to format dates for CSV export
 */
export const formatDateForExport = (date: string | null | undefined) => {
  if (!date) return ""
  try {
    return new Date(date).toISOString()
  } catch {
    return date
  }
}

/**
 * Helper to format arrays for CSV export
 */
export const formatArrayForExport = (arr: unknown[] | null | undefined) => {
  if (!arr || !Array.isArray(arr)) return ""
  return arr.join(", ")
}

/**
 * Helper to format boolean for CSV export
 */
export const formatBooleanForExport = (value: boolean | null | undefined) => {
  if (value === null || value === undefined) return ""
  return value ? "Yes" : "No"
}
