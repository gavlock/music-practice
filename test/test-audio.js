import Debug from '../lib/debug.mjs';
import Music from '../lib/music.mjs';
import StaffCanvas from '../lib/staffCanvas.mjs';
import NoteListener from '../lib/noteListener.mjs';

const dbg = window.dbg = new Debug();
dbg.Music = Music;

class TestSession {

	constructor (audioStream, localEcho, levelsCanvas) {
		dbg.log('Starting test');

		this.localEcho = localEcho;

		this.levelsCanvas = levelsCanvas;

		const AudioContext = window.AudioContext || window.webkitAudioContext;

		this.sampleRate = 48000;
		this.audioContext = new AudioContext( {sampleRate: this.sampleRate} );
		this.micStream = this.audioContext.createMediaStreamSource(audioStream);
		this.audioProcessor = this.audioContext.createScriptProcessor(1024, 1, 1);
		this.micStream.connect(this.audioProcessor);
		this.audioProcessor.connect(this.audioContext.destination);

		this.levelsData = new Array(1024);
		this.levelsMeanData = new Array(this.levelsData.length);
		this.levelsRMSData = new Array(this.levelsData.length);

		this.audioProcessor.onaudioprocess = this.onAudioProcess.bind(this);

		window.requestAnimationFrame(this.onAnimFrame.bind(this));
	}

	onAudioProcess(event) {
		const data = event.inputBuffer.getChannelData(0);
		dbg.event = event;
		dbg.inputData = data;

		const output = event.outputBuffer.getChannelData(0);
		if (this.localEcho) {
			for (let i = 0 ; i < data.length ; ++i)
				output[i] = data[i];
		}
		else
			output.fill(0);

		//const max = Math.max(...data);

		let max = 0;
		let sum = 0;
		let sumSquares = 0;
		for (let i = 0 ; i < data.length ; ++i) {
			const absVal = Math.abs(data[i]);
			max = Math.max(max, absVal);
			sum += absVal;
			sumSquares += (absVal * absVal);
		}

		this.levelsData.shift();
		this.levelsData.push(max);

		this.levelsMeanData.shift();
		this.levelsMeanData.push(sum / data.length);

		this.levelsRMSData.shift();
		this.levelsRMSData.push(Math.sqrt(sumSquares / data.length));
	}

	plotLevelsData(data, color) {
		const ctx = this.levelsCanvas.getContext('2d');
		const width = this.levelsCanvas.width;
		const height = this.levelsCanvas.height;

		let x, startTime;
		if (width > data.length) {
			// stretch the data to fit the canvas
			const scale = width / data.length;
			startTime = 0;
			x = (t) => t * scale;
		}
		else {
			// fit in the most recent data without stretching
			startTime = data.length - width;
			x = (t) => t - startTime;
		}

		const y = (datum) => height - (height * datum);

		ctx.strokeStyle = color;
		ctx.beginPath();
		ctx.moveTo(x(startTime), y(data[startTime]));

		for (let t = startTime + 1 ; t < data.length ; ++t)
			ctx.lineTo(x(t), y(data[t]));

		ctx.stroke();
	}

	onAnimFrame() {
		this.levelsCanvas.width = this.levelsCanvas.clientWidth;
		this.levelsCanvas.height = this.levelsCanvas.clientHeight;
		const ctx = this.levelsCanvas.getContext('2d');
		const width = this.levelsCanvas.width;
		const height = this.levelsCanvas.height;

		ctx.clearRect(0, 0, width , height);
		for (let i = 1 ; i < 10 ; ++i) {
			ctx.strokeStyle = (i == 5) ? 'grey' : 'lightGrey';
			const y = (height / 10) * i;
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.stroke();
		}
		this.plotLevelsData(this.levelsMeanData, 'green');
		this.plotLevelsData(this.levelsRMSData, 'red');
		this.plotLevelsData(this.levelsData, 'black');
		window.requestAnimationFrame(this.onAnimFrame.bind(this));
	}

}

$( () => {
	dbg.setLogContainer($('#log'));

	function startTest(audioStream) {
		$('#start').prop('disabled', true);

		const localEchoCheckBox = $('#localEcho');

		const testSession = new TestSession(audioStream, localEchoCheckBox[0].checked, $('#levels')[0]);
		dbg.Test = testSession;

		$('#settings').on('change', '#localEcho', function () {
			testSession.localEcho = this.checked;
		});
	}

	function onStart() {
		dbg.log('Requesting audio');

		navigator.mediaDevices.getUserMedia( {audio: true} )
			.then( (audioStream) => startTest(audioStream) )
			.catch( (error) => dbg.error('getUserMedia error: ' + error) );
	}

	function init() {
		$('#start')
			.click( onStart )
			.prop('disabled', false);
	}

	document.fonts.load('40pt Bravura').then(init);

});
