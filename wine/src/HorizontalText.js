class HorizontalText {
  constructor(opts) {
    this.element = opts.element;
    this.data = opts.data;
    this.MARGIN = { TOP: 50, BOTTOM: 0, LEFT: 120, RIGHT: 0 };
    this.WIDTH = 700 - this.MARGIN.RIGHT - this.MARGIN.LEFT;
    this.HEIGHT = 600 - this.MARGIN.TOP - this.MARGIN.BOTTOM;

    this.svg = d3
      .select(this.element)
      .append("svg")
      .attr("width", this.WIDTH + this.MARGIN.LEFT + this.MARGIN.RIGHT)
      .attr("height", this.HEIGHT + this.MARGIN.TOP + this.MARGIN.BOTTOM)
      .append("g")
      .attr("transform", `translate(${this.MARGIN.LEFT}, ${this.MARGIN.TOP})`);

    this.update(this.data);
  }

  update(data) {
    this.data = data;
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, (d) => +d.value)])
      .range([0, this.WIDTH - 50]);

    const y = d3
      .scaleBand()
      .domain(this.data.map((d) => d.winery))
      .range([0, this.HEIGHT])
      .padding(0.01);

    // text
    // join
    let wineryNames = this.svg
      .selectAll("text.names")
      .data(this.data, (d) => d.winery);

    console.log("winerynames", wineryNames);

    // exit
    wineryNames
      .exit()
      .transition()
      .delay((d, i) => i * 50)
      .duration(800)
      .attr("x", this.WIDTH + 100)
      .attr("y", this.HEIGHT / 2)
      .remove();

    // enter
    let wineEnter = wineryNames
      .enter()
      .append("text")
      .attr("class", "names")
      .style("font-size", "1.1rem")
      .attr("x", (d) => this.WIDTH + 500)
      .attr("y", (d) => this.HEIGHT + 140);

    wineryNames = wineryNames.merge(wineEnter);

    // update
    wineryNames
      .transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .attr("x", (d) => x(0))
      .attr("y", (d) => y(d.winery))
      .text((d, i) => `${i + 1}: ${d.winery}`);
  }
}
