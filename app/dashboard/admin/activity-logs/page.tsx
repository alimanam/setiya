'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Search, Filter, RefreshCw, Calendar, User, Activity, Database, AlertCircle, CheckCircle, ArrowRight, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ActivityLog {
  _id: string
  operatorId: string
  operatorUsername: string
  action: string
  resource: string
  resourceId?: string
  details?: any
  ipAddress?: string
  userAgent?: string
  timestamp: string
  status: 'success' | 'failed'
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface Filters {
  actions: string[]
  resources: string[]
  operators: string[]
  statuses: string[]
}

export default function ActivityLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [filters, setFilters] = useState<Filters>({
    actions: [],
    resources: [],
    operators: [],
    statuses: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)

  // Filter states
  const [search, setSearch] = useState('')
  const [selectedAction, setSelectedAction] = useState('all')
  const [selectedResource, setSelectedResource] = useState('all')
  const [selectedOperator, setSelectedOperator] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('timestamp')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)

  // Check if user is admin
  useEffect(() => {
    const operatorData = localStorage.getItem('operator')
    if (!operatorData) {
      router.push('/dashboard')
      return
    }

    const user = JSON.parse(operatorData)
    if (user.role !== 'admin') {
      router.push('/dashboard')
      return
    }
  }, [router])

  // Fetch activity logs
  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy,
        sortOrder
      })

      if (search) params.append('search', search)
      if (selectedAction && selectedAction !== 'all') params.append('action', selectedAction)
      if (selectedResource && selectedResource !== 'all') params.append('resource', selectedResource)
      if (selectedOperator && selectedOperator !== 'all') params.append('operatorUsername', selectedOperator)
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const response = await fetch(`/api/admin/activity-logs?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'خطا در دریافت لاگ‌ها')
      }

      const data = await response.json()
      setLogs(data.logs)
      setPagination(data.pagination)
      setFilters(data.filters)
    } catch (error: any) {
      setError(error.message)
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [currentPage, sortBy, sortOrder])

  // Auto-apply filters when they change (but not on initial load)
  useEffect(() => {
    // Skip on initial load when all filters are at default values
    if (logs.length > 0 && (selectedAction !== 'all' || selectedResource !== 'all' || selectedOperator !== 'all' || selectedStatus !== 'all' || dateFrom || dateTo)) {
      setCurrentPage(1)
      fetchLogs()
    }
  }, [selectedAction, selectedResource, selectedOperator, selectedStatus, dateFrom, dateTo])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchLogs()
  }

  const handleReset = () => {
    setSearch('')
    setSelectedAction('all')
    setSelectedResource('all')
    setSelectedOperator('all')
    setSelectedStatus('all')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
    // Use setTimeout to ensure state updates are applied before fetching
    setTimeout(() => {
      fetchLogs()
    }, 0)
  }

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout':
        return 'bg-blue-100 text-blue-800'
      case 'create':
        return 'bg-green-100 text-green-800'
      case 'update':
        return 'bg-yellow-100 text-yellow-800'
      case 'delete':
        return 'bg-red-100 text-red-800'
      case 'cancel_session':
        return 'bg-orange-100 text-orange-800'
      case 'view':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-purple-100 text-purple-800'
    }
  }

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'auth':
        return <User className="h-4 w-4" />
      case 'session':
        return <Activity className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('fa-IR'),
      time: date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getActionText = (action: string) => {
    const actionMap: { [key: string]: string } = {
      'login': 'ورود',
      'logout': 'خروج',
      'create': 'ایجاد',
      'update': 'ویرایش',
      'delete': 'حذف',
      'view': 'مشاهده',
      'start_session': 'شروع جلسه',
      'end_session': 'پایان جلسه',
      'pause_session': 'توقف جلسه',
      'resume_session': 'ادامه جلسه',
      'cancel_session': 'لغو جلسه',
      'add_service': 'افزودن سرویس',
      'edit_service': 'ویرایش سرویس',
      'remove_service': 'حذف سرویس'
    }
    return actionMap[action] || action
  }

  const getResourceText = (resource: string) => {
    const resourceMap: { [key: string]: string } = {
      'auth': 'احراز هویت',
      'customer': 'مشتری',
      'service': 'سرویس',
      'session': 'جلسه',
      'category': 'دسته‌بندی',
      'operator': 'اپراتور',
      'settings': 'تنظیمات'
    }
    return resourceMap[resource] || resource
  }

  const handleDeleteAll = async () => {
    try {
      setDeletingAll(true)
      const response = await fetch('/api/admin/activity-logs/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setLogs([])
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false
        })
        setShowDeleteAllDialog(false)
        // Show success message or toast here if needed
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'خطا در حذف لاگ‌ها')
      }
    } catch (error) {
      console.error('Error deleting all logs:', error)
      setError('خطا در حذف لاگ‌ها')
    } finally {
      setDeletingAll(false)
    }
  }

  if (loading && logs.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="mr-2 text-lg">در حال بارگذاری...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')} className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                بازگشت به داشبورد
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">تاریخچه فعالیت آپراتورها</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchLogs} disabled={loading} variant="outline" size="sm" className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                بروزرسانی
              </Button>
              <Button 
                onClick={() => setShowDeleteAllDialog(true)} 
                disabled={loading || deletingAll} 
                variant="destructive" 
                size="sm" 
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                حذف همه لاگ‌ها
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فیلترها و جستجو
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="جستجو در نام کاربری، عملیات، منبع..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              جستجو
            </Button>
            <Button variant="outline" onClick={handleReset}>
              پاک کردن
            </Button>
          </div>

          {/* Filter dropdowns */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger>
                <SelectValue placeholder="عملیات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه عملیات</SelectItem>
                {filters.actions.map(action => (
                  <SelectItem key={action} value={action}>
                    {getActionText(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedResource} onValueChange={setSelectedResource}>
              <SelectTrigger>
                <SelectValue placeholder="منبع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه منابع</SelectItem>
                {filters.resources.map(resource => (
                  <SelectItem key={resource} value={resource}>
                    {getResourceText(resource)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedOperator} onValueChange={setSelectedOperator}>
              <SelectTrigger>
                <SelectValue placeholder="اپراتور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه اپراتورها</SelectItem>
                {filters.operators.map(operator => (
                  <SelectItem key={operator} value={operator}>
                    {operator}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="success">موفق</SelectItem>
                <SelectItem value="failed">ناموفق</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="از تاریخ"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <Input
                type="date"
                placeholder="تا تاریخ"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>نتایج ({pagination.totalCount.toLocaleString('fa-IR')} مورد)</CardTitle>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timestamp">تاریخ</SelectItem>
                  <SelectItem value="operatorUsername">اپراتور</SelectItem>
                  <SelectItem value="action">عملیات</SelectItem>
                  <SelectItem value="resource">منبع</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">نزولی</SelectItem>
                  <SelectItem value="asc">صعودی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">تاریخ و زمان</TableHead>
                  <TableHead className="text-right">اپراتور</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                  <TableHead className="text-right">منبع</TableHead>
                  <TableHead className="text-right">شناسه منبع</TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="text-right">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const { date, time } = formatDate(log.timestamp)
                  return (
                    <TableRow key={log._id}>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{date}</div>
                          <div className="text-gray-500">{time}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{log.operatorUsername}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>
                          {getActionText(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getResourceIcon(log.resource)}
                          <span>{getResourceText(log.resource)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 font-mono">
                          {log.resourceId || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {log.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className={log.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                            {log.status === 'success' ? 'موفق' : 'ناموفق'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 font-mono">
                          {log.ipAddress || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {logs.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              هیچ لاگی یافت نشد
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => pagination.hasPrevPage && setCurrentPage(currentPage - 1)}
                  className={!pagination.hasPrevPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                >
                  قبلی
                </PaginationPrevious>
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i
                if (pageNum > pagination.totalPages) return null
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum.toLocaleString('fa-IR')}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => pagination.hasNextPage && setCurrentPage(currentPage + 1)}
                  className={!pagination.hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                >
                  بعدی
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
        </div>
      </main>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              حذف همه لاگ‌ها
            </DialogTitle>
            <DialogDescription>
              آیا مطمئن هستید که می‌خواهید همه لاگ‌های فعالیت را حذف کنید؟ این عمل غیرقابل بازگشت است.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteAllDialog(false)}
              disabled={deletingAll}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className="flex items-center gap-2"
            >
              {deletingAll ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {deletingAll ? 'در حال حذف...' : 'حذف همه'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}