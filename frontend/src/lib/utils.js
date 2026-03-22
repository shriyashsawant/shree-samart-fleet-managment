import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export function formatDateTime(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getStatusColor(status) {
  const colors = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    UNDER_MAINTENANCE: 'bg-amber-100 text-amber-700 border-amber-200',
    LEFT: 'bg-red-100 text-red-700 border-red-200',
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
}

export function getDaysRemaining(date) {
  if (!date) return null
  const today = new Date()
  const target = new Date(date)
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24))
  return diff
}

export function openDocument(filePath) {
  if (!filePath) return
  if (filePath.startsWith('https://')) {
    window.open(filePath, '_blank')
  } else {
    let relativePath = filePath
    if (relativePath.startsWith('./uploads/')) {
      relativePath = relativePath.substring('./uploads/'.length)
    } else if (relativePath.startsWith('uploads/')) {
      relativePath = relativePath.substring('uploads/'.length)
    }
    window.open(`/api/files/${relativePath}`, '_blank')
  }
}
