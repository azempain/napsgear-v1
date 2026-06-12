'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="ngc-sheet-overlay" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn('ngc-sheet-content', className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="ngc-sheet-close" aria-label="Close navigation">
        <X size={22} aria-hidden="true" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
SheetContent.displayName = DialogPrimitive.Content.displayName

export const SheetTitle = DialogPrimitive.Title
export const SheetDescription = DialogPrimitive.Description
