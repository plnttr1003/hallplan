var el = {
	svg: document.getElementById('svg')
};

var options = {
	offset: 6
};

var main = {
	drawUse: function(x, y, fill) {
		var useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
		useEl.setAttribute('href', '#circle');
		useEl.setAttribute('style',`transform: translate3d(${x}px,${y}px, 0); fill:${fill};`);
		el.svg.appendChild(useEl);
	},
	text: function(text) {
		document.getElementById('text').innerHTML = text;
	},
	getD: function(el) {
		return el.getAttribute('d');
	},
	pathToPoints: function(d) {
		return d.replace(/[M ][ Z]/g, '').split(' L ').map(function(item) {
			return item.split(' ').map(function(point) {
				return +point;
			})
		});
	},
	offset: function() {
		var offsetArray = main.pathToPoints(main.getD(document.getElementById('path1')));
		var coordinatesArray = [];

		//console.log('offsetArray', offsetArray);
		main.text(offsetArray.join(','));
		offsetArray.forEach(function(point, i) {
			var x1 = point[0];
			var y1 = point[1];
			var perpCrds = [];
			var currentLength = 0;
			var offsetFactor = 0;
			//var hypotenuseLength = 0;
			var x2 = i !== offsetArray.length - 1 ? offsetArray[i + 1][0] : offsetArray[0][0];
			var y2 = i !== offsetArray.length - 1 ? offsetArray[i + 1][1] : offsetArray[0][1];
			// console.log(x1 - x2, y1 - y2, x2 - x1, y2 - y1);
			// console.log(Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2))); // полифил для двух точек
			currentLength = Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
			offsetFactor = currentLength / options.offset;
			//hypotenuseLength = Math.sqrt(Math.pow(currentLength, 2) + Math.pow(options.offset, 2));
			//Math.sqrt(Math.pow(currentLength, 2) + Math.pow(options.offset, 2));

			perpCrds = main.perp([x1, x2], [y1, y2], offsetFactor, true); // пока берем первую точку
			main.drawLine([x1, y1], perpCrds, "#fc0");
			main.drawUse(perpCrds[0], perpCrds[1], "#f00");

			coordinatesArray.push(perpCrds);

			perpCrds = main.perp([x2, x1], [y2, y1], offsetFactor);
			main.drawLine([x2, y2], perpCrds, "#fcc");
			main.drawUse(perpCrds[0], perpCrds[1], "#005eff");

			coordinatesArray.push(perpCrds);
		});
		// console.log('coordinatesArray', coordinatesArray);
		main.drawPath(coordinatesArray);
	},
	perp: function(x, y, offsetFactor, orient) {
		// console.log('offsetFactor ===', offsetFactor);
		var deltaX = (x[1] - x[0]) / offsetFactor;
		var deltaY = (y[1] - y[0]) / offsetFactor;
		xPerp = (x[0] + (orient ? deltaY : -deltaY));
		yPerp = (y[0] + (orient ? - deltaX : deltaX));
		// console.log('perp', xPerp, yPerp);
		return ([xPerp, yPerp]);
	},
	drawLine: function(points1, points2, color) {
		var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		var d = `M ${points1[0]} ${points1[1]} L ${points2[0]} ${points2[1]}`;
		var style = `stroke:${color}`;
		pathEl.setAttribute('d', d);
		pathEl.setAttribute('style', style);
		el.svg.appendChild(pathEl);
	},
	drawPath: function(pointsArray) {
		var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		var path = '';
		var style = `stroke:#f00; stroke-width:0.3px; fill:transparent`;
		pointsArray.forEach(function(point, i) {
			if (i === 0) {
				path += `M ${point[0]} ${point[1]}`;
			} else if (i % 2 === 0 ) {
        path += `A ${options.offset}, ${options.offset} 0 0, 1 ${point[0]}, ${point[1]}`;
        // rx,ry x-axis-rotation large-arc-flag, sweep-flag x,y
      } else if (i === pointsArray.length - 1) {
				path += `L ${point[0]} ${point[1]} A ${options.offset}, ${options.offset} 0 0, 1 ${pointsArray[0][0]}, ${pointsArray[0][1]}`;
			} else {
				path += `L ${point[0]} ${point[1]}`;
			}
			// console.log(path);
		});
		path += 'Z';
		// console.log('PATH ==', path);
		pathEl.setAttribute('d', path);
		pathEl.setAttribute('style', style);
		el.svg.appendChild(pathEl);
	}
	/*clockWise: function(points) {
		//var col = (x2 - x1)*(y4 - y1) - (x4 - y1)*(y2 - y1); см https://fiddle.jshell.net/plnttr1003/vty3j10c/9/
		console.log(points, (points[0][1] - points[0][0])*(points[1][2] - points[1][0]) - (points[0][2] - points[1][0])*(points[1][1] - points[1][0]));
		return ((points[0][1] - points[0][0])*(points[1][2] - points[1][0]) - (points[0][2] - points[1][0])*(points[1][1] - points[1][0]) < 0);
	}*/

};
main.offset();