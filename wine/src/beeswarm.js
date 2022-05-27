
class BeeSwarm {

    constructor(opts) {
        // load in arguments from config object
        this.data = opts.data;
        this.element = opts.element;
        // create the chart
        const that = this;

        d3.csv(this.data, (error, data) => {
            if (error) throw error;
            this.data = data;
            this.draw()
        })
    }

    draw() {
        this.WIDTH = 1200;
        this.HEIGHT = 500;
        this.MARGIN = { TOP: 0, RIGHT: 40, BOTTOM: 84, LEFT: 50 };
        this.formatNumber = d3.format(",");
        this.chartState = {};
        this.chartState.variable = "points";
        this.chartState.scale = "scaleLinear";
        this.chartState.legend = "Price, in USD";


        this.svg = d3.select(this.element)
            .append("svg")
            .attr("width", this.WIDTH)
            .attr("height", this.HEIGHT)

        this.setScales();
        this.addAxes();
        this.addLegend();

        // initialize at US with price
        this.us = this.data.filter(d => d.country === 'US');
        this.us_italy = this.data.filter(d => d.country === 'Italy' || d.country === 'US');

        this.redraw('us', 'price', false);
    }

    setScales() {
        this.xScale = d3.scaleLinear()
            .domain(d3.extent(this.data, d => +d.price))
            .range([this.MARGIN.LEFT, this.WIDTH - this.MARGIN.RIGHT]);

        this.xAxis = d3.axisBottom(this.xScale)
            .ticks(10)
            .tickSizeOuter(0);

        this.yScale = d3.scaleLinear()
            .domain(d3.extent(this.data, d => +d.points))
            .range([0, this.HEIGHT - this.MARGIN.TOP - this.MARGIN.BOTTOM])

        this.emScale = d3.scaleLinear()
            .domain(d3.extent(this.data, d => +d.price))
            .range([6, 35])

        this.colors = d3.scaleOrdinal()
            .domain(["France", "US", "Italy", "europe", "southAmerica", "oceania"])
            .range(['pink', 'teal', 'skyblue', 'coral', 'grey', 'tan']);
    }

    addAxes() {
        this.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (this.HEIGHT - this.MARGIN.BOTTOM) + ")")
            .call(this.xAxis);
    }

    addInteractionElements() {
        this.tt = d3.select(this.element).append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);


        this.xline = this.svg.append("line")
            .attr("stroke", "gray")
            .attr("stroke-dasharray", "1,2");
    }

    addLegend() {
        this.legend = this.svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", this.WIDTH / 2)
            .attr("y", this.HEIGHT - 4)
            .attr("font-family", "PT Sans")
            .attr("font-size", '1rem')
            .attr("fill", "darkslategray")
            .attr("fill-opacity", 1)
            .attr("class", "legend");

        const that = this;
        const legendData = ['US', 'Italy', 'France'];

        const nodeWidth = (d) => d.getBBox().width;

        const legend = this.svg.append('g')
            .attr('class', 'legend2')
            .attr('transform', 'translate(0,0)');

        const lg = legend.selectAll('g')
            .data(legendData)
            .enter()
            .append('g');


        lg.append('circle')
            .attr('r', 7)
            .attr('stroke', 'black')
            .attr('fill', (d, i) => i == 0 ? 'teal' : i == 1 ? 'skyblue' : 'pink')
            .attr('cy', 5)

        lg.append('text')
            .style('font-size', '13px')
            .attr('x', 10.5)
            .attr('y', 10)
            .text(d => d);

        let offset = 0;
        lg.attr('transform', function (d) {
            let x = offset;
            offset += nodeWidth(this) + 10;
            return `translate(${x}, ${20})`;
        });

        legend.attr('transform', function () {
            return `translate(${(that.WIDTH - nodeWidth(this)) / 2}, 0)`
        });

    }

    redraw(country, variable, yaxis) {
        let data;
        // resolve data (just do here so don't need to get fancy w/ passing state in scrolling)
        if (country === 'us') data = this.us;
        if (country === 'us_italy') data = this.us_italy;
        if (country === 'all') data = this.data;
        // set legend text
        if (variable == 'price') this.chartState.legend = "Price, in USD";
        if (variable == 'points') this.chartState.legend = "Points";
        if (variable == 'polarity') this.chartState.legend = "Sentiment (Polarity)";

        this.xScale.domain(d3.extent(data, d => +d[variable]));

        let xAxis = d3.axisBottom(this.xScale)

        d3.transition(this.svg).select(".x.axis").transition()
            .duration(1000)
            .call(xAxis);

        // define simulation
        if (yaxis === false) {
            this.simulation = d3.forceSimulation(data, d => `${d.index}-{d.price}-${d.points}`)
                .force("x", d3.forceX(d => this.xScale(+d[variable])).strength(2))
                .force("y", d3.forceY((this.HEIGHT / 2) - this.MARGIN.BOTTOM / 2))
                .force("collide", d3.forceCollide(d => 3 + this.emScale(d.price)))
                .stop();
        } else {
            this.simulation = d3.forceSimulation(data, d => `${d.index}-{d.price}-${d.points}`)
                .force("x", d3.forceX(d => this.xScale(+d[variable])).strength(2))
                .force("y", d3.forceY(d => this.yScale(+d.points)).strength(2))
                .force("collide", d3.forceCollide(d => 3 + this.emScale(d.price)))
                .stop();
        }

        // only tick once
        for (let i = 0; i < data.length / 2; ++i) this.simulation.tick();
        for (let i = 0; i < data.length / 2; ++i) this.simulation.tick();
        for (let i = 0; i < data.length / 2; ++i) this.simulation.tick();

        // define circles
        this.countriesCircles = this.svg.selectAll(".countries")
            .data(data, d => `${d.index}-{d.price}-${d.points}`);

        this.countriesCircles.exit()
            .transition()
            .duration(1000)
            .attr("cx", 0)
            .attr("cy", (this.HEIGHT / 2) - this.MARGIN.BOTTOM / 2)
            .remove();

        this.countriesCircles.enter()
            .append("circle")
            .attr("class", "countries")
            .attr("cx", 0)
            .attr("cy", (this.HEIGHT / 2) - this.MARGIN.BOTTOM / 2)
            .attr("r", d => this.emScale(d.price))
            .attr('fill-opacity', .75)
            .attr('stroke', 'grey')
            .attr("fill", d => this.colors(d.country))
            .merge(this.countriesCircles)
            .transition()
            .duration(1500)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        this.legend.text(this.chartState.legend);
    }
}
