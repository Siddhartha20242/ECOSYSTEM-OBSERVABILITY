"use client"

import { useEffect, useRef } from "react"
import Chart from "chart.js/auto"

export default function NpmChart({ data }: { data: Record<string, any> }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!ref.current) return

    const entries = Object.entries(data)
      .filter(([, v]) => !v.error)
      .sort((a: any, b: any) => b[1].downloads - a[1].downloads)

    const labels = entries.map(([name]) => name)
    const values = entries.map(([, v]: any) => v.downloads)

    if (chartRef.current) chartRef.current.destroy()

    chartRef.current = new Chart(ref.current, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: [
            "#4493f8", "#3fb950", "#d29922",
            "#f85149", "#bc8cff", "#39d353",
          ],
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.raw as number
                return ` ${v.toLocaleString()} downloads`
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: "#21262d" },
            ticks: { color: "#7d8590" },
          },
          y: {
            type: "logarithmic",
            grid: { color: "#21262d" },
            ticks: {
              color: "#7d8590",
              callback: (v) => {
                const n = Number(v)
                if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + "M"
                if (n >= 1_000) return (n / 1_000).toFixed(0) + "K"
                return String(n)
              }
            }
          }
        }
      }
    })

    return () => { chartRef.current?.destroy() }
  }, [data])

  return <canvas ref={ref} height={280} />
}