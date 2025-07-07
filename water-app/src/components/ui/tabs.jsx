import React, { useState } from "react"
export function Tabs({ defaultValue, value: controlledValue, onValueChange, children, className }) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const value = controlledValue ?? internalValue
  const setValue = onValueChange ?? setInternalValue

  return (
    <div className={className}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { value, setValue })
          : child
      )}
    </div>
  )
}

export function TabsList({ children, value, setValue, className }) {
  return (
    <div className={`flex gap-2 mb-2 ${className || ""}`}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { value, setValue })
          : child
      )}
    </div>
  )
}
export function TabsTrigger({ value: tabValue, children, value, setValue, className }) {
  const active = value === tabValue
  return (
    <button
      className={`px-4 py-2 rounded ${active ? "bg-blue-600 text-white" : "bg-gray-100"} ${className || ""}`}
      onClick={() => setValue(tabValue)}
      type="button"
    >
      {children}
    </button>
  )
}
export function TabsContent({ value: tabValue, value, children, className }) {
  if (value !== tabValue) return null
  return <div className={className}>{children}</div>
}