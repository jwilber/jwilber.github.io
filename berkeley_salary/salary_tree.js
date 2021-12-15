    var margin = {top: 40, right: 0, bottom: 10, left: 0},
    width = 954,
    height = 600;

var currState = 'nat';
var medCutoff = 1;
var showParentLab = false;
var currOcc = null;

var parcauseToColor = {professor:"node communityhighlight_par",
                        "associate-professor":"node educationhighlight_par",
                    "lecturer" :"node humanserviceshighlight_par", "assistant-professor": "node religionhighlight_par",
                    "Human-Rights": "node humanrightshighlight_par", Healthcare: "node healthcarehighlight_par",
                    "Poverty-and-Hunger": "node povertyhighlight_par",
                    "Disaster-Aid": "node disasterhighlight_par", "Environment": "node environmenthighlight_par",
                    Animals: "node animalshighlight_par", "Military": "node militaryhighlight_par",

                    };

var treemap = d3.layout.treemap()
    .size([width, height])
    .sticky(true)
    .padding(2)
    .sort(function(a, b) { return a.value - b.value; })
    .value(function(d) { return d[currState]; });

var div = d3.select("body #treemapholder").append("div")
    .attr("id", "treemap")
    .style("position", "relative")
    .style("width", (width + margin.left + margin.right) + "px")
    .style("height", (height + margin.top + margin.bottom) + "px")
    .style("left", margin.left + "px")
    .style("top", margin.top + "px");

