// using d3 for convenience
var main = d3.select("main");
var scrolly = main.select("#scrolly");
var figure = scrolly.select("figure");
var article = scrolly.select("article");
var step = article.selectAll(".step");

const beeSwarm = new BeeSwarm({
  element: '#chart1',
  data: 'data/bubble_df_us_italy_france.csv'
})


// initialize the scrollama
var scroller = scrollama();

// generic window resize listener event
function handleResize() {
  // 1. update height of step elements
  var stepH = Math.floor(window.innerHeight * 0.95);
  step.style("height", stepH + "px");

  var figureHeight = window.innerHeight / 1.2;
  var figureMarginTop = (window.innerHeight - figureHeight) / 2;

  figure
    .style("height", figureHeight + "px")
    .style("top", figureMarginTop + "px");

  // 3. tell scrollama to update new element dimensions
  scroller.resize();
}

// scrollama event handlers
function handleStepEnter(response) {
  // response = { element, direction, index }

  // add color to current step only
  step.classed("is-active", function (d, i) {
    return i === response.index;
  });

  // update graphic based on step
  // figure.select("p").text(response.index + 1);

  // chart functions
  if (response.index == 0 & response.direction == 'down') {
    beeSwarm.redraw('us_italy', 'price', false)
  } else if (response.index == 0 & response.direction == 'up') {
    beeSwarm.redraw('us', 'price', false)
  } else if (response.index == 1 & response.direction == 'down') {
    beeSwarm.redraw('all', 'price', false)
    // stateTweener.makeState('wa', 'ca');
  } else if (response.index == 1 & response.direction == 'up') {
    beeSwarm.redraw('us_italy', 'price', false)
  } else if (response.index == 2 & response.direction == 'up') {
    beeSwarm.redraw('all', 'price', false)
  } else if (response.index == 2 & response.direction == 'down') {
    beeSwarm.redraw('all', 'points', false)
  } else if (response.index == 3 & response.direction == 'up') {
    beeSwarm.redraw('all', 'points', false)
  } else if (response.index == 3 & response.direction == 'down') {
    beeSwarm.redraw('all', 'polarity', false)
  } else if (response.index == 4 & response.direction == 'up') {
    beeSwarm.redraw('all', 'polarity', false)
  } else if (response.index == 5 & response.direction == 'up') {
    console.log('5 up')

  }
}

function setupStickyfill() {
  d3.selectAll(".sticky").each(function () {
    Stickyfill.add(this);
  });
}

function init() {
  setupStickyfill();

  // 1. force a resize on load to ensure proper dimensions are sent to scrollama
  handleResize();

  // 2. setup the scroller passing options
  // 		this will also initialize trigger observations
  // 3. bind scrollama event handlers 
  scroller
    .setup({
      step: "#scrolly article .step",
      offset: 0.1,
    })
    .onStepEnter(handleStepEnter);

  // setup resize event
  window.addEventListener("resize", handleResize);
}

// kick things off
init();
