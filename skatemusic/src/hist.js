
var margin = {top: 45, right: 80, bottom: 150, left: 660},
    width = 1600 - margin.left - margin.right,
    height = 650 - margin.top - margin.bottom;
  
var svg = d3.select("body").append("svg")
	.attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
	.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
  var color = d3.scale.ordinal()
		.range(["#FF0000","#60497A","#F79620", "#F5C918", "#FF6600", "#707FBE", "#3669B3", "#009ACC", "#008C8C", "#3EBCA2","#2DB45F"]);

d3.csv("/data/company_data.csv", function(error, data){

	// filter year
	var data = data

	// Get every column value
	var elements = Object.keys(data[0])
		.filter(function(d){
			return ((d != "Year") & (d != "artist"));
		});
  console.log(elements);
  
  var epiNames = ["Thrasher Magazine", "Zoo York", "DC Shoes", "Transworld Skateboarding", "Pyramid Country",
  "Real Skateboards", "éS Footwear", "Fourstar Clothing","Polar Skate Co", "Habitat Skateboards",
  "Alien Workshop"]

  // d3.keys(data[0]).filter(function(key) { 		     return  ((key != "Year") & (key != "Country") & (key != "EPI Score")& (key != "10-Year Percent Change")); });
  
	var selection = elements[0];

	var y = d3.scale.linear()
			.domain([0, d3.max(data, function(d){
				return +d[selection];
			})])
			.range([height, 0]);

	var x = d3.scale.ordinal()
			.domain(data.map(function(d){ return d.artist;}))
			.rangeBands([0, width]);


	var xAxis = d3.svg.axis()
		.scale(x)
	  .orient("bottom");

	var yAxis = d3.svg.axis()
		.scale(y)
	  .orient("left");
  
  var legend = svg.selectAll(".legend")
		  .data(epiNames.slice())
		  .enter().append("g")
		  .attr("class", "legend")
		  .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

		legend.append("rect")
		  .attr("x",  - 180)
		  .attr("width", 18)
		  .attr("height", 18)
		  .style("fill", color);

		legend.append("text")
		  .attr("x", -160)
		  .attr("y", 9)
		  .attr("dy", ".35em")
		  //.style("text-anchor", "end")
		  .text(function(d) { return d; });

	svg.append("g")
    	.attr("class", "x axis")
    	.attr("transform", "translate(0," + height + ")")
    	.call(xAxis)
    	.selectAll("text")
    	.style("font-size", "12px")
      	.style("text-anchor", "end")
      	.attr("dx", "-.8em")
      	.attr("dy", "-.55em")
      	.attr("transform", "rotate(-45)" );


 	svg.append("g")
    	.attr("class", "y axis")
    	.call(yAxis);

	svg.selectAll("rectangle")
		.data(data)
		.enter()
		.append("rect")
		.attr("class","rectangle").attr("fill","steelblue")
		.attr("width", width/data.length-1)
		.attr("height", function(d){
			return height - y(+d[selection]);
		})
		.attr("x", function(d, i){
			return (width / data.length) * i ;
		})
		.attr("y", function(d){
			return y(+d[selection]);
		})
		.append("title")
		.text(function(d){
			return d.artist + " : " + d[selection];
		});

	var selector = d3.select("#drop")
    	.append("select")
    	.attr("id","dropdown")
    	.on("change", function(d){
        	selection = document.getElementById("dropdown");

        	y.domain([0, d3.max(data, function(d){
            console.log(+d[selection.value]);
				return +d[selection.value];})]);

        	yAxis.scale(y);

        	d3.selectAll(".rectangle")
           		.transition()
	            .attr("height", function(d){
					return height - y(+d[selection.value])
          console.log(+d[selection.value]);
				}).attr("fill", getColor(selection.value))
				.attr("x", function(d, i){
					return (width / data.length) * i ;
				})
				.attr("y", function(d){
					return y(+d[selection.value]);
				})
           		.ease("linear")
           		.select("title")
           		.text(function(d){
           			return d.artist + " : " + d[selection.value];
           		});
      
           	d3.selectAll("g.y.axis")
           		.transition()
           		.call(yAxis);

         });

    selector.selectAll("option")
      .data(elements)
      .enter().append("option")
      .attr("value", function(d){
        return d;
      })
      .text(function(d){
        return d;
      })
    
    
    

    function getColor(d) {
      	var color = "";
        console.log(d);
        switch (d) {
          case "Thrasher Magazine":
            color = "#FF0000";
            break;
          case "Zoo York":
            color = "#60497A";
            break;
          case "DC Shoes":
            color = "#F79620";
            break;
          case "Transworld Skateboarding":
            color = "#F5C918";
            break;
          case "Pyramid Country":
            color = "#FF6600";
            break;
          case "Real Skateboards":
            color = "#707FBE";
            break;
          case "éS Footwear":
            color = "#3669B3";
            break;
          case "Fourstar Clothing":
            color = "#009ACC";
            break;
          case "Polar Skate Co":
            color = "#008C8C";
            break;
          case "Habitat Skateboards":
            color = "#3EBCA2";
            break;
          case "Alien Workshop":
            color = "#2DB45F";
            break;
          
          default:
              color = "#919191";
    		}
      return color
    }

});
  
