var u = {
	pathToPoints: function(d, array) {
		//
		// в данный момент только для частного случая
		// если каждый отрезок линии отдельно
		// ex: M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z
		// такой не обработается M 0 0 L 100 0 100 100 0 100 0 0 Z
		//
		array.push(d.replace(/[M ][ Z]/g, '').split(' L ').map(function(item) { /// << подумать как вынести в функцию
			return item.split(' ').map(function(point) {
				return +point;
			})
		}));
	},
	downloadSvg: function() {
		// if (attr === el) -- innerHtml
		// else if (string) -- el
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