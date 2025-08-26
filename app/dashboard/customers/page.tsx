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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowRight, UserPlus, Users, Search, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface Customer {
  _id: string
  firstName: string
  lastName: string
  phone: string
  registrationDate: string
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [limit] = useState(10)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  })
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false)
  const [isEditCustomerDialogOpen, setIsEditCustomerDialogOpen] = useState(false)
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null)
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  })

  const fetchCustomers = async (page: number = currentPage, search: string = searchTerm) => {
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
      const response = await fetch(`/api/customers?page=${page}&limit=${limit}${searchParam}`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers)
        setCurrentPage(data.pagination.currentPage)
        setTotalPages(data.pagination.totalPages)
        setTotalCustomers(data.pagination.totalCustomers)
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error)
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page when searching
    fetchCustomers(1, term)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

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
        setFormData({ firstName: "", lastName: "", phone: "" })
        setMessage("مشتری با موفقیت ثبت شد")
        setMessageType("success")
        setIsAddCustomerDialogOpen(false)
        await fetchCustomers() // Refresh the list
      } else {
        const error = await response.json()
        if (error.error === "Phone number already exists") {
          setMessage("این شماره تلفن قبلاً ثبت شده است")
        } else {
          setMessage("خطا در ثبت مشتری")
        }
        setMessageType("error")
      }
    } catch (error) {
      setMessage("خطا در ارتباط با سرور")
      setMessageType("error")
    }

    setLoading(false)
    setTimeout(() => setMessage(""), 3000)
  }

  const handleEdit = (customer: Customer) => {
    setCustomerToEdit(customer)
    setEditFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
    })
    setIsEditCustomerDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerToEdit) return
    setLoading(true)

    if (!editFormData.firstName || !editFormData.lastName || !editFormData.phone) {
      setMessage("لطفاً تمام فیلدها را پر کنید")
      setMessageType("error")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/customers/${customerToEdit._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        setMessage("اطلاعات مشتری با موفقیت به‌روزرسانی شد")
        setMessageType("success")
        setIsEditCustomerDialogOpen(false)
        setCustomerToEdit(null)
        setEditFormData({ firstName: "", lastName: "", phone: "" })
        await fetchCustomers() // Refresh the list
      } else {
        const error = await response.json()
        if (error.error === "Phone number already exists") {
          setMessage("این شماره تلفن قبلاً ثبت شده است")
        } else {
          setMessage("خطا در به‌روزرسانی اطلاعات مشتری")
        }
        setMessageType("error")
      }
    } catch (error) {
      setMessage("خطا در ارتباط با سرور")
      setMessageType("error")
    }

    setLoading(false)
    setTimeout(() => setMessage(""), 3000)
  }

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!customerToDelete) return
    
    try {
      const response = await fetch(`/api/customers/${customerToDelete._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage("مشتری حذف شد")
        setMessageType("success")
        await fetchCustomers() // Refresh the list
      } else {
        setMessage("خطا در حذف مشتری")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("خطا در ارتباط با سرور")
      setMessageType("error")
    }
    
    setIsDeleteDialogOpen(false)
    setCustomerToDelete(null)
    setTimeout(() => setMessage(""), 3000)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchCustomers(page, searchTerm)
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1)
    }
  }

  // Search is now handled by API, no need for client-side filtering

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
                <h1 className="text-xl font-semibold text-gray-900">مدیریت مشتریان</h1>
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

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    لیست مشتریان ({customers.length})
                  </CardTitle>
                  <CardDescription>مشاهده و مدیریت مشتریان ثبت شده</CardDescription>
                </div>
                <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      افزودن مشتری جدید
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-right">ثبت مشتری جدید</DialogTitle>
                      <DialogDescription className="text-right">
                        اطلاعات مشتری جدید را وارد کنید
                      </DialogDescription>
                    </DialogHeader>
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
                          onClick={() => setIsAddCustomerDialogOpen(false)}
                          disabled={loading}
                        >
                          انصراف
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="جستجو در مشتریان..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="max-w-sm text-right"
                />
              </div>
            </CardHeader>

            <CardContent>
                  {customers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm ? "مشتری مورد نظر یافت نشد" : "هنوز مشتری ثبت نشده است"}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">نام و نام خانوادگی</TableHead>
                            <TableHead className="text-right">شماره تلفن</TableHead>
                            <TableHead className="text-right">تاریخ ثبت</TableHead>
                            <TableHead className="text-right">عملیات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customers.map((customer) => (
                            <TableRow key={customer._id}>
                              <TableCell className="font-medium">
                                {customer.firstName} {customer.lastName}
                              </TableCell>
                              <TableCell>{customer.phone}</TableCell>
                              <TableCell>{new Date(customer.registrationDate).toLocaleDateString("fa-IR")}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 bg-transparent"
                                    onClick={() => handleEdit(customer)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 bg-transparent"
                                    onClick={() => handleDelete(customer)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 px-2">
                      <div className="text-sm text-gray-600">
                        نمایش {((currentPage - 1) * limit) + 1} تا {Math.min(currentPage * limit, totalCustomers)} از {totalCustomers} مشتری
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrevPage}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1"
                        >
                          <ChevronRight className="h-4 w-4" />
                          قبلی
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-1"
                        >
                          بعدی
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
        </main>
      </div>
      
      {/* Edit Customer Dialog */}
      <Dialog open={isEditCustomerDialogOpen} onOpenChange={setIsEditCustomerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">ویرایش اطلاعات مشتری</DialogTitle>
            <DialogDescription className="text-right">
              اطلاعات مشتری را ویرایش کنید
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editFirstName">نام</Label>
              <Input
                id="editFirstName"
                value={editFormData.firstName}
                onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                placeholder="نام مشتری"
                className="text-right"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLastName">نام خانوادگی</Label>
              <Input
                id="editLastName"
                value={editFormData.lastName}
                onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                placeholder="نام خانوادگی مشتری"
                className="text-right"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">شماره تلفن</Label>
              <Input
                id="editPhone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="09123456789"
                className="text-right"
                disabled={loading}
              />
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditCustomerDialogOpen(false)
                  setCustomerToEdit(null)
                  setEditFormData({ firstName: "", lastName: "", phone: "" })
                }}
                disabled={loading}
              >
                انصراف
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">تایید حذف مشتری</AlertDialogTitle>
            <AlertDialogDescription className="text-right text-gray-600">
              آیا از حذف مشتری "{customerToDelete?.firstName} {customerToDelete?.lastName}" اطمینان دارید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel 
              className="mt-0"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setCustomerToDelete(null)
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