var color = d3.scale.category20();
// Load the employment data
d3.json("data/berk2.json")

    // Show loading progress for data file
    .on("progress", function() {
        d3.select("#loadprogress .progvalue").text(Math.round(100 * d3.event.loaded / 2275072));
    })
    .get(function(error, root) {
        d3.select("#loadprogress").remove();
        var node = div.datum(root).selectAll(".node")
            .data(treemap.nodes)
            .enter().append("div")
                //if it has children, class is parent node, else class is node
                .attr("class", function(d) { return d.children ? "parent node" : "node"; })
                // return 'occodeCAUSE'
                .attr("id", function(d) { return 'occnode' + d.ocode })
                .call(position);


        // Append labels to wider rectangles
        var label = node.append("div")
            .attr("class", "childlabel")
            .text(function(d) {
                if (d.children || d.dx*d.dy < 800) { return null; }
                else { return d.name; }
            });

        //// d3.selectAll(".children").data().map(function(d){
        ////     console.log(d.name);
        //// });
        // Append group labels on top
        d3.selectAll(".parent").data().map(function(d) {
            //console.log(d.name);
            if (d.name === "occs") return null;
            if (d.dx <= 22) return null;
            if (d.dy <= 22) return null;
                var dd = div.append("div")
                    .text(d.name)
                    .style("left", d.x + "px")
                    .style("top", d.y + "px")
                    .style("width", (d.dx-22) + "px")
                    .style("height", (d.dy-22) + "px")
                    //.attr("class", "parentlabel")
                    .attr("id", "plab"+d.ocode);
                if (d.name == 'professor') {
                    dd.attr('class', 'node educationhighlight_par');
                } else if (d.name == 'associate-professor') {
                    dd.attr('class', 'node healthcarehighlight_par');
                } else if (d.name == 'lecturer') {
                    dd.attr('class', 'node humanserviceshighlight_par');
                } else if (d.name == 'assistant-professor') {
                    dd.attr('class', 'node disasterhighlight_par');
                };


        });

        node.attr("class", medHighlight);

        // State selection
        var select = d3.selectAll("select").on("change", function change() {

            // Update nodes to new state
            currState = this.value;
            var value = function(d) { return d[currState]; }
            node
                .data(treemap.value(value).nodes)
                .transition()
                .duration(1000)
                .call(position)
                .call(positionParentLabels);

            // Adjust job labels
            node.selectAll("div.childlabel")
                .text(function(d) {
                    if (d.children || d.dx*d.dy < 800) { return null; }
                    else {
                        console.log(d.name);
                        return d.name; }
                });

            // Adjust median salary highlighting
            node
                .attr("class", medHighlight);
        });


        // Adjust parent labels on checkbox
        d3.selectAll("#parentcheck").on("change", function change() {
            showParentLab = this.checked;
            d3.selectAll(".parentlabel")
                .call(positionParentLabels);
        });

        // Set max slider range
        var maxDomain = 400000;

        // Tooltip effects
        node.on("mouseover", function(d) {
            if (!d.children) {

                // Add job category and job name
                d3.select("#tooltip #jobgroup").text(d.parent.name);
                d3.select("#tooltip #jobtitle").text(d.name);

                // Format median salary
                if (d[currState + "m"] == -99) {
                    var salaryText = "Estimate unavailable";
                } else if (d[currState + "m"] > maxDomain) {
                    var salaryText = "More than $" + numberWithCommas(maxDomain) + " per year"
                } else {
                    var salaryText = "$" + numberWithCommas(d[currState + "m"]) + " per year"
                }
                d3.select("#tooltip #jobsalary").text(salaryText);

                // Add Department
                //var empText = "Department: " + d.parent.name ;
                //d3.select("#tooltip #jobemptot").text(empText);

                // Adjust the width and height
                var w = d3.select("#tooltip").style("width");
                var h = d3.select("#tooltip").attr("height");

                // Get mouse position and then adjust tooltip position accordingly
                var jobsNode = d3.select("#jobs").node();
                var absMousePos = d3.mouse(jobsNode);

                if (absMousePos[0] > 700) {
                    var xpos = absMousePos[0] - parseFloat(w) - 30;
                } else {
                    var xpos = absMousePos[0] + 10;
                }

                if (absMousePos[1] > 400) {
                    var ypos = absMousePos[1] + 300;
                } else {
                    var ypos = absMousePos[1] + 300;
                }

                d3.select("#tooltip")
                    .style("left", xpos + "px")
                    .style("top", ypos + "px");

                // Display the tooltip
                d3.select("#tooltip").classed("hidden", false);
            }
        })
        .on("mouseout", function(d) {
            // Hide the tooltip
            d3.select("#tooltip").classed("hidden", true);
        });


        // Slider
        var slideMargin = {top: 0, right: 30, bottom: 10, left: 8},
            slideWidth = 773 - slideMargin.left - slideMargin.right,
            slideHeight = 75 - slideMargin.bottom - slideMargin.top;

        var x = d3.scale.linear()
            .domain([5, maxDomain])
            .range([0, slideWidth])
            .clamp(true);

        var brush = d3.svg.brush()
            .x(x)
            .extent([0,0])
            .on("brush", brushed);

        var svg = d3.select("#sliderholder").append("svg")
            .attr("width", slideWidth + slideMargin.left + slideMargin.right)
            .attr("height", slideHeight + slideMargin.top + slideMargin.bottom)
            .append("g")
            .attr("transform", "translate(" + slideMargin.left + "," + slideMargin.top + ")");

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + slideHeight / 2 + ")")
            .call(d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .tickFormat(function(d) {
                    if (d == 180000) return '> $' + numberWithCommas(d);
                    else return '$' + numberWithCommas(d);
                })
                .tickSize(0)
                .tickPadding(12))
            .select(".domain")
            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
                .attr("class", "halo");


        var slider = svg.append("g")
            .attr("class", "slider")
            .call(brush);

        slider.selectAll(".extent,.resize")
            .remove();

        slider.select(".background")
            .attr("height", slideHeight);

        var highlighter = slider.append("rect")
            .attr("class", "highlighter")
            .attr("height", 4)
            .attr("x", x(medCutoff))
            .attr("width", slideWidth-x(medCutoff)+2)
            .attr("transform", "translate(0," + (slideHeight / 2 - 2) + ")");

        // var handle = slider.append("circle")
        //     .attr("class", "handle")
        //     .attr("transform", "translate(0," + slideHeight / 2 + ")")
        //     .attr("r", 10)
        //     .attr("cx", x(medCutoff));
        var handle = slider.append("rect")
            .attr("class", "handle")
            .attr("height", 16)
            .attr("width", 16)
            .attr("transform", "translate(0," + slideHeight / 2.6 + ")")
            .attr("x", x(medCutoff));


        // Adjust node colors accordingly when median salary selected
        function brushed() {
            var value = brush.extent()[0];

            if (d3.event.sourceEvent) { // not a programmatic event
                value = x.invert(d3.mouse(this)[0]);
                brush.extent([value, value]);
            }

            handle.attr("x", x(value));                //If use rectangle, make this 'x' circle: 'cx'
            highlighter
                .attr("x", x(value))
                .attr("width", slideWidth-x(value)+2);

            var highlight = function(d) {                  //change this
                var cssclass;
                if (d.children) {
                    cssclass = "parent node";
                } else if (d[currState+"m"] > value && !d.children) {
                    if (d.parent.name in causeToColor) {
                        return causeToColor[d.parent.name];
                    } else {

                        return "node highlight";
                    }
                }  else {
                    cssclass = "node";
                }
                return cssclass;
            }

            node
              .attr("class", highlight);

            // Set the current median salary
            medCutoff = value;
        }

    }); // @end on load event



function position() {
  this.style("left", function(d) { return d.x + "px"; })
      .style("top", function(d) { return d.y + "px"; })
      .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
      .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
}

function positionParentLabels() {
    d3.selectAll(".parent").data().map(function(d) {

        d3.select("#plab" + d.ocode)
            .transition().duration(1000)
            .style("left", d.x + "px")
            .style("top", d.y + "px")
            .style("width", (d.dx-22) + "px")
            .style("height", (d.dy-22) + "px")
            .style("display", function() { return d.dx > 22 && showParentLab ? "block" : "none" });
        });
}

//edits are below here


var causeToColor = {"professor": "node educationhighlight", 
                    "associate-professor": "node healthcarehighlight", 
                    "assistant-professor": "node disasterhighlight",
                    "lecturer" :"node humanserviceshighlight"
                    };

function medHighlight(d) {
      if (d.children) {
         return "parent node";
      } else if (d[currState+"m"] > medCutoff && !d.children) {
        if (d.parent.name in causeToColor) {
            return causeToColor[d.parent.name];
        } else {

          return "node highlight";
         }

      } else {
          return "node";
      }
}


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}