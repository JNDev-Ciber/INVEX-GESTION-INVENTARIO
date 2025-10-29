"use client"

import type { ReactNode } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { useMediaQuery } from "../hooks/use-media-query"

interface Column {
  key: string
  label: string
  render?: (value: any, item: any) => ReactNode
}

interface ResponsiveTableProps {
  data: any[]
  columns: Column[]
  onRowClick?: (item: any) => void
}

export function ResponsiveTable({ data, columns, onRowClick }: ResponsiveTableProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <Card
            key={index}
            className={`${onRowClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
            onClick={() => onRowClick?.(item)}
          >
            <CardContent className="p-4">
              {columns.map((column) => (
                <div key={column.key} className="flex justify-between items-center py-1">
                  <span className="text-sm font-medium text-muted-foreground">{column.label}:</span>
                  <span className="text-sm">
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={index} className={onRowClick ? "cursor-pointer" : ""} onClick={() => onRowClick?.(item)}>
              {columns.map((column) => (
                <TableCell key={column.key}>
                  {column.render ? column.render(item[column.key], item) : item[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
