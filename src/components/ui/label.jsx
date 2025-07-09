import React from "react"
export function Label({ children, ...props }) {
  return (
    <label {...props} className={`block mb-1 font-medium ${props.className || ""}`}>
      {children}
    </label>
  )
}