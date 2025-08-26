'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus } from "lucide-react"

interface AddCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCustomerAdded?: () => void
}

export function AddCustomerDialog({ open, onOpenChange, onCustomerAdded }: AddCustomerDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  })
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    if (!formData.firstName || !formData.lastName || !formData.phone) {
      setMessage("لطفاً تمام فیلدها را پر کنید")
      setMessageType("error")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        setFormData({ firstName: "", lastName: "", phone: "" })
        
        setMessage("مشتری جدید با موفقیت ذخیره شد")
        setMessageType("success")
        
        // Call the callback to refresh customer list
        if (onCustomerAdded) {
          onCustomerAdded()
        }
        
        // Close dialog after a short delay
        setTimeout(() => {
          onOpenChange(false)
          setMessage("")
        }, 1500)
      } else {
        const error = await response.json()
        setMessage("خطا در ثبت مشتری")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("خطا در ارتباط با سرور")
      setMessageType("error")
    }

    setLoading(false)
  }

  const handleClose = () => {
    setFormData({ firstName: "", lastName: "", phone: "" })
    setMessage("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            ثبت مشتری جدید
          </DialogTitle>
          <DialogDescription className="text-right">
            اطلاعات مشتری جدید را وارد کنید
          </DialogDescription>
        </DialogHeader>
        
        {message && (
          <div className={`p-3 rounded-md text-sm ${
            messageType === "error" 
              ? "bg-red-50 text-red-800 border border-red-200" 
              : "bg-green-50 text-green-800 border border-green-200"
          }`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">نام</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="نام مشتری"
              className="text-right"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">نام خانوادگی</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="نام خانوادگی مشتری"
              className="text-right"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">شماره تلفن</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="09123456789"
              className="text-right"
              disabled={loading}
            />
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading ? "در حال ثبت..." : "ثبت مشتری"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              انصراف
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}