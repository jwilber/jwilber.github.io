class Scatter {
    constructor(opts) {
        this.element = opts.element;
        this.data = opts.data;

        this.MARGIN = { TOP: 10, BOTTOM: 70, LEFT: 120, RIGHT: 20 };
        this.WIDTH = 800 - this.MARGIN.RIGHT - this.MARGIN.LEFT;
        this.HEIGHT = 450 - this.MARGIN.TOP - this.MARGIN.BOTTOM;

        this.svg = d3.select(this.element)
            .append('svg')
            .attr('width', this.WIDTH + this.MARGIN.LEFT + this.MARGIN.RIGHT)
            .attr('height', this.HEIGHT + this.MARGIN.TOP + this.MARGIN.BOTTOM)
            .append('g')
            .attr('transform', `translate(${this.MARGIN.LEFT}, ${this.MARGIN.TOP})`);


        // add text labels
        this.xLabel = this.svg.append('text')
            .attr('x', this.WIDTH / 2)
            .attr('y', this.HEIGHT + 50)
            .attr('text-anchor', 'middle')
            .text("Points")

        this.svg.append('text')
            .attr('x', - this.HEIGHT / 2)
            .attr('y', -50)
            .attr('text-anchor', 'middle')
            .text('Price, in USD')
            .attr('transform', 'rotate(-90)')

        // preset axes
        this.xAxisGroup = this.svg.append('g')
            .attr('transform', `translate(0, ${this.HEIGHT})`);

        this.yAxisGroup = this.svg.append('g');
        // tooltip
        // Define the div for the tooltip
        this.tooltip = d3.select('#wine-scatterplot')
            .append('div')
            .attr('id', 'scatter-tooltip')
            .attr('class', 'tooltip')
            .style("opacity", 0)
            .style("pointer-events", "none")
            .style('font-size', '1rem')
            .style('text-align', 'left')
            .style('font-weight', 'bold')


        d3.csv('data/wine_scatter.csv', data => {
            this.data = data;
            this.update('Argentina');

        })

    }

    update(country) {
        const that = this;
        let data = this.data.filter(d => d.country == country);
        const x = d3.scaleLinear()
            .domain([d3.min(data, d => +d.Points) - 3,
            d3.max(data, d => +d.Points) + 3])
            .range([0, this.WIDTH]);

        const y = d3.scaleLinear()
            .domain([0,
                d3.max(data, d => +d.Price) + 3])
            .range([this.HEIGHT, 0]);

        const xAxisCall = d3.axisBottom(x);
        this.xAxisGroup.transition().duration(500).call(xAxisCall)

        const yAxisCall = d3.axisLeft(y);
        this.yAxisGroup.transition().duration(500).call(yAxisCall)


        // update circles
        let circles = this.svg.selectAll('circle.variety')
            .data(data, d => d.Variety);

        circles.exit().remove();

        let circlesEnter = circles
            .enter()
            .append('circle')
            .attr('class', 'variety')
            .attr('fill', '#3399FF')
            .attr('r', 1)
            .attr('cx', d => x(+d.Points))
            .attr('cy', d => y(+d.Price))


        circles = circles.merge(circlesEnter);

        circles.transition()
            .duration(1000)
            .attr('cx', d => x(+d.Points))
            .attr('cy', d => y(+d.Price))
            .attr('r', 8)
            .attr('class', 'variety')
            .attr('fill-opacity', 0.35)
            .attr('stroke', 'black')

        circles
            .on("mouseover", function (d) { // show it and update html
                let curData = d;
                d3.selectAll('circle.variety')
                    .style('opacity', .2)
                d3.select(this)
                    .style('opacity', 1)
                that.tooltip
                    .transition()
                    .style("opacity", .9);
                that.tooltip.html(function (d) { return curData.Variety })
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function (d) {
                d3.selectAll('circle.variety')
                    .style('opacity', 1)
                that.tooltip.transition()
                    .style("opacity", 0);
            })

    }
}