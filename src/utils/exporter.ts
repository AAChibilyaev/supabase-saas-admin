// @ts-ignore - jsonexport doesn't have types
import jsonExport from "jsonexport/dist"

/**
 * Generic CSV exporter for react-admin
 * @param data Array of records to export
 * @param fetchRelatedRecords Optional function to fetch related records
 * @param resourceName Name of the resource (used for filename)
 * @param fieldMapping Optional mapping to transform field names/values
 */
export const createExporter = (
  resourceName: string,
  fieldMapping?: Record<string, string | ((record: any) => any)>
) => {
  return async (data: any[], fetchRelatedRecords?: any) => {
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
      const transformed: any = {}

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
    jsonExport(transformedData, (err: any, csv: string) => {
      if (err) {
        console.error("Failed to export CSV:", err)
        return
      }

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
    })
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
export const formatArrayForExport = (arr: any[] | null | undefined) => {
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
