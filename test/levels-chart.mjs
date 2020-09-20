function clear(canvas) {
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;

	canvas.getContext('2d').clearRect(0, 0, canvas.width , canvas.height);
}

const drawHorizontalLine = (canvas, value, color) => {
	const ctx = canvas.getContext('2d');
	ctx.strokeStyle = color;

	const y = ctx.canvas.height - (ctx.canvas.height * value);

	ctx.beginPath();
	ctx.moveTo(0, y);
	ctx.lineTo(ctx.canvas.width, y);
	ctx.stroke();
};

function calcPlotDetails(canvas, data, yScale = 1, yOffset = 0) {
	let x, startTime;
	if (canvas.width > data.length) {
		// stretch the data to fit the canvas
		const scale = canvas.width / data.length;
		startTime = 0;
		x = (t) => t * scale;
	}
	else {
		// fit in the most recent data without stretching
		startTime = data.length - canvas.width;
		x = (t) => t - startTime;
	}

	const y = (datum) => canvas.height - (canvas.height * (yOffset + (yScale * datum)));

	return {
		canvas: canvas,
		startTime: startTime,
		x: x,
		y: y
	};
}

function plotLine(plot, data, color) {
	const ctx = plot.canvas.getContext('2d');

	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.moveTo(plot.x(plot.startTime), plot.y(data[plot.startTime]));

	for (let t = plot.startTime + 1 ; t < data.length ; ++t)
		ctx.lineTo(plot.x(t), plot.y(data[t]));

	ctx.stroke();
}

function plotSoundDetected(plot, settings, data, color) {
	const ctx = plot.canvas.getContext('2d');

	let soundBlocks = [];
	let soundStart = false;

	for (let t = plot.startTime ; t < data.length ; ++t) {
		if (!soundStart && data[t] >= settings.soundTrigger)
			soundStart = t;
		else if (soundStart && data[t] < settings.soundRelease) {
			soundBlocks.push([soundStart, t]);
			soundStart = null;
		}
	}

	if (soundStart)
		soundBlocks.push([soundStart, data.length]);

	ctx.fillStyle = color;
	for (var block of soundBlocks)
		ctx.fillRect(plot.x(block[0]), plot.y(1),
								 plot.x(block[1]) - plot.x(block[0]), plot.y(0));
}

export function plotLevelsChart (canvas, settings, seriesCollection) {
	clear(canvas);

	const width = canvas.width;
	const height = canvas.height;
	const ctx = canvas.getContext('2d');
	const baseData = seriesCollection[0][0];
	const plot = calcPlotDetails(canvas, baseData);

	plotSoundDetected(plot, settings, baseData, 'pink');

	// draw tick lines
	for (let i = 1 ; i < 10 ; ++i)
		drawHorizontalLine(canvas, i / 10, (i == 5) ? 'grey' : 'lightGrey');

	drawHorizontalLine(canvas, settings.soundTrigger, 'blue');
	drawHorizontalLine(canvas, settings.soundRelease, 'purple');

	for (let series of seriesCollection)
		plotLine(plot, series[0], series[1]);
}

export function plotCorrelationChart (canvas, settings, correlation, color) {
	clear(canvas);

	const width = canvas.width;
	const height = canvas.height;
	const ctx = canvas.getContext('2d');
	const plot = calcPlotDetails(canvas, correlation, correlation[0] ? (0.5 / correlation[0]) : 1, 0.5);

	// draw tick lines
	for (let i = 1 ; i < 10 ; ++i)
		drawHorizontalLine(canvas, i / 10, (i == 5) ? 'grey' : 'lightGrey');

	plotLine(plot, correlation, color);
}
