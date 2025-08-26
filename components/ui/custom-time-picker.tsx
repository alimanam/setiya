'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomTimePickerProps {
  value?: string
  onChange?: (time: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CustomTimePicker({ 
  value, 
  onChange, 
  placeholder = "انتخاب زمان", 
  className, 
  disabled 
}: CustomTimePickerProps) {
  const [open, setOpen] = useState(false)
  const [hour, setHour] = useState('00')
  const [minute, setMinute] = useState('00')
  const hourContainerRef = useRef<HTMLDivElement>(null)
  const minuteContainerRef = useRef<HTMLDivElement>(null)

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':')
      if (h && m) {
        setHour(h.padStart(2, '0'))
        setMinute(m.padStart(2, '0'))
      }
    }
  }, [value])

  // Generate hour options (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0')
  )

  // Generate minute options (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) => 
    i.toString().padStart(2, '0')
  )

  const handleTimeChange = (newHour: string, newMinute: string) => {
    const timeString = `${newHour}:${newMinute}`
    setHour(newHour)
    setMinute(newMinute)
    onChange?.(timeString)
    setOpen(false)
  }

  const displayValue = value || `${hour}:${minute}`

  // Scroll to selected time when popover opens
  useEffect(() => {
    if (open && value) {
      setTimeout(() => {
        // Scroll hour container to selected hour
        if (hourContainerRef.current) {
          const selectedHourElement = hourContainerRef.current.querySelector(`[data-hour="${hour}"]`)
          if (selectedHourElement) {
            selectedHourElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
        
        // Scroll minute container to selected minute
        if (minuteContainerRef.current) {
          const selectedMinuteElement = minuteContainerRef.current.querySelector(`[data-minute="${minute}"]`)
          if (selectedMinuteElement) {
            selectedMinuteElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      }, 100) // Small delay to ensure DOM is rendered
    }
  }, [open, hour, minute, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? value : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2 text-center">دقیقه</label>
            <div ref={minuteContainerRef} className="h-32 overflow-y-auto border rounded">
              {minutes.map((m) => (
                <button
                  key={m}
                  data-minute={m}
                  className={cn(
                    "w-12 h-8 text-sm hover:bg-gray-100 flex items-center justify-center",
                    minute === m && "bg-blue-500 text-white hover:bg-blue-600"
                  )}
                  onClick={() => setMinute(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          
          <div className="text-2xl font-bold">:</div>
          
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2 text-center">ساعت</label>
            <div ref={hourContainerRef} className="h-32 overflow-y-auto border rounded">
              {hours.map((h) => (
                <button
                  key={h}
                  data-hour={h}
                  className={cn(
                    "w-12 h-8 text-sm hover:bg-gray-100 flex items-center justify-center",
                    hour === h && "bg-blue-500 text-white hover:bg-blue-600"
                  )}
                  onClick={() => setHour(h)}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-4 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setOpen(false)}
          >
            لغو
          </Button>
          <Button 
            size="sm" 
            onClick={() => handleTimeChange(hour, minute)}
          >
            تأیید
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}