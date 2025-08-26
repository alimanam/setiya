'use client'

import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRight, Plus, Trash2, Edit, User, Mail, Calendar, Shield, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface Operator {
  _id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: "admin" | "operator"
  createdAt: string
  updatedAt: string
}

export default function OperatorsPage() {
  const router = useRouter()
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")
  const [currentUser, setCurrentUser] = useState<Operator | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "operator" as "admin" | "operator"
  })

  const fetchOperators = useCallback(async () => {
    try {
      const response = await fetch("/api/operators")
      if (response.ok) {
        const data = await response.json()
        setOperators(data)
      } else {
        setMessage("خطا در دریافت لیست اپراتورها")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("خطا در دریافت لیست اپراتورها")
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Get current user from localStorage
    const operatorData = localStorage.getItem("operator")
    if (operatorData) {
      setCurrentUser(JSON.parse(operatorData))
    }
    fetchOperators()
  }, [fetchOperators])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "operator"
    })
  }

  const handleAddOperator = async () => {
    try {
      const response = await fetch("/api/operators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setMessage("اپراتور جدید با موفقیت ایجاد شد")
        setMessageType("success")
        setShowAddModal(false)
        resetForm()
        fetchOperators()
      } else {
        const data = await response.json()
        setMessage(data.error || "خطا در ایجاد اپراتور")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("خطا در ایجاد اپراتور")
      setMessageType("error")
    }
  }

  const handleEditOperator = async () => {
    if (!selectedOperator) return

    try {
      const response = await fetch(`/api/operators/${selectedOperator._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setMessage("اطلاعات اپراتور با موفقیت به‌روزرسانی شد")
        setMessageType("success")
        setShowEditModal(false)
        resetForm()
        setSelectedOperator(null)
        fetchOperators()
      } else {
        const data = await response.json()
        setMessage(data.error || "خطا در به‌روزرسانی اپراتور")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("خطا در به‌روزرسانی اپراتور")
      setMessageType("error")
    }
  }

  const handleDeleteOperator = async () => {
    if (!selectedOperator) return

    try {
      const response = await fetch(`/api/operators/${selectedOperator._id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setMessage("اپراتور با موفقیت حذف شد")
        setMessageType("success")
        setShowDeleteDialog(false)
        setSelectedOperator(null)
        fetchOperators()
      } else {
        const data = await response.json()
        setMessage(data.error || "خطا در حذف اپراتور")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("خطا در حذف اپراتور")
      setMessageType("error")
    }
  }

  const openEditModal = (operator: Operator) => {
    setSelectedOperator(operator)
    setFormData({
      username: operator.username,
      password: "",
      email: operator.email,
      firstName: operator.firstName,
      lastName: operator.lastName,
      role: operator.role
    })
    setShowEditModal(true)
  }

  const openDeleteDialog = (operator: Operator) => {
    setSelectedOperator(operator)
    setShowDeleteDialog(true)
  }

  const getRoleBadge = (role: string) => {
    return role === "admin" ? (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
        <Shield className="h-3 w-3 mr-1" />
        مدیر
      </Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        <User className="h-3 w-3 mr-1" />
        اپراتور
      </Badge>
    )
  }

  // Check if current user is admin
  const isAdmin = currentUser?.role === "admin"

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={() => router.push("/dashboard")} className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    بازگشت به داشبورد
                  </Button>
                  <h1 className="text-xl font-semibold text-gray-900">مدیریت اپراتورها</h1>
                </div>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">در حال بارگذاری...</p>
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50" dir="rtl">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.push("/dashboard")} className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  بازگشت به داشبورد
                </Button>
                <h1 className="text-xl font-semibold text-gray-900">مدیریت اپراتورها</h1>
              </div>
              {isAdmin && (
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  افزودن اپراتور جدید
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {message && (
            <Alert
              className={`mb-6 ${
                messageType === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
              }`}
            >
              <AlertDescription className={messageType === "error" ? "text-red-800" : "text-green-800"}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                لیست اپراتورها
              </CardTitle>
              <CardDescription>
                مدیریت کاربران سیستم و تنظیم سطح دسترسی آن‌ها
              </CardDescription>
            </CardHeader>
            <CardContent>
              {operators.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">هیچ اپراتوری یافت نشد</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right font-bold">نام و نام خانوادگی</TableHead>
                        <TableHead className="text-right font-bold">نام کاربری</TableHead>
                        <TableHead className="text-right font-bold">ایمیل</TableHead>
                        <TableHead className="text-right font-bold">نقش</TableHead>
                        <TableHead className="text-right font-bold">تاریخ ایجاد</TableHead>
                        <TableHead className="text-right font-bold">عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operators.map((operator) => (
                        <TableRow key={operator._id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-indigo-600" />
                              </div>
                              {operator.firstName} {operator.lastName}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {operator.username}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              {operator.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(operator.role)}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {formatDate(operator.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isAdmin && (
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex items-center gap-1"
                                  onClick={() => openEditModal(operator)}
                                >
                                  <Edit className="h-3 w-3" />
                                  ویرایش
                                </Button>
                                {operator.role !== "admin" && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => openDeleteDialog(operator)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    حذف
                                  </Button>
                                )}
                              </div>
                            )}
                            {!isAdmin && (
                              <span className="text-gray-400 text-sm">دسترسی محدود</span>
                            )}
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

        {/* Add Operator Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-[425px]" dir="rtl">
            <DialogHeader>
              <DialogTitle>افزودن اپراتور جدید</DialogTitle>
              <DialogDescription>
                اطلاعات اپراتور جدید را وارد کنید
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">
                  نام
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">
                  نام خانوادگی
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  نام کاربری
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  رمز عبور
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  ایمیل
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  نقش
                </Label>
                <Select value={formData.role} onValueChange={(value: "admin" | "operator") => setFormData({...formData, role: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="انتخاب نقش" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">اپراتور</SelectItem>
                    <SelectItem value="admin">مدیر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                انصراف
              </Button>
              <Button type="button" onClick={handleAddOperator}>
                ایجاد اپراتور
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Operator Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[425px]" dir="rtl">
            <DialogHeader>
              <DialogTitle>ویرایش اطلاعات اپراتور</DialogTitle>
              <DialogDescription>
                اطلاعات اپراتور را ویرایش کنید
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editFirstName" className="text-right">
                  نام
                </Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editLastName" className="text-right">
                  نام خانوادگی
                </Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editUsername" className="text-right">
                  نام کاربری
                </Label>
                <Input
                  id="editUsername"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editPassword" className="text-right">
                  رمز عبور جدید
                </Label>
                <Input
                  id="editPassword"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="col-span-3"
                  placeholder="خالی بگذارید تا تغییر نکند"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editEmail" className="text-right">
                  ایمیل
                </Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editRole" className="text-right">
                  نقش
                </Label>
                <Select value={formData.role} onValueChange={(value: "admin" | "operator") => setFormData({...formData, role: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="انتخاب نقش" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">اپراتور</SelectItem>
                    <SelectItem value="admin">مدیر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                انصراف
              </Button>
              <Button type="button" onClick={handleEditOperator}>
                به‌روزرسانی
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأیید حذف اپراتور</AlertDialogTitle>
              <AlertDialogDescription>
                آیا از حذف اپراتور "{selectedOperator?.firstName} {selectedOperator?.lastName}" اطمینان دارید؟
                این عمل قابل بازگشت نیست.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>انصراف</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteOperator} className="bg-red-600 hover:bg-red-700">
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthGuard>
  )
}