var u = {
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