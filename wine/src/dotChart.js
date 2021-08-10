var margin = { top: 60, right: 10, bottom: 30, left: 200 },
    width = 1160 - margin.left - margin.right,
    height = 1700 - margin.top - margin.bottom;

const dotRadius = 4.5;
let dotOrder = d3.ascending;

// set initial button color
d3.select('#asc').classed('on', true);
// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

const g = svg.append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Parse the Data
d3.csv("data/dot_data.csv", function (data) {

    // filter out null values on col selection
    const keys = data.columns.slice(1);


    const color = d3.scaleOrdinal()
        .domain(keys)
        .range(['orange', 'pink', 'skyblue', 'tan', 'grey', 'teal']);

    // Add X axis
    const x = d3.scaleLinear()
        .domain([-0.1, 2.75])
        .range([0, width]);

    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisTop(x)
            .tickSize(height)
            .ticks(15))
        .call(g => g.select('.domain')
            .remove())
        .call(g => g.selectAll('.tick line')
            .attr('opacity', line => line < 0 ? 0 : 0.05))
        .call(g => g.selectAll('.tick text')
            .attr('opacity', text => text < 0 ? 0 : 1))

    // Y axis
    const y = d3.scaleBand()
        .range([0, height])
        .domain(data.map(d => d.variety))
        .padding(0.5);
    // g.append("g")
    //   .call(d3.axisLeft(y))

    // Lines
    g.selectAll("myline")
        .data(data) // need to filter out values == 0 here
        .enter()
        .append("line")
        .attr('class', 'horzline')
        .attr("x1", d => {
            let valArr = keys.map(k => + d[k]).filter(v => v > 0)
            return x(d3.min(valArr))
        })
        .attr("x2", d => x(d3.max(keys, k => +d[k])))
        .attr("y1", d => y(d.variety))
        .attr("y2", d => y(d.variety))
        .attr("stroke", "grey")
        .attr("stroke-width", "1px")

    // Create dots
    keys.map(key => {
        g.selectAll("mycircle")
            .data(data)
            .enter()
            .append("circle")
            .attr('class', 'dot')
            .attr("cx", d => x(d[key]))
            .attr("cy", d => y(d.variety))
            // .attr('stroke', 'black')
            .attr("r", dotRadius)
            .style('opacity', d => d[key] == 0 ? 0 : .75)
            .style("fill", color(key))
    })

    // add text
    g.selectAll('g.text')
        .data(data)
        .enter()
        .append('g').append("text").attr('class', 'text')
        .attr("dy", "0.35em")
        .style('font-size', '.9rem')
        .attr('x', d => {
            let valArr = keys.map(k => +d[k]).filter(v => v > 0)
            return x(d3.min(valArr)) - Math.max(d.variety.length * 8.5, 40)

        })
        .attr('y', d => y(d.variety))
        .text((d, i) => d.variety);

    d3.selectAll('circle.dot')
        .on('mouseover', function (d) {
            d3.select(this)
                // .style('stroke', 'black')
                .style('opacity', .4)
            console.log(d)

        })
        .on('mouseout', function (d) {
            d3.select(this)
                // .style('stroke', 'none')
                .style('opacity', 0.75)
        })





    let updateChart = () => {
        let value = d3.select('#form').property('value');
        let sortedWines;
        let wines = data.map(d => d.variety);
        if (value === 'Wine Variety') {
            sortedWines = wines.sort(dotOrder);
        } else if (value === 'Price') {
            let wineAgg = d3.nest()
                .key(d => d.variety)
                .rollup(v => d3.max(keys, k => +v[0][k]))
                .entries(data)
                .map(group => {
                    return {
                        variety: group.key,
                        value: group.value
                    }
                });
            sortedWines = wineAgg.slice().sort((a, b) => dotOrder(a.value, b.value));
            sortedWines = sortedWines.map(d => d.variety);
        } else {
            let wineAgg = d3.nest()
                .key(d => d.variety)
                .rollup(v => d3.max(v, d => d[value]))
                .entries(data)
                .map(group => {
                    return {
                        variety: group.key,
                        value: group.value
                    }
                });
            sortedWines = wineAgg.slice().sort((a, b) => dotOrder(a.value, b.value));
            sortedWines = sortedWines.map(d => d.variety);
        }

        // update axis
        y.domain(sortedWines);

        // move circles
        d3.selectAll('.dot')
            .transition()
            .attr('r', 0)
            .transition()
            .delay((d, i) => (wines.length % i) * 2)
            .duration(500)
            .attr("cy", d => y(d.variety))
            .transition()
            .delay(250)
            .attr('r', dotRadius)


        // move text
        d3.selectAll('text.text')
            .transition()
            .delay((d, i) => i * 5)
            .duration(1000)
            .attr('y', d => y(d.variety))

        // move lines
        d3.selectAll('.horzline')
            .transition()
            .delay((d, i) => i * 5)
            .duration(1000)
            .attr("y1", d => y(d.variety))
            .attr("y2", d => y(d.variety))
    }

    d3.select('#desc')
        .on('click', function (d) {
            let prevDotOrder = dotOrder;
            if (prevDotOrder === d3.descending) return;
            // update colors
            d3.select(this).classed('on', true).classed('off', false)
            d3.select('#asc').classed('off', true).classed('on', false)
            // change order
            dotOrder = d3.descending;
            // update chart
            updateChart();
        })

    d3.select('#asc')
        .on('click', function (d) {
            let prevDotOrder = dotOrder;
            if (prevDotOrder === d3.ascending) return;
            // update colors
            d3.select(this).classed('on', true).classed('off', false)
            d3.select('#desc').classed('off', true).classed('on', false)
            // change order
            dotOrder = d3.ascending;
            // update chart
            updateChart();
        })



    d3.select('#form')
        .on('change', d => updateChart())
    // .on('click', d => updateChart())


    const legendData = ['Chile', 'France', 'Italy', 'Portugal', 'Spain', 'US'];

    const nodeWidth = (d) => d.getBBox().width;

    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate(0,0)');

    const lg = legend.selectAll('g')
        .data(legendData)
        .enter()
        .append('g');

    lg.append('circle')
        .attr('r', dotRadius)
        .attr('fill', d => color(d))
        // .attr('stroke', 'black')
        .attr('cy', 5)
        .attr('cx', 10)

    lg.append('text')
        .style('font-size', '13px')
        .attr('x', 16.5)
        .attr('y', 10)
        .text(d => d);

    // offset each legend
    let offset = 0;
    lg.attr('transform', function (d) {
        let xOffset = offset;
        offset += nodeWidth(this) + 10;
        return `translate(${xOffset + margin.left}, ${margin.top / 2.5})`;
    });

    // center overall legend
    legend.attr('transform', function () {
        return `translate(${(width - nodeWidth(this)) / 2}, 0)`
    });



})


