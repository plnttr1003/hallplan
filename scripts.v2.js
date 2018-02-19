var data = {
	const: {
		seatDelta: 2 // количество кресел между рядами
	},
	levelName: '',
	subLevelName: null,
	subLevelClass: null,
	betweenPlaces: [],
	coordinates: {x:[], y:[]},
	seatSize: 0,
	seatsByLevel: [],
	sectors: {}
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
			//console.log('Level id', level.name, level.id, '\n------------------------------------------');
			//console.log('\n------------------------------------------');
			//console.log('seatsByLevel', main.seatsByLevel(level));
			//console.log('\n\n\n');
			data.levelName = level.name;
			data.seatsByLevel = main.seatsByLevel(level);
			if (data.seatsByLevel) {
				data.seatsByLevel.forEach(function(seats) {
					main.pushSectorPoints(seats);
				});
				data.seatSize = Math.min.apply(null, data.betweenPlaces);
				main.setViewPortSize();
				var k = 1;
				data.seatsByLevel.forEach(function(seats) {
					//console.log('SEATS ===', data.seatsByLevel);
					main.drawPath(seats, el.colors[i % el.colors.length]);
					main.drawUses(seats, el.colors[i % el.colors.length]);
					//main.groupPathsBySectors(); Объединить по секторам
					// Нужно будет каждую линию отофсеттить на ширину data.betweenPlaces.
					// Разбить на блоки секторов. И посеторно сгруппировать
				});
				//main.drawVerticalPaths(data.seatsByLevel); // по-старому
			}
		});
		main.drawOutlines();
		main.downloadSvg();
	},
	setViewPortSize: function() {
		el.svg.setAttribute('viewBox', `${(Math.min.apply(null, data.coordinates.x) - data.seatSize)} ${(Math.min.apply(null, data.coordinates.y) - data.seatSize)} ${Math.max.apply(null, data.coordinates.x)} ${Math.max.apply(null, data.coordinates.y)}`);
	},
	pushSectorPoints(points) {
		points.forEach(function(point, i) {
			if (i > 0) {
				data.tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
				data.tempPath.setAttribute('d', `M ${points[i-1][0]} ${points[i-1][1]} L ${point[0]} ${point[1]}`);
				data.betweenPlaces.push(data.tempPath.getTotalLength());
			}
			data.coordinates.x.push(point[0]);
			data.coordinates.y.push(point[1]);
		});
	},
	seatsByLevel: function(level) {
		var levelSeats = [];
		if (level.rows) {
			level.rows.forEach(function(row) {
				var rowSeats = [];
				row.seats.forEach(function(seat, i) {
					rowSeats.push([seat.x, seat.y]);
				});
				levelSeats.push(rowSeats);
			});
			return levelSeats;
		} else {
			return false;
		}
	},
	createPath: function(points, moveTo, array, fn) { // создаем пути. Аргументы -- массив точек и флаг moveTo -- разрыв или целая линия
		//console.log('moveTo', moveTo);
		var index = 0;
		var path = '';
		if (!fn) {
			var pathArr = [];
			var plus = false;
			moveTo.map(function(status, i) {
				if (status) {
					path += `${plus ? '' : 'M ' + points[i][0] + ' ' + points[i][1]} L ${points[i + 1][0]} ${points[i + 1][1]}`;
					plus = true;
				} else {
					index += 1;
					path += `M ${points[plus ? i + 1 : i][0]} ${points[plus ? i + 1 : i][1]} L ${points[plus ? i + 1 : i][0]} ${points[plus ? i + 1 : i][1]}`;
					plus = false;
				}
			});
			pathArr = path.split('M ').slice(1).map(function(item) {
				return 'M ' + item;
			});
		} else if (fn) {
			points.forEach(function(point, i){
				path += `${i === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`;
			});
		}
		return array ? pathArr : path;
	},
	drawPath: function(points, color, fn) {
		var paths = [];
		var moveTo = [];
		if (Array.isArray(points)) {
			var pathArr = [];
			points.forEach(function(point, i) {
				if (i < points.length - 1) {
					data.tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
					data.tempPath.setAttribute('d', `M ${point[0]} ${point[1]} L ${points[i + 1][0]} ${points[i + 1][1]}`);
					moveTo.push(data.tempPath.getTotalLength() < data.seatSize * data.const.seatDelta); // заполняем для проверки статуса
				}
				pathArr.push(point);
			});
			if (!fn) {
				paths = main.createPath(pathArr, moveTo, true, fn);
			} else {
				paths.push(main.createPath(pathArr, moveTo, false, fn));
			}
		} else {
			paths.push(points);
		}
		if (fn) {
			paths.forEach(function(path){
				main.renderPath(path, color, fn);
			})
		} else {
			main.combinePaths(paths);
		}
	},
	combinePaths: function(paths) {
		if (!data.sectors[data.levelName]) {
			data.sectors[data.levelName] = {};
		}
		if (!data.sectors[data.levelName][paths.length]) {
			data.sectors[data.levelName][paths.length] = {};
		}
		paths.forEach(function(path, i) {
			if (!data.sectors[data.levelName][paths.length][i]) {
				data.sectors[data.levelName][paths.length][i] = {paths:[]}
			}
			data.sectors[data.levelName][paths.length][i].paths.push(path);
		});
	},
	drawOutlines: function() {
		//console.log('data.sectors', data.sectors);
		Object.keys(data.sectors).forEach(function(sector) {
			Object.keys(data.sectors[sector]).forEach(function(group) {
				console.log('group Keys', Object.keys(data.sectors[sector]));
				Object.keys(data.sectors[sector][group]).forEach(function(rows, i) {
					var groupPath = [];
					console.log('SECTOR ===', sector, group, rows, data.sectors[sector][group][rows].paths)
					data.sectors[sector][group][rows].paths.forEach(function(path) {
						//main.renderPath(path, el.colors[i % el.colors.length]);
						groupPath.push(path.replace(/M /g, '').split(' L ').map(function(item) {
							return item.split(' ').map(function(point) {
								return +point;
							})
						}));
					});
					data.subLevelProps = `${sector} ${group} ${rows}`;
					data.subLevelClass = `${sector} ${group}`;
					main.drawVerticalPaths(groupPath, i);
				});
			});
		});
	},
	renderPath: function(path, color, fn) {
		var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		pathEl.setAttribute('d', path);
		pathEl.setAttribute('level-name', data.subLevelName ? data.subLevelName : data.levelName);
		if (data.subLevelClass) {
			pathEl.setAttribute('level-group-name', data.subLevelClass)
		}
		if (color) {
			pathEl.setAttribute('style', `fill:none; stroke: ${color};`);
		}
		//if (!fn) {
			el.svg.appendChild(pathEl);
		//}
		if (fn) {
			fn(pathEl);
		}
	},
	drawVerticalPaths: function(rows, index, name) {
		//console.log('drawVerticalPaths2 ===', rows);
		var topPath = [];
		var rightPath = [];
		var bottomPath = [];
		var leftPath = [];
		var color = el.colors[index % el.colors.length];
		rows.forEach(function(seats, k) {
			seats.forEach(function(seat, i) {

				//console.log('SEATS LENGTH', seats.length);
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
		//main.drawPath(topPath.concat(rightPath, bottomPath.reverse(), leftPath.reverse()), '#f00', main.offset);

		main.drawPath(topPath, color, main.offset);
		main.drawPath(bottomPath, color, main.offset);
		main.drawPath(leftPath, color, main.offset);
		main.drawPath(rightPath, color, main.offset);
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
							downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
						} else {
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