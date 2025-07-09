import React, { useState, createContext, useContext } from "react"

// Create context
const TabsContext = createContext()

export function Tabs({ defaultValue, value: controlledValue, onValueChange, children, className }) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const value = controlledValue ?? internalValue
  const setValue = onValueChange ?? setInternalValue

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className }) {
  return <div className={`flex gap-2 mb-2 ${className || ""}`}>{children}</div>
}

export function TabsTrigger({ value: tabValue, children, className }) {
  const { value, setValue } = useContext(TabsContext)
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

export function TabsContent({ value: tabValue, children, className }) {
  const { value } = useContext(TabsContext)
  if (value !== tabValue) return null
  return <div className={className}>{children}</div>
}
