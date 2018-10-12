const dotDataPre = [6, 25, 17, 30, 45, 23, 46, 2, 15];  
const dotData = dotDataPre.map(d => (Math.random() * d) + d/2);
const dotDataBelow = dotData.map((d) => d * (1 / 2) + (Math.random() * 3));
const dotDataAbove = dotData.map((d) => d * 1.5 + (Math.random() * 2.5));

const margin = {top: 0, right: 2, bottom: 5, left: 2};
let parentDiv = document.getElementById("vis");
const width = parentDiv.clientWidth;
const height = parentDiv.clientHeight;
 
const svg = d3.select('#vis').append('svg')
  .attr('width', width + margin.right + margin.left)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// define scales
const xScale = d3.scaleLinear().domain([0,9]).range([15, width]);
const yScale = d3.scaleLinear().domain([0, 100]).range([height - 20, 8]);

// Add circles
svg.selectAll('circle.dots')
    .data(dotDataBelow)
    .enter()
    .append('circle')
    .attr('class', 'dots')
    .attr('r', 0)
    .attr('cx', (d,i) => xScale(i))
    .attr('cy', d => yScale(d))
    .style('fill', 'coral')
    .style('opacity', .8)

svg.selectAll('circle.dots2')
    .data(dotDataAbove)
    .enter()
    .append('circle')
    .attr('class', 'dots2')
    .attr('r', 0)
    .attr('cx', (d,i) => xScale(i))
    .attr('cy', d => yScale(d))
    .style('fill', '#67c7d3')
		.style('opacity', .6)

d3.selectAll('circle')
	.transition()
	.delay(500)
	.attr('r', 9)
	.transition()
	.attr('r', 5)

// add lines
const dotLine = d3.line()
    .x((d,i) => xScale(i))
    .y(d => yScale(d))
    .curve(d3.curveBasis);


const path = svg.append('path')
    .attr('d', dotLine(dotData))
    .attr('fill', 'none')
    .attr('stroke', '#dbb64b')
    .attr('stroke-width', 4)
		.style('opacity', .6);

const totalLength = path.node().getTotalLength();

path.attr("stroke-dasharray", totalLength + " " + totalLength)
    .attr("stroke-dashoffset", totalLength)
      .transition()
			.delay(1000)
      .duration(4500)
      .attr("stroke-dashoffset", 0);
