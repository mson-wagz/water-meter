import React, { useState } from "react"

export function Select({ value, onValueChange, children, className = "", ...props }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(value)

  // Update selected if parent changes value
  React.useEffect(() => {
    setSelected(value)
  }, [value])

  // Find the label for the selected value
  let selectedLabel = null
  React.Children.forEach(children, child => {
    if (child && child.type === SelectContent) {
      React.Children.forEach(child.props.children, item => {
        if (item && item.props.value === selected) selectedLabel = item.props.children
      })
    }
  })

  return (
    <div className={`relative ${className}`} {...props}>
      <SelectTrigger onClick={() => setOpen(o => !o)}>
        <SelectValue>{selectedLabel || "Select..."}</SelectValue>
      </SelectTrigger>
      {open && (
        <SelectContent>
          {React.Children.map(children, child =>
            child && child.type === SelectContent
              ? React.cloneElement(child, {
                  onSelect: val => {
                    setSelected(val)
                    setOpen(false)
                    onValueChange && onValueChange(val)
                  },
                })
              : child
          )}
        </SelectContent>
      )}
    </div>
  )
}

export function SelectTrigger({ children, ...props }) {
  return (
    <div
      {...props}
      className={`border rounded px-2 py-1 cursor-pointer bg-white ${props.className || ""}`}
      tabIndex={0}
    >
      {children}
    </div>
  )
}

export function SelectValue(props) {
  return <span {...props}>{props.children}</span>
}

export function SelectContent({ children, onSelect, ...props }) {
  return (
    <div {...props} className={`absolute bg-white border rounded shadow mt-1 z-10 ${props.className || ""}`}>
      {React.Children.map(children, child =>
        child && child.type === SelectItem
          ? React.cloneElement(child, { onSelect })
          : child
      )}
    </div>
  )
}

export function SelectItem({ value, children, onSelect, ...props }) {
  return (
    <div
      {...props}
      className={`px-2 py-1 hover:bg-blue-100 cursor-pointer ${props.className || ""}`}
      onClick={() => onSelect && onSelect(value)}
      tabIndex={0}
      role="option"
      aria-selected="false"
    >
      {children}
    </div>
  )
}