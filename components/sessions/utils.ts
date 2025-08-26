import PersianDate from "persian-date"
import { Session, SessionService } from "./types"

export const formatDuration = (minutes: number) => {
  const days = Math.floor(minutes / (24 * 60))
  const hours = Math.floor((minutes % (24 * 60)) / 60)
  const mins = minutes % 60
  
  const parts = []
  
  if (days > 0) {
    if (days === 1) {
      parts.push('یک روز')
    } else if (days === 2) {
      parts.push('دو روز')
    } else if (days === 3) {
      parts.push('سه روز')
    } else if (days === 4) {
      parts.push('چهار روز')
    } else if (days === 5) {
      parts.push('پنج روز')
    } else if (days === 6) {
      parts.push('شش روز')
    } else if (days === 7) {
      parts.push('یک هفته')
    } else if (days === 14) {
      parts.push('دو هفته')
    } else if (days === 21) {
      parts.push('سه هفته')
    } else if (days === 30) {
      parts.push('یک ماه')
    } else if (days === 60) {
      parts.push('دو ماه')
    } else if (days === 90) {
      parts.push('سه ماه')
    } else {
      parts.push(`${days} روز`)
    }
  }
  
  if (hours > 0) {
    if (hours === 1) {
      parts.push('یک ساعت')
    } else if (hours === 2) {
      parts.push('دو ساعت')
    } else if (hours === 3) {
      parts.push('سه ساعت')
    } else if (hours === 4) {
      parts.push('چهار ساعت')
    } else if (hours === 5) {
      parts.push('پنج ساعت')
    } else if (hours === 6) {
      parts.push('شش ساعت')
    } else if (hours === 7) {
      parts.push('هفت ساعت')
    } else if (hours === 8) {
      parts.push('هشت ساعت')
    } else if (hours === 9) {
      parts.push('نه ساعت')
    } else if (hours === 10) {
      parts.push('ده ساعت')
    } else if (hours === 11) {
      parts.push('یازده ساعت')
    } else if (hours === 12) {
      parts.push('دوازده ساعت')
    } else {
      parts.push(`${hours} ساعت`)
    }
  }
  
  if (mins > 0) {
    if (mins === 1) {
      parts.push('یک دقیقه')
    } else if (mins === 2) {
      parts.push('دو دقیقه')
    } else if (mins === 3) {
      parts.push('سه دقیقه')
    } else if (mins === 4) {
      parts.push('چهار دقیقه')
    } else if (mins === 5) {
      parts.push('پنج دقیقه')
    } else if (mins === 6) {
      parts.push('شش دقیقه')
    } else if (mins === 7) {
      parts.push('هفت دقیقه')
    } else if (mins === 8) {
      parts.push('هشت دقیقه')
    } else if (mins === 9) {
      parts.push('نه دقیقه')
    } else if (mins === 10) {
      parts.push('ده دقیقه')
    } else if (mins === 15) {
      parts.push('پانزده دقیقه')
    } else if (mins === 20) {
      parts.push('بیست دقیقه')
    } else if (mins === 30) {
      parts.push('سی دقیقه')
    } else if (mins === 45) {
      parts.push('چهل و پنج دقیقه')
    } else {
      parts.push(`${mins} دقیقه`)
    }
  }
  
  if (parts.length === 0) {
    return 'کمتر از یک دقیقه'
  }
  
  if (parts.length === 1) {
    return parts[0]
  }
  
  if (parts.length === 2) {
    return `${parts[0]} و ${parts[1]}`
  }
  
  // For 3 or more parts (rare case)
  return parts.slice(0, -1).join('، ') + ' و ' + parts[parts.length - 1]
}

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان'
}

export const getCurrentCost = (service: SessionService) => {
  // For unit-based services or completed time-based services, use stored totalCost
  if (service.serviceType === "unit-based" || service.endTime) {
    return service.totalCost || 0
  }
  
  // For active time-based services, calculate real-time cost
  if (service.serviceType === "time-based" && service.startTime) {
    const currentDuration = getCurrentDuration(service)
    // Apply same logic as backend: < 1 minute => cost = 0
    return currentDuration < 1 ? 0 : Math.floor(currentDuration * (service.price || 0))
  }
  
  return service.totalCost || 0
}

