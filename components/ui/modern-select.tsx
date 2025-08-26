'use client'

import * as React from 'react'
import { ChevronsUpDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

export type Option = { value: string; label: string; searchText?: string }

export interface ModernSelectProps {
  options: Option[]
  value?: string
  onValueChange?: (val: string) => void
  placeholder?: string
  className?: string
  isDisabled?: boolean
  searchPlaceholder?: string
  emptyText?: string
}

// Searchable, RTL-first Modern Select built on Popover + Command (Radix-based)
export function ModernSelect({
  options,
  value,
  onValueChange,
  placeholder = 'انتخاب کنید...',
  className,
  isDisabled = false,
  searchPlaceholder = 'جستجو...',
  emptyText = 'موردی یافت نشد.',
}: ModernSelectProps) {
  const [open, setOpen] = React.useState(false)
  const selected = React.useMemo(() => options.find((o) => o.value === value), [options, value])

  // Ensure Popover width matches trigger width exactly
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)
  const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>(undefined)

  const measureWidth = React.useCallback(() => {
    const w = triggerRef.current?.offsetWidth
    if (w && w !== triggerWidth) setTriggerWidth(w)
  }, [triggerWidth])

  React.useEffect(() => {
    if (open) {
      measureWidth()
      const onResize = () => measureWidth()
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }
  }, [open, measureWidth])

  return (
    <div className={cn('w-full', className)} dir="rtl">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={isDisabled}
            className={cn(
              'w-full h-12 rounded-xl bg-white/80 backdrop-blur-sm border border-white/50 text-right',
              'shadow-sm hover:shadow-md transition-all',
              !selected && 'text-muted-foreground'
            )}
          >
            <span className="line-clamp-1">{selected ? selected.label : placeholder}</span>
            <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start" style={{ width: triggerWidth }}>
          <Command>
            <CommandInput placeholder={searchPlaceholder} className="text-right" />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.searchText || opt.label}
                    onSelect={() => {
                      onValueChange?.(opt.value)
                      setOpen(false)
                    }}
                    className="text-right"
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === opt.value ? 'opacity-100' : 'opacity-0')} />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}