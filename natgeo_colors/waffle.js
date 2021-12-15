

const makeDataArray = (data) => {
	const newData = [];
	for (let [key, vals] of Object.entries(data)) {
	    curCols = new Array(vals.percentage).fill(vals.color)
	    newData.push(...curCols)
	};
	return newData;
}


const addYearHeader = (year) => {
	d3.select(`.year${year}`).append("h3")
				.text(`Year: ${year}`)
				.lower()
				.style('text-align', 'center')
				.style('margin', '1px') // vertical distance
				.style('margin', 'auto')
				.style('display', 'block')
}


const addYear = (year,) => {
	// create 12x1 grid for entire year
	const yearDiv = d3.select('#container')
		.append('div')
		.attr('class', `year${year}`)
			.append('div')
			.attr('class', 'outer-grid')

	// add year title to grid
	addYearHeader(year);

	// hide oldest covers
	d3.select(`.year${year}`)
		.style('display', year > 2005 ? 'block' : 'block');

	// initialize figures in grid
	for (let i=1;i < 13; i++) {
		yearDiv.append('figure')
			.attr('class', `year${i}`)
			.style('width', '0px')
			.style('margin-botom', '0px')
			.style('margin-top', '0px')
	}
}




const waffleChart = (year, selection, data, img_url, month) => {
	// grab selection
  const sel = d3.select(`.year${year}`)
  const sel2 = sel.select(selection)
  let newClass = `block${selection.slice(1,)}`

  // create wrapper container
  sel2
  	.style('display', 'grid')
  	.style('max-width', '100%')
  	.style('max-height', '100%')
  	.style("grid-template-rows", "1fr")
  	.style('grid-template-columns', "repeat(10, 1fr)")
  	// .style('border', '1px solid transparent')

  // create each of the 100 divs
	sel2
		.selectAll('.block')
		.data(data)
		.enter()
		.append('div')
		.attr('class', newClass)
		.attr('img_url', img_url)
		.attr('month', month)
		.style('width', '7px')
		.style('height', '7px')
		.style('margin', '0px')
		.style('background-color', d => eval(d))
		.style('opacity', 1)
		.style('padding', '0px')
		.style('border-radius', '0px')

	sel.selectAll('figure')
		.style('border', '4px solid rgb(254.8,210.67,4.24)')
				.style('width', '100%')

	// Interactivity
	sel.selectAll('figure')
		.on('mouseover', function(d) {
			d3.select(this).selectAll('div[class^=blockyear]')
				.style('opacity', 1)
				.style('transform', 'scale(4, 4)')
				.style('transition', 'all 0.2s')

			const cover_height = 220;

			let pos = d3.select(this).node().getBoundingClientRect();
			
			const cover_url = d3.select(this).select('div[class^=blockyear]').attr('img_url')
			const month = d3.select(this).select('div[class^=blockyear]').attr('month')

			// view tooltip
			d3.select('#tooltip')
				.style('opacity', 1)
				.html(`
					<div >
					<p class="t">${month}, ${year}</p>
					<img src='data/images/${cover_url}' width=170 height=${cover_height}
					</div>`)
				.style('left', `${pos['x'] - 45}px`)
		        .style('top', `${(window.pageYOffset + pos['y'] - cover_height - 20)}px`);
		})
		.on('mouseout', function(d) {
			d3.select(this).selectAll('div[class^=blockyear]')
				.style('opacity', 1)
				.style('transform', 'scale(1, 1)')
				.style('transition', 'all 0.2s')

			// remove tooltip
			d3.select('#tooltip')
 				.style('opacity', 0)
		})
}

