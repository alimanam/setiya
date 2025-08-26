"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ArrowRight, Plus, Settings, Search, Edit, Trash2, Clock, Package } from "lucide-react"
import { useRouter } from "next/navigation"

interface Service {
  _id: string
  id: string
  name: string
  type: "time-based" | "unit-based"
  price: number
  description: string
  category: string
  isActive: boolean
  createdAt: string
}

interface Category {
  _id: string
  name: string
  description?: string
  isActive: boolean
}

export default function ServicesPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "time-based" as "time-based" | "unit-based",
    price: "",
    description: "",
    category: "",
    isActive: true,
  })
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services")
      if (response.ok) {
        const data = await response.json()
        const servicesWithId = data.map((service: any) => ({
          ...service,
          id: service._id,
        }))
        setServices(servicesWithId)
      }
    } catch (error) {
      console.error("Failed to fetch services:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data.filter((cat: Category) => cat.isActive))
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  useEffect(() => {
    fetchServices()
    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.name || !formData.price || !formData.category) {
      setMessage("لطفاً تمام فیلدهای ضروری را پر کنید")
      setMessageType("error")
      setLoading(false)
      return
    }

    const price = Number.parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      setMessage("قیمت باید عددی مثبت باشد")
      setMessageType("error")
      setLoading(false)
      return
    }

    try {
      if (editingService) {
        // Update existing service
        const response = await fetch(`/api/services/${editingService._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            type: formData.type,
            price: price,
            description: formData.description,
            category: formData.category,
            isActive: formData.isActive,
          }),
        })

        if (response.ok) {
          setMessage("سرویس با موفقیت به‌روزرسانی شد")
          setEditingService(null)
          setIsDialogOpen(false)
          resetForm()
          fetchServices()
        } else {
          const errorData = await response.json()
          setMessage(errorData.error || "خطا در به‌روزرسانی سرویس")
          setMessageType("error")
        }
      } else {
        // Create new service
        const response = await fetch("/api/services", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            type: formData.type,
            price: price,
            description: formData.description,
            category: formData.category,
            isActive: formData.isActive,
          }),
        })

        if (response.ok) {
          setMessage("سرویس با موفقیت اضافه شد")
          resetForm()
          setIsDialogOpen(false)
          fetchServices()
        } else {
          const errorData = await response.json()
          setMessage(errorData.error || "خطا در افزودن سرویس")
          setMessageType("error")
        }
      }

      if (messageType !== "error") {
        setMessageType("success")
        setFormData({
          name: "",
          type: "time-based",
          price: "",
          description: "",
          category: "",
          isActive: true,
        })
      }
    } catch (error) {
      setMessage("خطا در ارتباط با سرور")
      setMessageType("error")
    } finally {
      setLoading(false)
    }

    // Clear message after 3 seconds
    setTimeout(() => setMessage(""), 3000)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "time-based",
      price: "",
      description: "",
      category: "",
      isActive: true,
    })
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      type: service.type,
      price: service.price.toString(),
      description: service.description,
      category: service.category,
      isActive: service.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleCancelEdit = () => {
    setEditingService(null)
    resetForm()
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    const service = services.find(s => s.id === id)
    if (service) {
      setServiceToDelete(service)
      setIsDeleteDialogOpen(true)
    }
  }

  const confirmDelete = async () => {
    if (!serviceToDelete) return
    
    try {
      const response = await fetch(`/api/services/${serviceToDelete._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage("سرویس حذف شد")
        setMessageType("success")
        fetchServices()
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || "خطا در حذف سرویس")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("خطا در ارتباط با سرور")
      setMessageType("error")
    }
    
    setIsDeleteDialogOpen(false)
    setServiceToDelete(null)
    setTimeout(() => setMessage(""), 3000)
  }

  const toggleServiceStatus = async (id: string) => {
    try {
      const service = services.find(s => s.id === id)
      if (!service) return
      
      const response = await fetch(`/api/services/${service._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...service,
          isActive: !service.isActive,
        }),
      })

      if (response.ok) {
        fetchServices()
      } else {
        setMessage("خطا در تغییر وضعیت سرویس")
        setMessageType("error")
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      setMessage("خطا در ارتباط با سرور")
      setMessageType("error")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const filteredServices = services.filter(
    (service) =>
      service.name.includes(searchTerm) ||
      service.category.includes(searchTerm) ||
      service.description.includes(searchTerm),
  )

  const formatPrice = (price: number, type: "time-based" | "unit-based") => {
    return type === "time-based" ? `${price.toLocaleString()} تومان/دقیقه` : `${price.toLocaleString()} تومان`
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.push("/dashboard")} className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  بازگشت به داشبورد
                </Button>
                <h1 className="text-xl font-semibold text-gray-900">مدیریت سرویس‌ها</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/dashboard/categories")} 
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  مدیریت دسته‌بندی‌ها
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {message && (
            <Alert
              className={`mb-6 ${messageType === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
            >
              <AlertDescription className={messageType === "error" ? "text-red-800" : "text-green-800"}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Services List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">لیست سرویس‌ها</CardTitle>
                  <CardDescription>مشاهده و مدیریت سرویس‌های تعریف شده ({services.length} سرویس)</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white" 
                      onClick={() => {
                        setEditingService(null)
                        resetForm()
                      }}
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      افزودن سرویس جدید
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[60vh] rounded-2xl border-2 border-slate-200">
                    <DialogHeader className="pb-3">
                      <DialogTitle className="text-lg font-bold">{editingService ? "ویرایش سرویس" : "افزودن سرویس جدید"}</DialogTitle>
                      <DialogDescription className="text-sm">
                        {editingService ? "اطلاعات سرویس را ویرایش کنید" : "سرویس جدید را تعریف کنید"}
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-3 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="name" className="text-sm">نام سرویس *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="نام سرویس"
                          className="text-right h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="type" className="text-sm">نوع سرویس *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: "time-based" | "unit-based") =>
                            setFormData({ ...formData, type: value, category: "" })
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="time-based">زمان‌محور (دقیقه‌ای)</SelectItem>
                            <SelectItem value="unit-based">واحد محور (قیمت ثابت)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="category" className="text-sm">دسته‌بندی *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="انتخاب دسته‌بندی" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category._id} value={category.name}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="price" className="text-sm">
                          قیمت * {formData.type === "time-based" ? "(تومان/دقیقه)" : "(تومان)"}
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="قیمت"
                          className="text-right h-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="description" className="text-sm">توضیحات</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="توضیحات اختیاری"
                        className="text-right h-9"
                      />
                    </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={loading} size="sm">
                          {loading ? "در حال پردازش..." : editingService ? "به‌روزرسانی سرویس" : "افزودن سرویس"}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancelEdit} size="sm">
                          انصراف
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Search Bar */}
              <div className="flex items-center gap-2 mt-4">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="جستجو در سرویس‌ها..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm text-right"
                />
              </div>
            </CardHeader>

            <CardContent>
                  {filteredServices.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {services.length === 0 ? "هنوز سرویسی تعریف نشده است" : "سرویس مورد نظر یافت نشد"}
                      </h3>
                      <p className="text-gray-500">
                        {services.length === 0 ? "برای شروع، اولین سرویس خود را اضافه کنید" : "عبارت جستجو را تغییر دهید"}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow className="hover:bg-gray-50">
                            <TableHead className="text-right font-semibold text-gray-900">نام سرویس</TableHead>
                            <TableHead className="text-right font-semibold text-gray-900">نوع</TableHead>
                            <TableHead className="text-right font-semibold text-gray-900">دسته‌بندی</TableHead>
                            <TableHead className="text-right font-semibold text-gray-900">قیمت</TableHead>
                            <TableHead className="text-right font-semibold text-gray-900">وضعیت</TableHead>
                            <TableHead className="text-right font-semibold text-gray-900">عملیات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredServices.map((service, index) => (
                            <TableRow key={service.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                              <TableCell className="font-medium">
                                <div>
                                  <div className="text-gray-900 font-semibold">{service.name}</div>
                                  {service.description && (
                                    <div className="text-sm text-gray-500 mt-1">{service.description}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                  {service.type === "time-based" ? (
                                    <>
                                      <Clock className="h-3 w-3 text-orange-600" />
                                      <span className="text-orange-700">زمان‌محور</span>
                                    </>
                                  ) : (
                                    <>
                                      <Package className="h-3 w-3 text-purple-600" />
                                      <span className="text-purple-700">واحد محور</span>
                                    </>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {service.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium text-gray-900">
                                <span className="text-lg">{formatPrice(service.price, service.type)}</span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleServiceStatus(service.id)}
                                  className={`transition-colors ${
                                    service.isActive
                                      ? "text-green-700 border-green-300 bg-green-50 hover:bg-green-100"
                                      : "text-red-700 border-red-300 bg-red-50 hover:bg-red-100"
                                  }`}
                                >
                                  {service.isActive ? "فعال" : "غیرفعال"}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                    onClick={() => handleEdit(service)}
                                  >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200 transition-colors"
                                    onClick={() => handleDelete(service.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </main>
          </div>
          
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-right">تایید حذف سرویس</AlertDialogTitle>
                <AlertDialogDescription className="text-right text-gray-600">
                  آیا از حذف سرویس "{serviceToDelete?.name}" اطمینان دارید؟ این عمل قابل بازگشت نیست.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse gap-2">
                <AlertDialogCancel 
                  className="mt-0"
                  onClick={() => {
                    setIsDeleteDialogOpen(false)
                    setServiceToDelete(null)
                  }}
                >
                  انصراف
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </AuthGuard>
      )
    }
