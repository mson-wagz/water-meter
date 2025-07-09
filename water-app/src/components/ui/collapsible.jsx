import React, { useState, createContext, useContext } from "react"

const CollapsibleContext = createContext()

export function Collapsible({ open, onOpenChange, children }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const setOpen = (val) => {
    if (!isControlled) setInternalOpen(val)
    if (onOpenChange) onOpenChange(val)
  }

  return (
    <CollapsibleContext.Provider value={{ open: isOpen, setOpen }}>
      {children}
    </CollapsibleContext.Provider>
  )
}

export function CollapsibleTrigger({ asChild, children }) {
  const { open, setOpen } = useContext(CollapsibleContext)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        if (children.props.onClick) children.props.onClick(e)
        setOpen(!open)
      },
    })
  }
  return (
    <button type="button" onClick={() => setOpen(!open)}>
      {children}
    </button>
  )
}

export function CollapsibleContent({ children, className = "" }) {
  const { open } = useContext(CollapsibleContext)
  if (!open) return null
  return <div className={className}>{children}</div>
}