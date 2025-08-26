'use client'

import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Eye, Clock, DollarSign, User, Phone, Activity, ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, QrCode, X } from "lucide-react"
import { Session } from "./types"
import { getTimeBasedServicesDuration } from "./utils"
import { useRouter } from "next/navigation"

interface CompletedSessionsTableProps {
  sessions: Session[]
  onViewDetails: (session: Session) => void
  formatDuration: (minutes: number) => string
  formatPrice: (price: number) => string
  getSessionDuration: (session: Session) => string
}

export function CompletedSessionsTable({
  sessions,
  onViewDetails,
  formatDuration,
  formatPrice,
  getSessionDuration
}: CompletedSessionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<'endTime' | 'customerName' | 'totalCost'>('endTime')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [customerFilter, setCustomerFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  // Remove QR modal states
  // const [qrModalOpen, setQrModalOpen] = useState(false)
  // const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const itemsPerPage = 25
  const router = useRouter()

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = sessions.filter(session => {
      const customerMatch = customerFilter === '' || 
        session.customerName.toLowerCase().includes(customerFilter.toLowerCase())
      
      const dateMatch = dateFilter === '' || 
        (session.endTime && new Date(session.endTime).toLocaleDateString('fa-IR').includes(dateFilter))
      
      return customerMatch && dateMatch
    })

    // Sort sessions
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'endTime':
          aValue = a.endTime ? new Date(a.endTime).getTime() : 0
          bValue = b.endTime ? new Date(b.endTime).getTime() : 0
          break
        case 'customerName':
          aValue = a.customerName.toLowerCase()
          bValue = b.customerName.toLowerCase()
          break
        case 'totalCost':
          aValue = a.totalCost || 0
          bValue = b.totalCost || 0
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

    return filtered
  }, [sessions, customerFilter, dateFilter, sortField, sortDirection])

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedSessions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSessions = filteredAndSortedSessions.slice(startIndex, endIndex)

  // Handle sorting
  const handleSort = (field: 'endTime' | 'customerName' | 'totalCost') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  // Get sort icon
  const getSortIcon = (field: 'endTime' | 'customerName' | 'totalCost') => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  // Reset filters
  const resetFilters = () => {
    setCustomerFilter('')
    setDateFilter('')
    setCurrentPage(1)
  }

  // Handle QR code click
  const handleQrClick = (id: string) => {
    router.push(`/dashboard/sessions/${id}`)
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Activity className="h-12 w-12 text-emerald-500" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">هیچ جلسه تمام شده‌ای وجود ندارد</h3>
        <p className="text-gray-600 mb-6">جلسات تمام شده در اینجا نمایش داده می‌شوند</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-sm font-medium shadow-lg">
          <Clock className="h-4 w-4" />
          آماده برای ثبت تاریخچه
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-xl border border-emerald-200/50 shadow-sm">
        <div className="space-y-3">
          <label className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
            <Search className="h-4 w-4" />
            جستجو بر اساس نام مشتری
          </label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
            <Input
              placeholder="نام مشتری..."
              value={customerFilter}
              onChange={(e) => {
                setCustomerFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="pr-10 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20 bg-white/80 backdrop-blur-sm"
            />
          </div>
        </div>
        
        <div className="space-y-3">
          <label className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            فیلتر بر اساس تاریخ
          </label>
          <div className="relative">
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
            <Input
              placeholder="تاریخ (مثال: 1403/01/15)..."
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="pr-10 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20 bg-white/80 backdrop-blur-sm"
            />
          </div>
        </div>
        
        <div className="space-y-3">
          <label className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            مرتب‌سازی
          </label>
          <div className="flex gap-2">
            <Select value={sortField} onValueChange={(value: any) => {
              setSortField(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger className="flex-1 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20 bg-white/80 backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border-emerald-200">
                <SelectItem value="endTime" className="focus:bg-emerald-50">تاریخ پایان</SelectItem>
                <SelectItem value="customerName" className="focus:bg-emerald-50">نام مشتری</SelectItem>
                <SelectItem value="totalCost" className="focus:bg-emerald-50">مبلغ</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="px-3 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700"
            >
              {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Clear Filters */}
      {(customerFilter || dateFilter) && (
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200/50">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetFilters}
            className="border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400"
          >
            <Filter className="h-4 w-4 mr-2" />
            پاک کردن فیلترها
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-emerald-700">
              {filteredAndSortedSessions.length} جلسه یافت شد
            </span>
          </div>
        </div>
      )}

      {/* Sessions Info */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-slate-700">نمایش {startIndex + 1} تا {Math.min(endIndex, filteredAndSortedSessions.length)} از {filteredAndSortedSessions.length} جلسه</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span className="text-sm font-medium text-slate-700">صفحه {currentPage} از {totalPages}</span>
        </div>
      </div>

      {/* Table */}
      <div className="border border-emerald-200 rounded-xl overflow-hidden shadow-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
              <TableHead className="text-left font-bold text-white">عملیات</TableHead>
              <TableHead className="text-left font-bold text-white">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('totalCost')}
                  className="h-auto p-0 font-bold hover:bg-white/10 text-white flex items-center gap-1 justify-start"
                >
                  <DollarSign className="h-4 w-4" />
                  مجموع هزینه
                  {getSortIcon('totalCost')}
                </Button>
              </TableHead>
              <TableHead className="text-left font-bold text-white">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  مجموع زمان سرویس‌های زمانی
                </div>
              </TableHead>
              <TableHead className="text-left font-bold text-white">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('endTime')}
                  className="h-auto p-0 font-bold hover:bg-white/10 text-white flex items-center gap-1 justify-start"
                >
                  <Clock className="h-4 w-4" />
                  زمان پایان
                  {getSortIcon('endTime')}
                </Button>
              </TableHead>
              <TableHead className="text-left font-bold text-white">
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  تعداد سرویس‌ها
                </div>
              </TableHead>
              <TableHead className="text-left font-bold text-white">
                <div className="flex items-center gap-1">
                  <QrCode className="h-4 w-4" />
                  بارکد جلسه
                </div>
              </TableHead>
              <TableHead className="text-left font-bold text-white">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('customerName')}
                  className="h-auto p-0 font-bold hover:bg-white/10 text-white flex items-center gap-1 justify-start"
                >
                  
                  نام مشتری
                  {getSortIcon('customerName')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentSessions.map((session, index) => {
              const qrRef = useRef<HTMLDivElement>(null);
              const qrText = (session.completedSessionId?.toString() || (session._id || session.id || '').toString());
              const navId = (session._id || session.id || '').toString();
              
              useEffect(() => {
                let cancelled = false;
                let timeoutId: NodeJS.Timeout | null = null;
                
                const renderQr = async () => {
                  try {
                    if (!qrRef.current) return;
                    
                    // Clear previous content
                    qrRef.current.innerHTML = '';
                    
                    // Add loading indicator
                    qrRef.current.innerHTML = '<div style="text-align:center;font-size:10px;">در حال بارگذاری...</div>';
                    
                    // Import QR Creator dynamically
                    const QrCreatorModule = await import('qr-creator');
                    const QrCreator = QrCreatorModule.default || QrCreatorModule;
                    
                    if (!QrCreator) {
                      if (qrRef.current && !cancelled) {
                        qrRef.current.innerHTML = '<span style="color:red;font-size:10px;">خطا</span>';
                      }
                      return;
                    }
                    
                    // Render QR code with a slight delay to ensure DOM is ready
                    timeoutId = setTimeout(() => {
                      try {
                        if (cancelled || !qrRef.current) return;
                        
                        // Clear any loading indicator
                        qrRef.current.innerHTML = '';
                        
                        QrCreator.render(
                          {
                            text: qrText,
                            radius: 0.3,
                            ecLevel: 'M',
                            fill: '#111827',
                            background: '#FFFFFF',
                            size: 60, // smaller size for table cell
                          },
                          qrRef.current
                        );
                      } catch (renderErr) {
                        console.error('Error rendering QR code:', renderErr);
                        if (!cancelled && qrRef.current) {
                          qrRef.current.innerHTML = '<span style="color:red;font-size:10px;">خطا</span>';
                        }
                      }
                    }, 100);
                  } catch (err) {
                    console.error('Failed to render QR code:', err);
                    if (!cancelled && qrRef.current) {
                      qrRef.current.innerHTML = '<span style="color:red;font-size:10px;">خطا</span>';
                    }
                  }
                };
                
                renderQr();
                
                return () => {
                  cancelled = true;
                  if (timeoutId) clearTimeout(timeoutId);
                  if (qrRef.current) qrRef.current.innerHTML = '';
                };
              }, [qrText]);
              
              return (
                <TableRow key={session.id || session._id} className={`hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  {/* عملیات - centered */}
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDetails(session)}
                        className="border-emerald-300 hover:bg-emerald-50 text-emerald-700 hover:border-emerald-400 transition-all duration-200 shadow-sm"
                      >
                        <Eye className="h-4 w-4 ml-2" />
                        جزئیات
                      </Button>
                    </div>
                  </TableCell>
                  {/* مجموع هزینه - centered */}
                  <TableCell className="text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                        {formatPrice(session.totalCost || 0)}
                      </div>
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                    </div>
                  </TableCell>
                  {/* مجموع زمان سرویس‌های زمانی - centered */}
                  <TableCell className="text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {getTimeBasedServicesDuration(session)}
                      </div>
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                  </TableCell>
                  {/* زمان پایان - already centered box */}
                  <TableCell className="text-center">
                    <div className="bg-gradient-to-r from-gray-100 to-slate-100 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 border border-slate-200 inline-block">
                      {session.endTime ? (
                        <>
                          <div className="font-bold">
                            {new Date(session.endTime).toLocaleDateString("fa-IR", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit"
                            })}
                          </div>
                          <div className="text-slate-500 mt-1">
                            {new Date(session.endTime).toLocaleTimeString("fa-IR", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </div>
                        </>
                      ) : (
                        "-"
                      )}
                    </div>
                  </TableCell>
                  {/* تعداد سرویس‌ها - centered */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-bold border border-purple-200 shadow-sm">
                        {session.services.length}
                      </div>
                    </div>
                  </TableCell>
                  {/* بارکد - centered and navigates to details page */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <div 
                        ref={qrRef} 
                        className="w-16 h-16 bg-white border border-gray-200 rounded-md flex items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all duration-200"
                        onClick={() => handleQrClick(navId)}
                        title="کلیک کنید تا صفحه جزئیات جلسه باز شود"
                      >
                        {/* QR code will be rendered here */}
                      </div>
                    </div>
                  </TableCell>
                  {/* نام مشتری - centered */}
                  <TableCell className="text-center">
                    <div className="flex items-center gap-3 justify-center">
                      <div className="bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium border border-indigo-200">
                        {session.customerName}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200 shadow-sm">
          <Pagination className="justify-center">
            <PaginationContent className="gap-2">
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-500 hover:text-white"} transition-all duration-200 rounded-lg border border-emerald-200 bg-white shadow-sm`}
                >
                  قبلی
                </PaginationPrevious>
              </PaginationItem>
              
              {getPageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-2 text-slate-500">...</span>
                  ) : (
                    <PaginationLink
                      onClick={() => setCurrentPage(page as number)}
                      isActive={currentPage === page}
                      className={`cursor-pointer transition-all duration-200 rounded-lg border shadow-sm ${
                        currentPage === page 
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-500" 
                          : "bg-white border-slate-200 hover:bg-gradient-to-r hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-300"
                      }`}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-500 hover:text-white"} transition-all duration-200 rounded-lg border border-emerald-200 bg-white shadow-sm`}
                >
                  بعدی
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* QR Code Modal removed - now using dedicated page */}
    </div>
  )
}

// Remove QrModal definitions completely