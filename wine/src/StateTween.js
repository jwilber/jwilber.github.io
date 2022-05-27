class StateTween {
    constructor(opts) {
        const that = this;
        this.svg = d3.select(opts.element);
        this.data = opts.data;

        // add texture
        const texture = textures.lines()
            .orientation("3/8")
            .size(12)
            .strokeWidth(2)
            .shapeRendering("crispEdges")
            .stroke("darkorange");

        this.svg.call(texture);

        this.path = this.svg.append("path")
            .style('stroke', 'darkorange')
            .style('stroke-width', 3)
            .style('fill', texture.url());

        // make chart
        d3.json(this.data, function (err, topo) {
            that.states = topojson.feature(topo, topo.objects.states)
                .features.map(d => d.geometry.coordinates[0]);

            that.ca = that.states[0].slice(0);
            that.wa = that.states[1].slice(0);
            that.ma = that.states[2].slice(0);

            // draw CA first
            that.makeState('ca', 'ca');
        })

    }

    makeState(nState, pState) {
        const that = this;

        const newState = that[nState];
        const prevState = that[pState];

        let join = d => { return "M" + d.join("L") + "Z"; };

        // Same number of points on each ring (smoother transitions)
        if (newState.length < prevState.length) {
            StateTween.addPoints(newState, prevState.length - newState.length);
        } else if (prevState.length < newState.length) {
            StateTween.addPoints(prevState, newState.length - prevState.length);
        }

        that.path.transition()
            .duration(1300)
            .attr("d", d => join(newState))
    }


    static addPoints(ring, numPoints) {

        let desiredLength = ring.length + numPoints,
            step = d3.polygonLength(ring) / numPoints;

        let i = 0,
            cursor = 0,
            insertAt = step / 2;

        do {
            let a = ring[i];
            let b = ring[(i + 1) % ring.length];

            let segment = StateTween.distanceBetween(a, b);

            if (insertAt <= cursor + segment) {
                ring.splice(i + 1, 0, StateTween.pointBetween(a, b, (insertAt - cursor) / segment));
                insertAt += step;
                continue;
            }

            cursor += segment;
            i++;

        } while (ring.length < desiredLength);

    }

    static pointBetween(a, b, pct) {
        let point = [a[0] + (b[0] - a[0]) * pct, a[1] + (b[1] - a[1]) * pct];
        point.added = true;
        return point;
    }

    static distanceBetween(a, b) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
    }

}

