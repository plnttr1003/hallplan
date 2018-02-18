var spo = require('svg-path-outline');

var data = {
	levelName: '',
	betweenPlaces: [],
	seatSize: 0,
	seatsByLevel: []
}

var el = {
	svg: document.getElementById('svg'),
	colors: ['#7549af', '#99ff66', '#cc33cc', '#667699', '#330099', '#cc9900', '#cc0099', '#3399cc']
};

var main = {
	start: function() {
		console.log(hallplan);
		hallplan.levels.forEach(function(level, i) {
			//console.log('Level', level);
			console.log('Level id', level.name, level.id, '\n------------------------------------------');
			console.log('\n------------------------------------------');
			console.log('seatsByLevel', main.seatsByLevel(level));
			console.log('\n\n\n');
			data.levelName = level.name;
			data.seatsByLevel = main.seatsByLevel(level);
			data.seatsByLevel.forEach(function(seats) {
				main.pushSectorPoints(seats);
			});
			data.seatSize = Math.min.apply(null, data.betweenPlaces);
			data.seatsByLevel.forEach(function(seats) {
				main.drawPath(seats, el.colors[i]);
				main.drawUses(seats, el.colors[i]);
			});
			/*
			console.log('COORDS ===', data[data.levelName].coords);
			console.log('betweenPlaces ===', Math.min.apply(null, data.betweenPlaces))
			*/
			main.drawVerticalPaths(data.seatsByLevel);
		});
		main.downloadSvg();
	},
	pushSectorPoints(points) {
		points.forEach(function(point, i) {
			if (i > 0) {
				data.tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
				data.tempPath.setAttribute('d', `M ${points[i-1][0]} ${points[i-1][1]} L ${point[0]} ${point[1]}`);
				data.betweenPlaces.push(data.tempPath.getTotalLength());
			}
		});
	},
	seatsByLevel: function(level) {
		var levelSeats = [];
		level.rows.forEach(function(row) {
			var rowSeats = [];
			row.seats.forEach(function(seat, i) {
				rowSeats.push([seat.x, seat.y]);
			});
			levelSeats.push(rowSeats);
		});
		return levelSeats;
	},
	drawPath: function(points, color, fn) {
		//console.log('seatSize', data.seatSize);
		var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		var path = '';
		var moveTo = false;
		if (Array.isArray(points)) {
			points.forEach(function(point, i) {
				if (i < points.length - 1 && !fn) {
					data.tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
					data.tempPath.setAttribute('d', `M ${point[0]} ${point[1]} L ${points[i+1][0]} ${points[i+1][1]}`);
					//console.log('seat size compare ===', data.tempPath.getTotalLength() < data.seatSize * 7, data.levelName);
					if (data.tempPath.getTotalLength() < data.seatSize * 7) {
						path += `${i === 0 || moveTo ? 'M' : 'L'} ${point[0]} ${point[1]}`;
						moveTo = false;
					} else {
						moveTo = true;
						console.log('TRUE', true);
						path += `M ${point[0]} ${point[1]} L ${point[0]} ${point[1]}`;
					}
				} else {
					path += `${i === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`;
				}
			});
		} else {
			path = points;
		}

		console.log('PATH ===', path);

		pathEl.setAttribute('d', path);
		pathEl.setAttribute('level-name', data.levelName);
		if (color) {
			pathEl.setAttribute('style', `fill:none; stroke-width: 6px; stroke: ${color};`);
		}
		//if (!fn) {
			el.svg.appendChild(pathEl);
		//}
		if (fn) {
			//console.log('>>>', fn, pathEl);
			fn(pathEl);
		}
	},
	drawVerticalPaths: function(rows) {
		var topPath = [];
		var rightPath = [];
		var bottomPath = [];
		var leftPath = [];
		//console.log('rows', rows);
		rows.forEach(function(seats, k){
			//console.log('seats', seats)
			seats.forEach(function(seat, i) {
				if (k === 0) {
					topPath.push(seat);
				}
				if (k === rows.length - 1) {
					bottomPath.push(seat);
				}
				if (i === 0) {
					leftPath.push(seat);
				} else if (i === seats.length - 1) {
					rightPath.push(seat);
				}
			});
		});
		main.drawPath(topPath.concat(rightPath, bottomPath.reverse(), leftPath.reverse()), '#f00', main.offset);
	},
	drawUse: function(x, y, fill) {
		var useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
		useEl.setAttribute('href', '#circle');
		useEl.setAttribute('style',`transform: translate3d(${x}px,${y}px, 0); fill:${fill};`);
		el.svg.appendChild(useEl);
	},
	drawUses: function(points, fill) {
		points.forEach(function(point, i) {
			main.drawUse(point[0], point[1], fill);
		});
	},
	offset: function(path) {
		//console.log('PATH', path);
		//var d = path.getAttribute('d');
		//var outline = spo(d, 20, {bezierAccuracy: 0});
		//console.log('OUTLINE', outline);
		//main.drawPath(outline, '#f67f00');
	},
	downloadSvg: function() {
		document.getElementById('btnSave').onclick = function() {
			var stringTofile = document.getElementById('svgContainer').innerHTML;
			console.log(stringTofile);
			if ('Blob' in window) {
				var fileName = 'test.svg';
				if (stringTofile != '') {
					var textFileAsBlob = new Blob([stringTofile], { type: 'image/svg+xml' });
					if ('msSaveOrOpenBlob' in navigator) {
						navigator.msSaveOrOpenBlob(textFileAsBlob, fileName);
					} else {
						var downloadLink = document.createElement('a');
						downloadLink.download = fileName;
						downloadLink.innerHTML = 'Download File';
						if ('webkitURL' in window) {
							// Chrome allows the link to be clicked without actually adding it to the DOM.
							downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
						} else {
							// Firefox requires the link to be added to the DOM before it can be clicked.
							downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
							downloadLink.onclick = destroyClickedElement;
							downloadLink.style.display = 'none';
							document.body.appendChild(downloadLink);
						}
						downloadLink.click();
					}
				}
			} else {
				alert('Your browser does not support the HTML5 Blob.');
			}
		};
	}
};

document.addEventListener('DOMContentLoaded', main.start);