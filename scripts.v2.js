var data = {
	const: {
		seatDelta: 2, // количество кресел между рядами
		offset: 10
	},
	levelName: '',
	subLevelName: null,
	subLevelClass: null,
	betweenPlaces: [],
	coordinates: {x:[], y:[]},
	seatSize: 0,
	seatsByLevel: [],
	sectors: {},
	tempSector: {
		rowLength: null,
		count: -1 // временная переменная-счетчик для сохранения количества сегментов
	}
};

var el = {
	svg: document.getElementById('svg'),
	colors: ['#7549af', '#99ff66', '#cc33cc', '#667699', '#330099', '#cc9900', '#cc0099', '#3399cc', '#7589af', '#34ffb6', '#1d54cc', '#9bf769', '#abcd99', '#c69750', '#cdfe49', '#3f3d2c']
};

// offset(smooth, distance);
// checkDelta() // для проверки Z - секторов и группировки в новые ряды
// setNumber() // на проделенной на одно место линии 1 < --------- > 1

var main = {
	start: function() {
		//console.log(hallplan);
		hallplan.levels.forEach(function(level, i) {
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
					main.drawPath(seats, el.colors[i % el.colors.length], {fn:null, option:'combine'}); // сейчас нужна для формирования массива с секторами через main.drawPath() -- main.combine() см. параметры0
					main.drawUses(seats, el.colors[i % el.colors.length]);
				});
			}
		});
		main.drawOutlines();
		u.downloadSvg();
	},
	setViewPortSize: function() {
		el.svg.setAttribute('viewBox', `${(Math.min.apply(null, data.coordinates.x) - data.seatSize)} ${(Math.min.apply(null, data.coordinates.y) - data.seatSize)} ${Math.max.apply(null, data.coordinates.x)} ${Math.max.apply(null, data.coordinates.y)}`);
	},
	pushSectorPoints: function(points) {
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
		var path = '';
		if (!fn) {
			var pathArr = [];
			var plus = false;
			moveTo.map(function(status, i) {
				if (status) {
					//console.log(plus ? '' : (`${points[i]} ${points[i + 1]}`));
					path += `${plus ? '' : 'M ' + points[i][0] + ' ' + points[i][1]} L ${points[i + 1][0]} ${points[i + 1][1]}`;
					plus = true;
				} else {
					//console.log(points[plus ? i + 1 : i]);
					path += `M ${points[plus ? i + 1 : i][0]} ${points[plus ? i + 1 : i][1]} L ${points[plus ? i + 1 : i][0]} ${points[plus ? i + 1 : i][1]}`;
					plus = false;
				}
			});
			pathArr = path.split('M ').slice(1).map(function(item) {
				return 'M ' + item;
			});
		} else if (fn) {
			points.forEach(function(point, i){
				path += `${i === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`; // ?????
			});
		}
		return array ? pathArr : path;
	},
	drawPath: function(points, color, params) {
		var paths = [];
		var moveTo = [];
		var fn = params && params.fn ? params.fn : null;
		var option = params && params.option ? params.option : null;
		if (Array.isArray(points)) {
			var pathArr = [];
			points.forEach(function(point, i) {
				if (i < points.length - 1) {
					data.tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
					data.tempPath.setAttribute('d', `M ${point[0]} ${point[1]} L ${points[i + 1][0]} ${points[i + 1][1]}`);
					if (!fn) {
						moveTo.push(data.tempPath.getTotalLength() < data.seatSize * data.const.seatDelta); // заполняем для проверки статуса
					}
				}
				pathArr.push(point);
			});
			if (!fn) {
				paths = main.createPath(pathArr, moveTo, true, fn);
			} else {
				paths.push(main.createPath(pathArr, [], false, fn));
			}
		} else {
			paths.push(points);
		}
		if (option === 'render') {
			paths.forEach(function(path){
				main.renderPath(path, color, fn);
			});
		} else if ((option === 'combine')) {
			main.combinePaths(paths); // собрать все пути в объект
		}
	},
	combinePaths: function(paths) {

		//
		// Группируем пути в блоки по количесту "проходов" между ними
		// Схема объекта такова [sector][sectorCount][sectorRow][sectorColumn].path
		// Используем [sectorRow][sectorColumn], чтобы группировались только соседние группы рядов.
		// Это позволяет избежать захвата сектора через группу с другим количеством "проходов"
		//

		if (data.levelName === 'Партер А') {
			console.log('PATHS ===', paths);
		}
		if (data.tempSector.count === -1 || data.tempSector.rowLength !== paths.length) {
			data.tempSector.count += 1;
			data.tempSector.rowLength = paths.length;
		}
		var prevPathsLength = null;
		if (!data.sectors[data.levelName]) {
			data.sectors[data.levelName] = {};
		}
		if (!data.sectors[data.levelName][data.tempSector.rowLength]) {
			data.sectors[data.levelName][data.tempSector.rowLength] = {};
		}
		paths.forEach(function(path, i) {
			if (!data.sectors[data.levelName][data.tempSector.rowLength][data.tempSector.count]) {
				data.sectors[data.levelName][data.tempSector.rowLength][data.tempSector.count] = {};
			};
			if (!data.sectors[data.levelName][data.tempSector.rowLength][data.tempSector.count][i]) {
				data.sectors[data.levelName][data.tempSector.rowLength][data.tempSector.count][i] = {paths:[]};
			};
			data.sectors[data.levelName][data.tempSector.rowLength][data.tempSector.count][i].paths.push(path);
		});
	},
	drawOutlines: function() {
		Object.keys(data.sectors).forEach(function(sector) {
			Object.keys(data.sectors[sector]).forEach(function(sectorRow) {
				//console.log('sectorRow Keys', Object.keys(data.sectors[sector]));
				Object.keys(data.sectors[sector][sectorRow]).forEach(function(sectorColumn) {
					//console.log('sectorColumn Keys', Object.keys(data.sectors[sector][sectorRow]));
					Object.keys(data.sectors[sector][sectorRow][sectorColumn]).forEach(function(rows, i) {
						var groupPath = [];
						//console.log('SECTOR ===', sector, sectorRow, sectorColumn, rows, data.sectors[sector][sectorRow][sectorColumn][rows].paths);
						data.sectors[sector][sectorRow][sectorColumn][rows].paths.forEach(function(path) {
							//main.renderPath(path, el.colors[i % el.colors.length]); // рендерим пути секторов
							//console.log('path', path);
							u.pathToPoints(path, groupPath);
							data.subLevelName = `${sector} ${sectorRow} ${sectorColumn} ${rows}`;
							data.subLevelClass = `${sector} ${sectorRow} ${sectorColumn}`;
						});
						console.log(sector, sectorRow);
						//if (sector === 'Партер А' && sectorRow === '1') main.drawVerticalPaths(groupPath, i);
						main.drawVerticalPaths(groupPath, i);
					});
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
			fn(path);  /// нужен ли колбек?
		}
	},
	drawVerticalPaths: function(rows, index, name) {

		console.log('///////////////////////');
		//console.log('rows', rows);
		//console.log('rows.length - 1', rows.length - 1);
		console.log('///////////////////////');

		var topPath = [];
		var rightPath = [];
		var bottomPath = [];
		var leftPath = [];
		var color = el.colors[index % el.colors.length];
		rows.forEach(function(seats, k) {
			seats.forEach(function(seat, i) {
				console.log(rows.length , rows.length - 1);
				console.log(seats.length, seats.length - 1, seat);

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
		console.log('topPath', topPath);
		console.log('bottomPath', bottomPath);
		console.log('leftPath', leftPath);
		console.log('rightPath', rightPath);

		main.drawPath(topPath.concat(rightPath, bottomPath.reverse(), leftPath.reverse()), color, {fn:main.offset, option:'render'});
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
		console.log('PATHHH', path);
		u.pathToPoints(path, offsetPath);
	}
};

document.addEventListener('DOMContentLoaded', main.start);