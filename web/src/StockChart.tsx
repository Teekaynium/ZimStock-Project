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

		const margin = { top: 20, right: 150, bottom: 50, left: 80 };
		const width = 1200 - margin.left - margin.right;
		const height = 600 - margin.top - margin.bottom;

		const svg = d3
			.select(svgRef)
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		svg
			.append("defs")
			.append("clipPath")
			.attr("id", "clip")
			.append("rect")
			.attr("width", width)
			.attr("height", height);

		// Parse dates
		const dates = props.data.index.map((d) => new Date(d));

		// Filter out null values and create min/max for y scale
		const allValues = props.data.data.flatMap((row) =>
			row.filter((val) => val !== null && val > 0),
		);
		const minValue = d3.min(allValues) || 1;
		const maxValue = d3.max(allValues) || 100;

		// Create scales
		const x = d3
			.scaleTime()
			.range([0, width])
			.domain(d3.extent(dates) as [Date, Date]);

		const y = d3
			.scaleLog()
			.range([height, 0])
			.domain([minValue * 0.9, maxValue * 1.1])
			.nice();

		// Create axes
		const xAxis = d3.axisBottom(x);
		const yAxis = d3
			.axisLeft(y)
			.tickFormat((d) => d3.format(".0f")(d))
			.tickValues(
				d3
					.ticks(Math.log10(minValue), Math.log10(maxValue), 20)
					.map((x) => 10 ** x),
			);

		// Add axes
		const gX = svg
			.append("g")
			.attr("class", "x-axis")
			.attr("transform", `translate(0,${height})`)
			.call(xAxis);

		const gY = svg.append("g").attr("class", "y-axis").call(yAxis);

		// Add Y axis label
		svg
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 0 - margin.left)
			.attr("x", 0 - height / 2)
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("Price (log scale)");

		// Create tooltip
		const tooltip = d3
			.select("body")
			.append("div")
			.attr(
				"class",
				"fixed hidden bg-black/75 text-white px-2 py-1 rounded text-sm pointer-events-none",
			);

		// Create line generator
		const line = d3
			.line<[Date, number]>()
			.defined((d): d is [Date, number] => d[1] !== null && d[1] > 0)
			.x((d) => x(d[0]))
			.y((d) => y(d[1]));

		// Create chart content group
		const chartContent = svg.append("g").attr("clip-path", "url(#clip)");

		// Add background rect to capture interactions
		chartContent
			.append("rect")
			.attr("class", "zoom-capture")
			.attr("width", width)
			.attr("height", height)
			.attr("fill", "none")
			.attr("pointer-events", "all");

		// Generate colors for each company
		const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

		// Add lines for each company
		props.data.columns.forEach((company, columnIndex) => {
			const companyData = props.data.data.map(
				(row, i) => [dates[i], row[columnIndex]] as [Date, number],
			);

			if (companyData.some((d) => d[1] !== null && d[1] > 0)) {
				const path = chartContent
					.append("path")
					.datum(companyData)
					.attr("fill", "none")
					.attr("stroke", colorScale(company))
					.attr("stroke-width", 1.5)
					.attr("d", line)
					.attr("class", "transition-opacity duration-200 hover:opacity-100")
					.style("opacity", 0.7);

				// Add hover effects and tooltip
				path
					.on("mouseover", (event) => {
						tooltip
							.classed("hidden", false)
							.html(
								`${company}<br/>Click and drag to pan horizontally<br/>Hold Ctrl/Cmd + scroll to zoom`,
							);

						path.style("opacity", 1).attr("stroke-width", 2.5);
					})
					.on("mousemove", (event) => {
						tooltip
							.style("left", `${event.pageX + 10}px`)
							.style("top", `${event.pageY - 10}px`);
					})
					.on("mouseout", () => {
						tooltip.classed("hidden", true);
						path.style("opacity", 0.7).attr("stroke-width", 1.5);
					});
			}
		});

		// Add legend
		const legend = svg
			.append("g")
			.attr("font-family", "sans-serif")
			.attr("font-size", 10)
			.attr("text-anchor", "start")
			.selectAll("g")
			.data(
				props.data.columns.filter((_, i) =>
					props.data.data.some((row) => row[i] !== null && row[i] > 0),
				),
			)
			.enter()
			.append("g")
			.attr("transform", (_, i) => `translate(${width + 10},${i * 20})`)
			.attr("class", "cursor-pointer");

		legend
			.append("rect")
			.attr("x", 0)
			.attr("width", 19)
			.attr("height", 19)
			.attr("fill", (d) => colorScale(d));

		legend
			.append("text")
			.attr("x", 24)
			.attr("y", 9.5)
			.attr("dy", "0.32em")
			.text((d) => d);

		// Add zoom behavior
		const zoom = d3
			.zoom<SVGSVGElement, unknown>()
			.scaleExtent([1, 20])
			.extent([
				[0, 0],
				[width, height],
			])
			.translateExtent([
				[0, Number.NEGATIVE_INFINITY],
				[width, Number.POSITIVE_INFINITY],
			])
			.filter((event) => {
				// Only allow zooming with Ctrl/Cmd + wheel
				// and panning with mouse drag
				return event.ctrlKey || event.metaKey || event.type === "mousedown";
			})
      .on("zoom", (event) => {
        // Update both x and y scales
        const newX = event.transform.rescaleX(x);
        const newY = event.transform.rescaleY(y);
        
        // Update axes
        gX.call(xAxis.scale(newX));
        gY.call(yAxis.scale(newY));
        
        // Update all paths
        chartContent.selectAll("path")
          .attr("d", (d: [Date, number][]) => {
            const newLine = d3.line<[Date, number]>()
              .defined((d): d is [Date, number] => d[1] !== null && d[1] > 0)
              .x(d => newX(d[0]))
              .y(d => newY(d[1]));
            return newLine(d);
          });
      });

		// Add zoom behavior to svg and set cursor styles
		d3.select(svgRef)
			.style("cursor", "grab")
			.call(zoom)
			.on("mousedown.cursor", () => {
				d3.select(svgRef).style("cursor", "grabbing");
			})
			.on("mouseup.cursor", () => {
				d3.select(svgRef).style("cursor", "grab");
			});

		// Add legend interactivity
		legend
			.on("mouseover", (event, company) => {
				const opacity = 0.1;
				chartContent
					.selectAll("path")
					.style("opacity", (d) => (d[0] === company ? 1 : opacity));
			})
			.on("mouseout", () => {
				chartContent.selectAll("path").style("opacity", 0.7);
			});
	});

	return (
		<div class="w-full p-10 overflow-x-auto">
			<svg ref={svgRef} />
		</div>
	);
};
