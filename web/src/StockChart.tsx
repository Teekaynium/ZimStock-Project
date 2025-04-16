import { type Component, onMount } from "solid-js";
import * as d3 from "d3";
import type { StockData } from "./types";

interface StockChartProps {
  data: StockData;
}

export const StockChart: Component<StockChartProps> = (props) => {
  let svgRef: SVGSVGElement | undefined;

  onMount(() => {
    if (!svgRef || !props.data) return;

    // Clear any existing content
    d3.select(svgRef).selectAll("*").remove();

    // Setup dimensions
    const margin = { top: 20, right: 150, bottom: 50, left: 60 };
    const width = 1200 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(svgRef)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse dates
    const dates = props.data.index.map(d => new Date(d));

    // Create scales
    const x = d3
      .scaleTime()
      .range([0, width])
      .domain(d3.extent(dates) as [Date, Date]);

    const y = d3
      .scaleLinear()
      .range([height, 0])
      .domain([
        0,
        d3.max(props.data.data, row => d3.max(row) || 0) || 0
      ]);

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end");

    // Add Y axis
    svg
      .append("g")
      .call(d3.axisLeft(y));

    // Create line generator
    const line = d3
      .line<[Date, number]>()
      .x(d => x(d[0]))
      .y(d => y(d[1]));

    // Generate random colors for each company
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Add lines for each company
    props.data.columns.forEach((company, columnIndex) => {
      const companyData = props.data.data.map((row, i) => [
        dates[i],
        row[columnIndex]
      ] as [Date, number]);

      svg
        .append("path")
        .datum(companyData)
        .attr("fill", "none")
        .attr("stroke", colorScale(company))
        .attr("stroke-width", 1.5)
        .attr("d", line);
    });

    // Add legend
    const legend = svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .selectAll("g")
      .data(props.data.columns)
      .enter()
      .append("g")
      .attr("transform", (d, i) => `translate(${width + 10},${i * 20})`);

    legend
      .append("rect")
      .attr("x", 0)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", d => colorScale(d));

    legend
      .append("text")
      .attr("x", 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(d => d);
  });

  return (
    <div class="w-full p-10 overflow-x-auto">
      <svg ref={svgRef} />
    </div>
  );
};