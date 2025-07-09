import React from "react"
export function Textarea(props) {
  return <textarea {...props} className={`border rounded px-2 py-1 ${props.className || ""}`} />
}