class FranceMap {
    constructor(opts) {
        // load in arguments from config object
        this.data = opts.data;
        this.element = opts.element;
        this.metric = opts.metric;

        // Define the div for the tooltip
        this.tooltip = d3.select(this.element)
            .append('div')
            .attr('id', 'france-tooltip')
            .attr('class', 'tooltip')
            .style("opacity", 1)
            .style("pointer-events", "none")
            .style('font-size', '1rem')
            .style('text-align', 'left')
            .style('font-weight', 'bold')
            .style('max-width', '180px')

        this.draw();
    }

    draw() {
        this.id = this.element.substring(1, this.element.length)
        this.margin = { top: 0, right: 20, bottom: 20, left: 20 };
        this.width = 700 - this.margin.left - this.margin.right;
        this.height = 700 - this.margin.top - this.margin.bottom;
        this.svg = d3.select(this.element).append('svg')
        this.svg.attr("preserveAspectRatio", "xMinYMin meet")
        this.svg.attr("viewBox", `0 0 ${(this.width + this.margin.left + this.margin.right)}
       ${(this.height + this.margin.top + this.margin.bottom)}`)

        this.projection = d3.geoAlbers()
            .center([-7, 51.5])
            .rotate([-2.8, 3])
            .parallels([45, 55])
            .scale(3000)
            .translate([100, this.height / 4]);

        this.path = d3.geoPath().projection(this.projection);

        d3.json(this.data, data => {
            this.data = data;
            this.drawMap(this.data);
            this.drawDots(this.metric);
        })
    }

    drawMap(map) {
        const that = this;
        this.svg.append("g")
            .attr("class", "region")
            .selectAll("path")
            .data(topojson.object(map, map.objects.regions).geometries)
            .enter().append("path")
            .attr("d", that.path)
            .style('stroke', 'black')
            .style('stroke-width', .5)
            .style('fill', '#fdd9b5')
            .style("opacity", 0.48)
    };

    drawDots(metric) {
        const that = this;
        d3.csv(metric, data => {
            let metricScale = d3.scaleLinear()
                .domain(d3.extent(data, d => +d.metric))
                .range([3, 30]);

            this.metricDots = this.svg.selectAll("g.france")
                .data(data, d => d.location);

            this.metricDots
                .exit()
                .selectAll('circle')
                .transition()
                .duration(1500)
                .attr('r', 0)
                .remove();

            let metricDotsEnter = this.metricDots
                .enter()
                .append("g")
                .attr("class", "france");

            this.metricDots = this.metricDots.merge(metricDotsEnter);

            this.metricDots
                .attr("transform", d => `translate(${that.projection([d.lon, d.lat])})`)
                .append("circle")
                .transition()
                .duration(1500)
                .attr("r", d => metricScale(+d.metric))
                .style("fill", "brown")
                .style('stroke', 'brown')
                .style('stroke-width', 2)
                .attr("fill-opacity", 0.15);

            this.metricDots
                .on("mouseover", function (d) {
                    d3.select(this).select('circle').style('fill', 'blue')
                    let curData = d;
                    d3.selectAll('g.france').selectAll('circle')
                        .style('opacity', .2)
                    d3.select(this).select('circle')
                        .style('opacity', 1)
                        .style('stroke', 'black')
                    that.tooltip
                        .transition()
                        .style("opacity", .9);
                    that.tooltip.html(d => `Winery: ${curData.location}<br>Value: ${curData.metric}`)
                        .style("left", (d3.event.pageX + 10) + "px")
                        .style("top", (d3.event.pageY - 32) + "px");
                })
                .on("mouseout", function (d) {
                    d3.selectAll('g.france').selectAll('circle')
                        .style('opacity', 1)
                        .style('stroke', 'brown')
                        .style('fill', 'brown')
                    that.tooltip.transition()
                        .style("opacity", 0);
                })
        });

    }
}

