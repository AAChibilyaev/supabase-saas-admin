import * as React from "react"
import { useInput } from "react-admin"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangeFilterProps {
  source: string
  label?: string
  className?: string
}

export function DateRangeFilter({
  source,
  label = "Date Range",
  className
}: DateRangeFilterProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(undefined)
  const startSource = `${source}_gte`
  const endSource = `${source}_lte`

  const startInput = useInput({ source: startSource })
  const endInput = useInput({ source: endSource })

  React.useEffect(() => {
    if (date?.from) {
      startInput.field.onChange(format(date.from, "yyyy-MM-dd"))
    } else {
      startInput.field.onChange(undefined)
    }

    if (date?.to) {
      endInput.field.onChange(format(date.to, "yyyy-MM-dd"))
    } else {
      endInput.field.onChange(undefined)
    }
  }, [date])

  const handleReset = () => {
    setDate(undefined)
    startInput.field.onChange(undefined)
    endInput.field.onChange(undefined)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>{label}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
          {date && (
            <div className="p-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="w-full"
              >
                Clear
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
