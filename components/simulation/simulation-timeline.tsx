"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"

interface TimelineEvent {
  id: string
  day: number
  event: string
  description: string
  type: "disruption" | "recovery" | "milestone"
}

const timelineEvents: TimelineEvent[] = [
  {
    id: "1",
    day: 1,
    event: "Initial Disruption",
    description: "Port strike begins affecting Supplier A",
    type: "disruption",
  },
  {
    id: "2",
    day: 3,
    event: "Inventory Alert",
    description: "Warehouse B inventory drops below safety stock",
    type: "disruption",
  },
  {
    id: "3",
    day: 7,
    event: "Peak Disruption",
    description: "Maximum impact reached across supply chain",
    type: "disruption",
  },
  {
    id: "4",
    day: 10,
    event: "Alternative Sourcing",
    description: "Emergency sourcing from Supplier E activated",
    type: "recovery",
  },
  { id: "5", day: 14, event: "Strike Resolution", description: "Port operations begin to resume", type: "milestone" },
  { id: "6", day: 21, event: "50% Recovery", description: "Supply chain operating at 50% capacity", type: "recovery" },
  { id: "7", day: 28, event: "75% Recovery", description: "Most operations normalized", type: "recovery" },
  { id: "8", day: 35, event: "Full Recovery", description: "Supply chain fully operational", type: "milestone" },
]

export function SimulationTimeline() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight
    const margin = { top: 50, right: 50, bottom: 50, left: 50 }

    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Create scales
    const xScale = d3
      .scaleLinear()
      .domain([0, 40]) // 0 to 40 days
      .range([0, innerWidth])

    const yScale = d3.scalePoint().domain(["disruption", "recovery", "milestone"]).range([innerHeight, 0]).padding(0.5)

    // Create the main group
    const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`)

    // Add x-axis
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(8)
          .tickFormat((d) => `Day ${d}`),
      )

    // Add horizontal line
    g.append("line")
      .attr("x1", 0)
      .attr("y1", innerHeight / 2)
      .attr("x2", innerWidth)
      .attr("y2", innerHeight / 2)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")

    // Add events
    const eventGroups = g
      .selectAll(".event")
      .data(timelineEvents)
      .enter()
      .append("g")
      .attr("class", "event")
      .attr("transform", (d) => `translate(${xScale(d.day)}, ${yScale(d.type)})`)

    // Add event circles
    eventGroups
      .append("circle")
      .attr("r", 8)
      .attr("fill", (d) => {
        if (d.type === "disruption") return "#ef4444"
        if (d.type === "recovery") return "#10b981"
        return "#3b82f6"
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 10)

        tooltip
          .style("opacity", 1)
          .html(`
            <div class="font-medium">${d.event}</div>
            <div class="text-sm">Day ${d.day}: ${d.description}</div>
          `)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`)
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 8)
        tooltip.style("opacity", 0)
      })

    // Add event labels
    eventGroups
      .append("text")
      .attr("x", 0)
      .attr("y", (d) => (d.type === "disruption" ? -15 : 20))
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text((d) => d.event)

    // Add tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "absolute bg-background p-2 rounded shadow-md border text-sm z-50 pointer-events-none")
      .style("opacity", 0)
      .style("position", "absolute")

    return () => {
      tooltip.remove()
    }
  }, [])

  return <svg ref={svgRef} className="w-full h-full" />
}
