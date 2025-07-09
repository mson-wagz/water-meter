import React from "react"
export function Badge({ children, variant = "default", ...props }) {
  const colors = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-yellow-100 text-yellow-800",
    destructive: "bg-red-100 text-red-800",
    outline: "border border-gray-400 text-gray-700",
  }
  return (
    <span {...props} className={`inline-block px-2 py-0.5 rounded text-xs ${colors[variant] || ""} ${props.className || ""}`}>
      {children}
    </span>
  )
}