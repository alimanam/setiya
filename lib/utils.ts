import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// تبدیل سال میلادی به شمسی
export function toJalaliYear(gregorianYear: number): number {
  // الگوریتم ساده برای تبدیل سال میلادی به شمسی
  // سال شمسی معمولاً 621 یا 622 سال کمتر از میلادی است
  // برای سال‌های بعد از 2023، اختلاف 621 مناسب‌تر است
  if (gregorianYear >= 2023) return gregorianYear - 621
  return gregorianYear - 622
}
