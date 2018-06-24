//Width and height
		var w = 1100;
		var h = 900;
		var damper = 0.102;

		function charge(d) {
		  // return -Math.pow(d.radius, 2.0) / 2;
		  return d.radius * 10;
		};

		function moveToCenter(alpha) {
			  return function (d) {
			    d.x = d.x + (center.x - d.x) * damper * alpha;
			    d.y = d.y + (center.y - d.y) * damper * alpha;
			  };
			};

		var colors = d3.scale.quantize()
					.domain([0,3])
					.range(['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2', '#8073ac']);

		var svg = d3.select('#chart')
				.append('svg')
				.attr('width', w)
				.attr('height', h)
				.append('g');
		
		//Original data
		var dataset = {
			nodes: [
				{ name: "ABOUT ME", radius:90, loc: 'https://jwilber.github.io/about.html', col: '#02818a'},
				{ name: "PROJECTS", radius:100, loc: 'https://jwilber.github.io/projects.html', col: '#67a9cf'},
				{ name: "CONTACT", radius:90, loc: 'https://jwilber.github.io/contact.html', col: '#bdc9e1'},
				// { name: "Project 4", radius: 10}

			],
			edges: [
				{ source: 1, target: 0},
				{ source: 0, target: 2 },
				{source: 2, target: 1},
			]
		};


		var center = {x: w/2 - 20, y: h/2};

		var force = d3.layout.force()
						.nodes(dataset.nodes)
						.links(dataset.edges)
						.size([w, h])
						.linkDistance([550])
						.charge(charge)
						.friction(.9)
						.gravity(-.001)
						.start();

		var edges = svg.selectAll('line')
					.data(dataset.edges)
					.enter()
					.append('line')
					.style("stroke", "#ccc")
					.style("stroke-width", 1);

		var nodes = svg.selectAll('circle')
					.data(dataset.nodes)
					.enter()
					.append('circle')
					.classed('node', true)
					.attr('r', function(d) {
						return d.radius;
					})
					.style('fill', function(d) { return d.col;})
					.attr('loc', function(d) {
						return d.loc;
					})
					.call(force.drag);

		var label = svg.selectAll(".mytext")
                    .data(dataset.nodes)
                    .enter()
                    .append("text")
                    .text(function(d) {
                    	return d.name;
                    })
                    .style("text-anchor", "middle")
                    .style("fill", "#f0f0f0")
                    .style("font-family", "futura")
                    .style('font-weight', 'bold')
                    .style("font-size", 20);



		force.on('tick', function (e) {

			edges.attr("x1", function(d) { return d.source.x; })
		 	 .attr("y1", function(d) { return d.source.y; })
		 	 .attr("x2", function(d) { return d.target.x; })
		 	 .attr("y2", function(d) { return d.target.y; });

		    nodes.each(moveToCenter(e.alpha))
		      .attr('cx', function (d) { return d.x; })
		      .attr('cy', function (d) { return d.y; });

		    label.attr("x", function(d){ return d.x - 3; })
             .attr("y", function (d) {return d.y; });
		  });


		d3.selectAll('.node')
			.on('mouseover', function() {
				r = parseInt(d3.select(this).attr('r')) + 10;
				d3.select(this)
					.attr('r', r);
			})
			.on('mouseout', function() {
				r = parseInt(d3.select(this).attr('r')) - 10;
				d3.select(this)
					.attr('r', r);
			})
			.on('click', function () {
					site = d3.select(this).attr('loc');
                    location.href = site;
                 	});