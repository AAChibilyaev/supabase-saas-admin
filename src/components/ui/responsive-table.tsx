import * as React from "react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const ResponsiveTable = React.forwardRef<HTMLDivElement, ResponsiveTableProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {/* Desktop view - normal table */}
        <div className="hidden md:block overflow-auto">
          {children}
        </div>

        {/* Mobile view - scrollable table */}
        <div className="md:hidden">
          <ScrollArea className="w-full rounded-md border">
            <div className="min-w-[600px]">
              {children}
            </div>
          </ScrollArea>
        </div>
      </div>
    )
  }
)

ResponsiveTable.displayName = "ResponsiveTable"

// Card-based mobile view for lists
interface MobileCardListProps {
  items: any[]
  renderCard: (item: any, index: number) => React.ReactNode
  className?: string
}

export const MobileCardList: React.FC<MobileCardListProps> = ({
  items,
  renderCard,
  className
}) => {
  return (
    <div className={cn("space-y-3 p-2", className)}>
      {items.map((item, index) => (
        <div key={index} className="touch:active:scale-[0.98] transition-transform">
          {renderCard(item, index)}
        </div>
      ))}
    </div>
  )
}