export const getCurrentDuration = (service: SessionService) => {
  if (service.serviceType === "unit-based") {
    return 0
  }
  
  const now = new Date()
  const startTime = service.startTime ? new Date(service.startTime) : now
  
  if (service.endTime) {
    return service.duration || 0
  }
  
  if (service.isPaused) {
    return service.duration || 0
  }
  
  const currentDuration = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60))
  return Math.max(currentDuration - (service.totalPausedDuration || 0), 0)
}

export const convertGregorianToPersian = (date: Date) => {
  const persianDate = new PersianDate(date)
  const formatted = persianDate.format('YYYY/MM/DD')
  // Convert Persian digits to English digits
  return formatted.replace(/[۰-۹]/g, (match) => {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹'
    const englishDigits = '0123456789'
    return englishDigits[persianDigits.indexOf(match)]
  })
}

export const convertPersianToGregorian = (persianDate: string, time: string) => {
  const [year, month, day] = persianDate.split('/').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const persianDateTime = new PersianDate([year, month, day, hour, minute])
  return persianDateTime.toDate()
}

export const getSessionDuration = (session: Session) => {
  const now = new Date()
  const startTime = new Date(session.startTime)
  const endTime = session.endTime ? new Date(session.endTime) : now
  const durationInMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
  return formatDuration(durationInMinutes)
}

// Session-level cost calculation
export const getSessionCurrentCost = (session: Session) => {
  return session.services.reduce((total, service) => {
    return total + (service.totalCost || 0)
  }, 0)
}

// Session-level duration calculation
export const getSessionCurrentDuration = (session: Session) => {
  const now = new Date()
  const startTime = new Date(session.startTime)
  const endTime = session.endTime ? new Date(session.endTime) : now
  return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
}

export const getTimeBasedServicesDuration = (session: Session) => {
  let totalMinutes = 0
  
  session.services.forEach(service => {
    if (service.serviceType === "time-based") {
      if (service.duration) {
        // سرویس تمام شده - از duration استفاده کن
        totalMinutes += Math.floor(service.duration)
      } else if (service.startTime && !service.endTime) {
        // سرویس فعال - مدت زمان جاری را محاسبه کن
        const now = new Date()
        const startTime = new Date(service.startTime)
        const currentDuration = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60))
        
        // اگر سرویس متوقف شده، زمان توقف را کم کن
        if (service.totalPausedDuration) {
          totalMinutes += Math.max(0, currentDuration - service.totalPausedDuration)
        } else {
          totalMinutes += currentDuration
        }
      }
    }
  })
  
  return formatDuration(Math.floor(totalMinutes))
}

export const convertToJalali = (date: Date) => {
  const persianDate = new PersianDate(date)
  const formatted = persianDate.format('YYYY/MM/DD HH:mm')
  // Convert Persian digits to English digits
  return formatted.replace(/[۰-۹]/g, (match) => {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹'
    const englishDigits = '0123456789'
    return englishDigits[persianDigits.indexOf(match)]
  })
}

export const formatDurationHHMM = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export const getSessionDurationHHMM = (session: Session) => {
  const now = new Date()
  const startTime = new Date(session.startTime)
  const endTime = session.endTime ? new Date(session.endTime) : now
  const durationInMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
  return formatDurationHHMM(durationInMinutes)
}

// Get total duration of time-based services in HH:MM format
export const getTimeBasedServicesDurationHHMM = (session: Session) => {
  let totalMinutes = 0
  
  session.services.forEach(service => {
    if (service.serviceType === "time-based") {
      if (service.duration) {
        // سرویس تمام شده - از duration استفاده کن
        totalMinutes += Math.floor(service.duration)
      } else if (service.startTime && !service.endTime) {
        // سرویس فعال - مدت زمان جاری را محاسبه کن
        const now = new Date()
        const startTime = new Date(service.startTime)
        const currentDuration = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60))
        
        // اگر سرویس متوقف شده، زمان توقف را کم کن
        if (service.totalPausedDuration) {
          totalMinutes += Math.max(0, currentDuration - service.totalPausedDuration)
        } else {
          totalMinutes += currentDuration
        }
      }
    }
  })
  
  return formatDurationHHMM(Math.floor(totalMinutes))
}