class Slider {
    constructor(opts) {
        this.element = opts.element;
        this.max = +opts.max;
        this.min = +opts.min;
        this.title = opts.title;
        this.text = opts.text;

        this.currValue = 0.5;

        // draw slider
        this.draw();
    }

    draw() {
        const that = this;
        const el = d3.select(this.element);

        // draw text
        el.append('h4')
            .attr('id', `${this.title}-text`)
            .html(`${this.title}: 50%`)
            .style('font-size', '1.3rem')

        el.append('p')
            .html(`(${this.text})`)
            .style('font-size', '.75rem')


        // draw slider
        el.append('input')
            .attr('class', 'metric-slider')
            .attr('id', `${this.title}-slider`)
            .attr('type', 'range')
            .attr('min', 0)
            .attr('max', 100)
            .attr('maxlength', '100')
            .style('width', `${150}px`)
            .style('margin-left', `${20}px`)
            .style('margin-right', `${20}px`)

        d3.selectAll(`.metric-slider`)
            .on('input', function (d) {
                // only update text
                let val = d3.select(this).property('value');
                // set price to object state
                that.currValue = Number(val) * 0.01;
                console.log(that.currValue)
            })
            .on('change', function (d) {
                console.log('run code actually')
            })

    }
}