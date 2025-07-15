"use client"

import React, { useEffect, useState, useMemo } from "react"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table"
import { Badge } from "./components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { Textarea } from "./components/ui/textarea"
import {
  Trash2,
  Edit,
  Plus,
  Calculator,
  Home,
  Droplets,
  Calendar,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./components/ui/collapsible"
import { toast, Toaster } from "sonner"


const API = "https://water-meter-backend.onrender.com";

export default function App() {
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [editingReading, setEditingReading] = useState(null)
  const [selectedReading, setSelectedReading] = useState(null)
  const [expandedMonths, setExpandedMonths] = useState(new Set())
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("current");
  const [quickUpdateReading, setQuickUpdateReading] = useState(null)
  const [isQuickUpdateDialogOpen, setIsQuickUpdateDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [quickUpdateData, setQuickUpdateData] = useState({
    status: "unpaid",
    partialAmount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  })

  // Load data from database on component mount
  useEffect(() => {
    loadReadings()
  }, [])

  const loadReadings = async () => {
    setLoading(true)
    try {
      // Fetch readings
      const res = await fetch(`${API}/api/readings`)
      let data = await res.json()
      if (!Array.isArray(data)) data = []
      // Fetch payments for each reading
      const readingsWithPayments = await Promise.all(
        data.map(async (reading) => {
          const pres = await fetch(`${API}/api/payments/${reading.id}`)
          const payments = await pres.json()
          return { ...reading, payments: payments || [] }
        })
      )
      setReadings(readingsWithPayments)
    } catch (error) {
      toast.error("Failed to load readings")
      console.error("Error loading readings:", error)
    } finally {
      setLoading(false)
    }
  }

  // Group readings by month and year
  const monthlyData = useMemo(() => {
    const grouped = readings.reduce(
      (acc, reading) => {
        const date = new Date(reading.reading_date)
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        const monthName = date.toLocaleDateString("en-US", { month: "long", year: "numeric" })

        if (!acc[monthYear]) {
          acc[monthYear] = {
            month: monthName,
            year: date.getFullYear(),
            readings: [],
            totalUnits: 0,
            totalRevenue: 0,
            totalPaid: 0,
            totalOutstanding: 0,
            averagePrice: 0,
          }
        }

        acc[monthYear].readings.push(reading)
        acc[monthYear].totalUnits += reading.units_consumed
        acc[monthYear].totalRevenue += reading.total_amount
        acc[monthYear].totalPaid += reading.paid_amount
        acc[monthYear].totalOutstanding += reading.total_amount - reading.paid_amount

        return acc
      },
      {},
    )

    // Calculate average price and sort by date (newest first)
    Object.values(grouped).forEach((monthData) => {
      monthData.averagePrice = monthData.totalRevenue / monthData.totalUnits || 0
    })

    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, data]) => ({ key, ...data }))
  }, [readings])

  // Filter readings based on payment status
  const filteredReadings = useMemo(() => {
    if (paymentFilter === "all") return readings
    return readings.filter((reading) => reading.payment_status === paymentFilter)
  }, [readings, paymentFilter])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const body = {
      unitNumber: formData.get("unitNumber"),
      previousReading: Number(formData.get("previousReading")),
      currentReading: Number(formData.get("currentReading")),
      pricePerUnit: Number(formData.get("pricePerUnit")),
      readingDate: formData.get("readingDate"),
      dueDate: formData.get("dueDate"),
    }
    try {
      let res
      if (editingReading) {
        res = await fetch(`${API}/api/readings/${editingReading.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch(`${API}/api/readings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      }
      if (!res.ok) throw new Error("Failed to save reading")
      toast.success(editingReading ? "Reading updated successfully" : "Reading added successfully")
      setIsDialogOpen(false)
      resetForm()
      await loadReadings()
    } catch (error) {
      toast.error("Failed to save reading")
      console.error("Error saving reading:", error)
    }
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    if (!selectedReading) return
    const formData = new FormData(e.target)
    const body = {
      meterReadingId: selectedReading.id,
      amount: Number(formData.get("amount")),
      paymentDate: formData.get("paymentDate"),
      method: formData.get("method"),
      notes: formData.get("notes") || "",
    }
    try {
      console.log("Sending payment with ID:", selectedReading)
      const res = await fetch(`${API}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to record payment")
      toast.success("Payment recorded successfully")
      setIsPaymentDialogOpen(false)
      resetPaymentForm()
      await loadReadings()
    } catch (error) {
      toast.error("Failed to record payment")
      console.error("Error recording payment:", error)
    }
  }

  const handleQuickUpdateSubmit = async (e) => {
    e.preventDefault()
    if (!quickUpdateReading) return
    try {
      let newPaidAmount = quickUpdateReading.paid_amount
      let paymentToAdd = 0
      if (quickUpdateData.status === "paid") {
        paymentToAdd = quickUpdateReading.total_amount - newPaidAmount
        newPaidAmount = quickUpdateReading.total_amount
      } else if (quickUpdateData.status === "partial") {
        paymentToAdd = Number(quickUpdateData.partialAmount) - newPaidAmount
        newPaidAmount = Number(quickUpdateData.partialAmount)
      }
      // Add payment record if needed
      if (paymentToAdd > 0) {
        await fetch(`${API}/api/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meterReadingId: quickUpdateReading.id,
            amount: paymentToAdd,
            paymentDate: quickUpdateData.paymentDate,
            method: "other",
            notes: quickUpdateData.notes || `Status updated to ${quickUpdateData.status} by landlord`,
          }),
        })
      }
      
      
      // Update the reading
      await fetch(`${API}/api/readings/${quickUpdateReading.id}/payment-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paid_amount: newPaidAmount,
          payment_status: quickUpdateData.status,
        }),
      })
      toast.success("Payment status updated successfully")
      setIsQuickUpdateDialogOpen(false)
      resetQuickUpdateForm()
      await loadReadings()
    } catch (error) {
      toast.error("Failed to update payment status")
      console.error("Error updating payment status:", error)
    }
  }

  const resetForm = () => {
    setEditingReading(null)
  }

  const resetPaymentForm = () => {
    setSelectedReading(null)
  }

  const resetQuickUpdateForm = () => {
    setQuickUpdateData({
      status: "unpaid",
      partialAmount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: "",
    })
    setQuickUpdateReading(null)
  }

  const handleEdit = (reading) => {
    setEditingReading(reading)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/api/readings/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete reading")
      toast.success("Reading deleted successfully")
      await loadReadings()
    } catch (error) {
      toast.error("Failed to delete reading")
      console.error("Error deleting reading:", error)
    }
  }

  const handleAddPayment = (reading) => {
    setSelectedReading(reading)
    setIsPaymentDialogOpen(true)
  }

  const handleQuickStatusUpdate = (reading) => {
    setQuickUpdateReading(reading)
    setQuickUpdateData({
      status: reading.payment_status,
      partialAmount: reading.paid_amount?.toString() || "",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: "",
    })
    setIsQuickUpdateDialogOpen(true)
  }

  const toggleMonth = (monthKey) => {
    const newExpanded = new Set(expandedMonths)
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey)
    } else {
      newExpanded.add(monthKey)
    }
    setExpandedMonths(newExpanded)
  }

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "partial":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "unpaid":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getPaymentStatusBadge = (status) => {
    const variants = {
      paid: "default",
      partial: "secondary",
      unpaid: "destructive",
    }
    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    )
  }

  const totalRevenue = readings.reduce((sum, reading) => sum + (Number(reading.total_amount) || 0), 0)
  const totalPaid = readings.reduce((sum, reading) => sum + (Number(reading.paid_amount) || 0), 0)
  const totalOutstanding = totalRevenue - totalPaid

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading meter readings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-200 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-blue-700 rounded-full shadow-lg">
              <Droplets className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight drop-shadow">
              Water Meter Manager
            </h1>
          </div>
          <p className="text-gray-700 text-xl font-medium">
            Manage apartment water meter readings, billing, and payments
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="shadow-lg border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-blue-700">Total Readings</CardTitle>
              <Home className="h-5 w-5 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-blue-700">{readings.length}</div>
              <p className="text-xs text-blue-400">Total meter readings</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-indigo-700">Total Revenue</CardTitle>
              <Calculator className="h-5 w-5 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-indigo-700">Ksh {totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-indigo-400">Expected revenue</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-green-700">Total Paid</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-green-700">Ksh {totalPaid.toFixed(2)}</div>
              <p className="text-xs text-green-400">Payments received</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-red-700">Outstanding</CardTitle>
              <Clock className="h-5 w-5 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-red-700">Ksh {totalOutstanding.toFixed(2)}</div>
              <p className="text-xs text-red-400">Amount due</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-purple-700">Collection Rate</CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-purple-700">
                {totalRevenue > 0 ? ((totalPaid / totalRevenue) * 100).toFixed(1) : "0.0"}%
              </div>
              <p className="text-xs text-purple-400">Payment collection</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="payment-filter" className="font-semibold text-blue-700">Filter by Payment Status:</Label>
            <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value)}>
              
                <SelectValue />
             
              <SelectContent className="w-32">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadReadings} size="sm" className="border-blue-300 flex items-center shadow">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-gradient-to-r from-blue-600 to-indigo-600 flex item-center text-white shadow-lg hover:from-blue-700 hover:to-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Add New Reading
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingReading ? "Edit Water Meter Reading" : "Add New Water Meter Reading"}</DialogTitle>
                <DialogDescription>Enter the meter reading details for the apartment unit.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unitNumber">Unit Number</Label>
                    <Input
                      id="unitNumber"
                      name="unitNumber"
                      placeholder="e.g., A101"
                      defaultValue={editingReading?.unit_number || ""}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricePerUnit">Price per Unit (Ksh)</Label>
                    <Input
                      id="pricePerUnit"
                      name="pricePerUnit"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      defaultValue={editingReading?.price_per_unit || ""}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="previousReading">Previous Reading</Label>
                    <Input
                      id="previousReading"
                      name="previousReading"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      defaultValue={editingReading?.previous_reading || ""}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentReading">Current Reading</Label>
                    <Input
                      id="currentReading"
                      name="currentReading"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      defaultValue={editingReading?.current_reading || ""}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="readingDate">Reading Date</Label>
                    <Input
                      id="readingDate"
                      name="readingDate"
                      type="date"
                      defaultValue={editingReading?.reading_date?.slice(0, 10) || new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      defaultValue={editingReading?.due_date?.slice(0, 10) || ""}
                      required
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingReading ? "Update Reading" : "Add Reading"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment for Unit {selectedReading?.unit_number}
                {selectedReading && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Total Amount:</strong> Ksh {Number(selectedReading?.total_amount).toFixed(2)}
                      </p>
                      <p>
                        <strong>Paid Amount:</strong> Ksh {Number(selectedReading?.paid_amount).toFixed(2)}
                      </p>
                      <p>
                        <strong>Outstanding:</strong> Ksh 
                        {(Number(selectedReading?.total_amount) - Number(selectedReading?.paid_amount)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Payment Amount (Ksh )</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue={
                      selectedReading
                        ? (Number(selectedReading.total_amount) - Number(selectedReading.paid_amount)).toFixed(2)
                        : ""
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date</Label>
                  <Input
                    id="paymentDate"
                    name="paymentDate"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectValue />
                  <SelectContent className= "w-96">
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa">M-PESA</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="method" value={paymentMethod} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea id="notes" name="notes" placeholder="Add any notes about this payment..." rows={3} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Record Payment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Quick Status Update Dialog */}
        <Dialog open={isQuickUpdateDialogOpen} onOpenChange={setIsQuickUpdateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Update Payment Status</DialogTitle>
              <DialogDescription>
                Update payment status for Unit {quickUpdateReading?.unit_number}
                {quickUpdateReading && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Total Amount:</strong> Ksh {Number(quickUpdateReading?.total_amount).toFixed(2)}
                      </p>
                      <p>
                        <strong>Current Paid:</strong> Ksh {Number(quickUpdateReading?.paid_amount).toFixed(2)}
                      </p>
                      <p>
                        <strong>Outstanding:</strong> Ksh 
                        {(Number(quickUpdateReading?.total_amount) - Number(quickUpdateReading?.paid_amount)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleQuickUpdateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quickStatus">Payment Status</Label>
                <Select
                  value={quickUpdateData.status}
                  onValueChange={(value) => setQuickUpdateData({ ...quickUpdateData, status: value })}
                >
                    <SelectValue />
                  <SelectContent className="w-96">
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial Payment</SelectItem>
                    <SelectItem value="paid">Fully Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {quickUpdateData.status === "partial" && (
                <div className="space-y-2">
                  <Label htmlFor="partialAmount">Partial Amount Paid (Ksh )</Label>
                  <Input
                    id="partialAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={quickUpdateData.partialAmount}
                    onChange={(e) => setQuickUpdateData({ ...quickUpdateData, partialAmount: e.target.value })}
                    max={quickUpdateReading?.total_amount}
                    required
                  />
                  {quickUpdateData.partialAmount && quickUpdateReading && (
                    <p className="text-sm text-gray-600">
                      Remaining: Ksh 
                      {(Number(quickUpdateReading.total_amount) - Number.parseFloat(quickUpdateData.partialAmount || "0")).toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="quickPaymentDate">Payment Date</Label>
                <Input
                  id="quickPaymentDate"
                  type="date"
                  value={quickUpdateData.paymentDate}
                  onChange={(e) => setQuickUpdateData({ ...quickUpdateData, paymentDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quickNotes">Notes (Optional)</Label>
                <Textarea
                  id="quickNotes"
                  placeholder="Add any notes about this status update..."
                  value={quickUpdateData.notes}
                  onChange={(e) => setQuickUpdateData({ ...quickUpdateData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsQuickUpdateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Update Status
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Main Content as Unified Tabs */}
        <div className="space-y-8">
        <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full">
            <TabsList className="w-full flex mb-4">
              <TabsTrigger value="current" className="flex-1">Current Readings</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">Monthly History</TabsTrigger>
              <TabsTrigger value="payments" className="flex-1">Payment History</TabsTrigger>
            </TabsList>
            <TabsContent value="current">
              {/* --- Current Readings Card --- */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Water Meter Readings</CardTitle>
                  <CardDescription>All recorded water meter readings and billing information</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredReadings.length === 0 ? (
                    <div className="text-center py-12">
                      <Droplets className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {paymentFilter === "all" ? "No readings yet" : `No Ksh ${paymentFilter} readings`}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {paymentFilter === "all"
                          ? "Start by adding your first water meter reading"
                          : `No readings with ${paymentFilter} status found`}
                      </p>
                      {paymentFilter === "all" && (
                        <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 w-52 ">
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Reading
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Unit</TableHead>
                            <TableHead>Units Used</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Paid Amount</TableHead>
                            <TableHead>Outstanding</TableHead>
                            <TableHead>Payment Status</TableHead>
                            <TableHead>Reading Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredReadings
                            .sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime())
                            .map((reading) => (
                              <TableRow key={reading.id}>
                                <TableCell className="font-medium">{reading.unit_number}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{Number(reading.units_consumed).toFixed(2)}</Badge>
                                </TableCell>
                                <TableCell className="font-semibold">Ksh {Number(reading.total_amount).toFixed(2)}</TableCell>
                                <TableCell className="text-green-600">Ksh {Number(reading.paid_amount).toFixed(2)}</TableCell>
                                <TableCell className="text-red-600">
                                  Ksh {(Number(reading.total_amount) - Number(reading.paid_amount)).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getPaymentStatusIcon(reading.payment_status)}
                                    {getPaymentStatusBadge(reading.payment_status)}
                                  </div>
                                </TableCell>
                                <TableCell>{reading.reading_date?.slice(0, 10)}</TableCell>
                                <TableCell>{reading.due_date?.slice(0, 10)}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleQuickStatusUpdate(reading)}
                                      className="text-blue-600 hover:text-blue-700"
                                      title="Quick Status Update"
                                    >
                                      <Clock className="h-4 w-4" />
                                    </Button>
                                    {reading.payment_status !== "paid" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddPayment(reading)}
                                        className="text-green-600 hover:text-green-700"
                                        title="Record Payment"
                                      >
                                        <DollarSign className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(reading)}
                                      title="Edit Reading"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete(reading.id)}
                                      className="text-red-600 hover:text-red-700"
                                      title="Delete Reading"
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
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history">
              {/* --- Monthly History Card --- */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Monthly History
                  </CardTitle>
                  <CardDescription>View meter readings organized by month with monthly statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  {monthlyData.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No monthly data yet</h3>
                      <p className="text-gray-600 mb-4">Add some meter readings to see monthly history</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {monthlyData.map((monthData) => (
                        <Collapsible
                          key={monthData.key}
                          open={expandedMonths.has(monthData.key)}
                          onOpenChange={() => toggleMonth(monthData.key)}
                        >
                          <Card>
                            <CollapsibleTrigger asChild>
                              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {expandedMonths.has(monthData.key) ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                    <div>
                                      <CardTitle className="text-lg">{monthData.month}</CardTitle>
                                      <CardDescription>{monthData.readings.length} readings</CardDescription>
                                    </div>
                                  </div>
                                  <div className="flex gap-6 text-sm">
                                    <div className="text-center">
                                      <div className="font-semibold text-blue-600">
                                        Ksh {Number(monthData.totalRevenue).toFixed(2)}
                                      </div>
                                      <div className="text-gray-500">Revenue</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-semibold text-green-600">
                                        Ksh {Number(monthData.totalPaid).toFixed(2)}
                                      </div>
                                      <div className="text-gray-500">Paid</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-semibold text-red-600">
                                        Ksh {Number(monthData.totalOutstanding).toFixed(2)}
                                      </div>
                                      <div className="text-gray-500">Outstanding</div>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="pt-0">
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Unit</TableHead>
                                        <TableHead>Units Used</TableHead>
                                        <TableHead>Total Amount</TableHead>
                                        <TableHead>Paid Amount</TableHead>
                                        <TableHead>Outstanding</TableHead>
                                        <TableHead>Payment Status</TableHead>
                                        <TableHead>Reading Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {monthData.readings
                                        .sort(
                                          (a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime(),
                                        )
                                        .map((reading) => (
                                          <TableRow key={reading.id}>
                                            <TableCell className="font-medium">{reading.unit_number}</TableCell>
                                            <TableCell>
                                              <Badge variant="secondary">{Number(reading.units_consumed).toFixed(2)}</Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                              Ksh {Number(reading.total_amount).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-green-600">
                                              Ksh {Number(reading.paid_amount).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-red-600">
                                              Ksh {(Number(reading.total_amount) - Number(reading.paid_amount)).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                              <div className="flex items-center gap-2">
                                                {getPaymentStatusIcon(reading.payment_status)}
                                                {getPaymentStatusBadge(reading.payment_status)}
                                              </div>
                                            </TableCell>
                                            <TableCell>{reading.reading_date?.slice(0, 10)}</TableCell>
                                            <TableCell>
                                              <div className="flex gap-1">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => handleQuickStatusUpdate(reading)}
                                                  className="text-blue-600 hover:text-blue-700"
                                                  title="Quick Status Update"
                                                >
                                                  <Clock className="h-4 w-4" />
                                                </Button>
                                                {reading.payment_status !== "paid" && (
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAddPayment(reading)}
                                                    className="text-green-600 hover:text-green-700"
                                                    title="Record Payment"
                                                  >
                                                    <DollarSign className="h-4 w-4" />
                                                  </Button>
                                                )}
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(reading)}>
                                                  <Edit className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                       ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="payments">
              {/* --- Payment History Card --- */}
              {readings.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No payment history yet</h3>
                  <p className="text-gray-600 mb-4">Add some payments to see payment history</p>
                </div>
              ) : (
                readings.map((reading) => (
                  <Card key={reading.id} className="mb-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Unit {reading.unit_number}</CardTitle>
                          <CardDescription>
                            Reading Date: {reading.reading_date?.slice(0, 10)} | Total: Ksh {Number(reading.total_amount).toFixed(2)} | Paid: Ksh {Number(reading.paid_amount).toFixed(2)}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPaymentStatusIcon(reading.payment_status)}
                          {getPaymentStatusBadge(reading.payment_status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Payment Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Method</TableHead>
                              <TableHead>Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reading.payments.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-gray-500">
                                  No payments recorded
                                </TableCell>
                              </TableRow>
                            ) : (
                              reading.payments
                                .sort(
                                  (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
                                )
                                .map((payment) => (
                                  <TableRow key={payment.id}>
                                    <TableCell>{payment.payment_date?.slice(0, 10)}</TableCell>
                                    <TableCell className="font-semibold text-green-600">
                                      Ksh {Number(payment.amount).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="capitalize">
                                        {payment.payment_method?.replace("_", " ")}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{payment.notes || "-"}</TableCell>
                                  </TableRow>
                                ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
