import React, { Component } from "react";
import * as d3 from "d3";

class InteractiveStreamGraph extends Component {
    componentDidUpdate(){
    const chartData = this.props.csvData;
    console.log("Rendering chart with data:", chartData);
    // Don't render if data is empty
    if (!chartData || chartData.length === 0) {
        return;
    }
    
    // Define the LLM model names to visualize
    const llmModels = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"];

    // Write the D3.js code to create the interactive streamgraph visualization here
    const maxSum = d3.sum(
      llmModels.map(model => d3.max(chartData, d => +d[model]))
    );
    const colors = { "GPT-4": "#e41a1c", "Gemini": "#377eb8", "PaLM-2": "#4daf4a", "Claude": "#984ea3", "LLaMA-3.1": "#ff7f00" };
    
    // scales
    var xScale = d3.scaleTime().domain(d3.extent(chartData, d => d.Date)).range([0, 300]);
    var yScale = d3.scaleLinear().domain([0, maxSum]).range([400, 0]);
    const colorScale = d3.scaleOrdinal().domain(llmModels).range(llmModels.map(model => colors[model]));
    
    // generators (x-axis and area)
    var stack = d3.stack().keys(llmModels).offset(d3.stackOffsetWiggle);
    var stackedSeries = stack(chartData);
    var areaGenerator = d3.area().x(d => xScale(d.data.Date)).y0(d => yScale(d[0])).y1(d => yScale(d[1])).curve(d3.curveCardinal);
    
    var xAxisGenerator = d3.axisBottom(xScale).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b"));
   
    // applying for streamgraph
    d3.select(".streamgraph_container")
      .selectAll("path")
      .data(stackedSeries)
      .join("path").style("fill", d => colorScale(d.key)).attr("d", d => areaGenerator(d));
    d3.select(".x_axis").attr("transform", "translate(0, 460)").call(xAxisGenerator);

    // building legend
    var size = 20
    d3.select(".legend_container")
      .selectAll("legend_colors")
      .data(llmModels)
      .enter()
      .append("rect")
      .attr("x", 350)
      .attr("y", (d,i) => 350 - (i*30))
      .attr("width", size)
      .attr("height", size)
      .style("fill", d => colorScale(d))

    // Add one dot in the legend for each name.
    d3.select(".legend_container")
      .selectAll("legend_labels")
      .data(llmModels)
      .enter()
      .append("text")
      .attr("x", 375)
      .attr("y", (d,i) => 365 - (i*30))
      .text(d => d)

    // bar chart tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("color", "black")
      .style("background-color", "white")
      .style("padding", "6px") 
      .style("border-radius", "4px")
      .style("display", "none");

    d3.selectAll("path").on("mouseover mousemove", (event, d) => {
      d3.select(".streamgraph_container").selectAll("path").on("mouseover mousemove", (event, series) => {
        tooltip.style("display", "block").style("left", (event.pageX + 20) + "px").style("top", (event.pageY - 20) + "px");
        tooltip.html("");

        const monthFormat = d3.timeFormat("%b");
        const barChartSvg = tooltip.append("svg").attr("width", 300).attr("height", 160);
        const barXScale = d3.scaleBand().domain(chartData.map(d => monthFormat(d.Date))).range([20, 280]).padding(0.15);
        const barYScale = d3.scaleLinear().domain([0, d3.max(chartData, d => +d[series.key]) || 0]).nice().range([140, 20]);

        barChartSvg.append("g").attr("transform", "translate(0, 140)").call(d3.axisBottom(barXScale));
        barChartSvg.append("g").attr("transform", "translate(20, 0)").call(d3.axisLeft(barYScale).ticks(5));
        
        barChartSvg.selectAll(".bar")
          .data(chartData)
          .join("rect")
          .attr("class", "bar")
          .attr("x", d => barXScale(monthFormat(d.Date)))
          .attr("y", d => barYScale(d[series.key]))
          .attr("width", barXScale.bandwidth())
          .attr("height", d => 140 - barYScale(d[series.key]))
          .attr("fill", colors[series.key]);
  
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      });
    })
  }

  render() {
    return (
      <svg style={{ width: 600, height: 500 }} className="svg_parent">
        <g className="streamgraph_container"></g>
        <g className="x_axis"></g>
        <g className="legend_container"></g>
      </svg>
    );
  }
}

export default InteractiveStreamGraph;
