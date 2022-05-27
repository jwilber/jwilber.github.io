class USMap {
    constructor(opts) {
        // load in arguments from config object
        this.data = opts.data;
        this.element = opts.element;
        this.metric = opts.metric;
        // this.table = opts.table;
        this.draw();
    }

    draw() {
        this.id = this.element.substring(1, this.element.length)
        this.margin = { top: 0, right: 20, bottom: 20, left: 20 };
        this.width = 700 - this.margin.left - this.margin.right;
        this.height = 700 - this.margin.top - this.margin.bottom;
        this.svg = d3.select(this.element).append('svg')
            .style('background-color', 'white');
        this.svg.attr("preserveAspectRatio", "xMinYMin meet")
        this.svg.attr("viewBox", `0 0 ${(this.width + this.margin.left + this.margin.right)}
       ${(this.height + this.margin.top + this.margin.bottom)}`)

        this.projection = d3.geoAlbers()
            .translate([this.width / 2, this.height / 2])
            .center([-2.5, 31.5])
            .scale([950]);

        this.path = d3.geoPath().projection(this.projection);

        d3.json(this.data, data => {
            this.data = data;
            this.drawMap(this.data);
            this.drawDots(this.metric);
        })
    }

    drawMap(json) {
        // Loop through each state data value in the .csv file

        // Bind the data to the SVG and create one path per GeoJSON feature
        this.svg.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", this.path)
            .style('stroke', 'grey')
            .style('stroke-width', .5)
            .style('fill', 'lightgrey')
            .style("opacity", 0.8)




    };

    drawDots(metric) {
        const that = this;
        d3.csv(metric, data => {
            let metricScale = d3.scaleLinear()
                .domain(d3.extent(data, d => +d.metric))
                .range([3, 30]);

            this.metricDots = this.svg.selectAll("g.metric")
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
                .attr("class", "metric");

            this.metricDots = this.metricDots.merge(metricDotsEnter);

            this.metricDots
                .attr("transform", d => `translate(${that.projection([d.lon, d.lat])})`)
                .append("circle")
                .transition()
                .duration(1500)
                .attr("r", d => metricScale(+d.metric))
                .style("fill", "red")
                .style('stroke', 'red')
                .attr("fill-opacity", 0.15);
        });

    }
}

