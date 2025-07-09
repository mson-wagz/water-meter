import React, { useState, cloneElement, createContext, useContext } from "react"

const DialogContext = createContext()

export function Dialog({ open, onOpenChange, children }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : internalOpen

  const setOpen = (val) => {
    if (!isControlled) setInternalOpen(val)
    if (onOpenChange) onOpenChange(val)
  }

  return (
    <DialogContext.Provider value={{ open: dialogOpen, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({ asChild, children }) {
  const { setOpen } = useContext(DialogContext)
  if (asChild && React.isValidElement(children)) {
    return cloneElement(children, {
      onClick: (e) => {
        if (children.props.onClick) children.props.onClick(e)
        setOpen(true)
      },
    })
  }
  return (
    <button type="button" onClick={() => setOpen(true)}>
      {children}
    </button>
  )
}

export function DialogContent({ children, className = "" }) {
  const { open, setOpen } = useContext(DialogContext)
  if (!open) return null
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30`}>
      <div className={`bg-white rounded shadow-lg p-6 w-full max-w-lg ${className}`}>
        <button
          onClick={() => setOpen(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ children, className = "" }) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

export function DialogTitle({ children, className = "" }) {
  return <h2 className={`text-xl font-bold mb-1 ${className}`}>{children}</h2>
}

export function DialogDescription({ children, className = "" }) {
  return <p className={`text-gray-600 mb-2 ${className}`}>{children}</p>
}

export function DialogFooter({ children, className = "" }) {
  return <div className={`mt-4 flex justify-end gap-2 ${className}`}>{children}</div>
}