var spo = require('svg-path-outline');

var data = {
	const: {
		seatDelta: 2
	},
	levelName: '',
	betweenPlaces: [],
	seatSize: 0,
	seatsByLevel: []
}

var el = {
	svg: document.getElementById('svg'),
	colors: ['#7549af', '#99ff66', '#cc33cc', '#667699', '#330099', '#cc9900', '#cc0099', '#3399cc', '#7589af', '#34ffb6', '#1d54cc', '#9bf769', '#abcd99', '#c69750', '#cdfe49', '#3f3d2c']
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

				//console.log('colors I ===', i, el.colors[i], i % el.colors.length);

				main.drawPath(seats, el.colors[i]);
				main.drawUses(seats, el.colors[i]);
				main.setNumbers();
				//main.dividePaths(); Разделить пути на части
				//main.groupPathsBySectors(); Объединить по секторам
				// Нужно будет каждую линию отофсеттить на ширину data.betweenPlaces.
				// Разбить на блоки секторов. И посеторно сгруппировать
			});
			//main.drawVerticalPaths(data.seatsByLevel);
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
	createPath: function(points, moveTo) { // создаем пути. Аргументы -- массив точек и флаг moveTo -- разрыв или целая линия
		var path = '';
		var plus = false;
		moveTo.map(function(status, i) {
			if (status) {
				path += `M ${points[i][0]} ${points[i][1]} L ${points[i + 1][0]} ${points[i + 1][1]}`;
				plus = true;
			} else {
				path += `M ${points[plus ? i + 1 : i][0]} ${points[plus ? i + 1 : i][1]} L ${points[plus ? i + 1 : i][0]} ${points[plus ? i + 1 : i][1]}`;
				plus = false;
			}
		});
		return path;
	},
	drawPath: function(points, color, fn) {
		var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		var path;
		var moveTo = [];
		if (Array.isArray(points)) {
			path = [];
			points.forEach(function(point, i) {
				if (i < points.length - 1) {
					data.tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
					data.tempPath.setAttribute('d', `M ${point[0]} ${point[1]} L ${points[i + 1][0]} ${points[i + 1][1]}`);
					moveTo.push(data.tempPath.getTotalLength() < data.seatSize * data.const.seatDelta);
				}
				path.push(point);
				//path += `${i === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`;
			});
		} else {
			path = points;
		}
		pathEl.setAttribute('d', main.createPath(path, moveTo));
		pathEl.setAttribute('level-name', data.levelName);
		if (color) {
			pathEl.setAttribute('style', `fill:none; stroke: ${color};`);
		}
		//if (!fn) {
			el.svg.appendChild(pathEl);
		//}
		if (fn) {
			//console.log('>>>', fn, pathEl);
			fn(pathEl);
		}
	},
	setNumbers: function() {

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