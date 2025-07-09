import React from "react"
export function Table({ children, ...props }) {
  return <table {...props} className={`min-w-full border ${props.className || ""}`}>{children}</table>
}
export function TableHead({ children, ...props }) {
  return <th {...props} className={`border px-2 py-1 bg-gray-100 ${props.className || ""}`}>{children}</th>
}
export function TableBody({ children, ...props }) {
  return <tbody {...props}>{children}</tbody>
}
export function TableRow({ children, ...props }) {
  return <tr {...props}>{children}</tr>
}
export function TableCell({ children, ...props }) {
  return <td {...props} className={`border px-2 py-1 ${props.className || ""}`}>{children}</td>
}
export function TableHeader({ children, ...props }) {
  return <thead {...props}>{children}</thead>
}