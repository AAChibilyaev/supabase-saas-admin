import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu as MenuIcon } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CustomMenu } from './CustomMenu'

export const MobileMenu = () => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden min-h-touch min-w-touch"
          aria-label="Open menu"
        >
          <MenuIcon className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="px-4 py-2">
            <CustomMenu />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
