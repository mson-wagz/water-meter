import React from "react"
export function Card({ children, ...props }) {
  return <div {...props} className={`bg-white rounded shadow p-4 ${props.className || ""}`}>{children}</div>
}
export function CardHeader({ children, ...props }) {
  return <div {...props} className={`mb-2 ${props.className || ""}`}>{children}</div>
}
export function CardTitle({ children, ...props }) {
  return <h2 {...props} className={`font-bold text-lg ${props.className || ""}`}>{children}</h2>
}
export function CardDescription({ children, ...props }) {
  return <p {...props} className={`text-gray-500 text-sm ${props.className || ""}`}>{children}</p>
}
export function CardContent({ children, ...props }) {
  return <div {...props} className={props.className || ""}>{children}</div>
}