"use client"

import { X } from "lucide-react"
import { Button } from "./button"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-creamy-yellow/85 backdrop-blur-lg border border-terracotta-rose/60 rounded-lg shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-terracotta-rose/30">
          <h2 className="text-vintage-2xl font-libre font-bold text-terracotta-rose-dark">
            {title}
          </h2>
          <Button
            onClick={onClose}
            size="sm"
            className="text-red-800 border-terracotta-rose-dark bg-gradient-to-r from-red-600/50 to-red-400/80 font-varela font-bold rounded-lg hover:shadow-red-600/30 hover:bg-terracotta-rose/10 hover:shadow-md transition-all duration-300 hover:scale-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
