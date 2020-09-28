import Debug from '../lib/debug.mjs';
import Music from '../lib/music.mjs';
import StaffCanvas from '../lib/staffCanvas.mjs';
import NoteListener from '../lib/noteListener.mjs';
import Autocorrelate from '../lib/autocorrelate.mjs';

import {plotLevelsChart, plotCorrelationChart} from './levels-chart.mjs';

const dbg = window.dbg = new Debug();
dbg.Music = Music;
dbg.Autocorrelate = Autocorrelate;

class TestSession {

	constructor (audioStream, settings, levelsCanvas, autocorrelationCanvas) {
		dbg.log('Starting test');

		this.settings = settings;

		this.levelsCanvas = levelsCanvas;
		this.autocorrelationCanvas = autocorrelationCanvas;

		const AudioContext = window.AudioContext || window.webkitAudioContext;

		this.audioContext = new AudioContext( {sampleRate: settings.sampleRate} );
		this.micStream = this.audioContext.createMediaStreamSource(audioStream);
		this.audioProcessor = this.audioContext.createScriptProcessor(1024, 1, 1);
		this.micStream.connect(this.audioProcessor);
		this.audioProcessor.connect(this.audioContext.destination);

		this.levelsData = new Array(settings.chunkSize);
		this.levelsMeanData = new Array(this.levelsData.length);
		this.levelsRMSData = new Array(this.levelsData.length);

		this.autocorrelate = new Autocorrelate(settings.sampleRate, settings.timeWindow, settings.chunkSize);

		this.isSoundDetected = false;

		this.audioProcessor.onaudioprocess = this.onAudioProcess.bind(this);

		window.requestAnimationFrame(this.onAnimFrame.bind(this));
	}

	setSoundDetection(trigger, release) {
		this.settings.soundTrigger = trigger;
		this.settings.soundRelease = release;
	}

	processLevels(data) {
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

		if ( max >= this.settings.soundTrigger)
			this.isSoundDetected = true;
		else if ( max < this.settings.soundRelease)
			this.isSoundDetected = false;
	}

	processAutocorrelation(data) {
		this.autocorrelate.addData(data);
	}

	onAudioProcess(event) {
		const data = event.inputBuffer.getChannelData(0);

		// conditionally, copy to output
		const output = event.outputBuffer.getChannelData(0);
		if (this.settings.localEcho) {
			for (let i = 0 ; i < data.length ; ++i)
				output[i] = data[i];
		}
		else
			output.fill(0);

		this.processLevels(data);
		this.processAutocorrelation(data);
	}

	onAnimFrame() {
		plotLevelsChart(this.levelsCanvas,
										this.settings,
										[[this.levelsData, 'black'],
										 [this.levelsRMSData, 'red'],
										 [this.levelsMeanData, 'green']]);

		if (this.isSoundDetected && this.autocorrelate.isReady()) {
			const [correlation, scale] = this.autocorrelate.calcCorrelation(
				Math.floor(this.autocorrelate.frequencyToLag(Music.Note.highest.frequency)),
				Math.ceil(this.autocorrelate.frequencyToLag(Music.Note.lowest.frequency))
				);
			dbg.correlation = correlation;
			dbg.correlationScale = scale;

			plotCorrelationChart(this.autocorrelationCanvas,
													 this.settings,
													 correlation, 'black',
													 scale);
		}

		window.requestAnimationFrame(this.onAnimFrame.bind(this));
	}

}

$( () => {
	dbg.setLogContainer($('#log'));

	function startTest(audioStream, settings) {
		$('#start').prop('disabled', true);

		settings.localEcho = $('#localEcho')[0].checked;

		const testSession = new TestSession(audioStream, settings, $('#levels')[0], $('#autocorrelation')[0]);
		dbg.test = testSession;

		$('#settings').on('change', '#localEcho', function () {
			testSession.settings.localEcho = this.checked;
		});

		$('#soundRange').on('slide', function (event, ui) {
			testSession.setSoundDetection(ui.values[1] / 100, ui.values[0] / 100);
		});

	}

	function onStart(settings) {
		dbg.log('Requesting audio');

		navigator.mediaDevices.getUserMedia( {audio: true} )
			.then( (audioStream) => startTest(audioStream, settings) )
			.catch( (error) => dbg.error('getUserMedia/startTest error: ' + error) );
	}

	function init() {
		const sampleRate = 48000;
		const autoCorrelateMinPeriods = 3;
		const samplesNeeded = Autocorrelate.samplesNeeded(autoCorrelateMinPeriods,
																											Music.Note.lowest.frequency,
																											sampleRate);
		const timeWindow = samplesNeeded / sampleRate;

		dbg.log(`${samplesNeeded} samples needed to autocorrelate ${autoCorrelateMinPeriods} periods`);
		dbg.log(`Autocorrelate window needed = ${timeWindow.toFixed(2)} seconds`);

		const settings = {
			sampleRate: sampleRate,
			timeWindow: timeWindow,
			chunkSize: 1024,
			localEcho: false,
			soundTrigger: 0.2,
			soundRelease: 0.1,
		};

		$('#start')
			.click( () => onStart(settings) )
			.prop('disabled', false);

		$('#soundRelease').text(settings.soundRelease * 100);
		$('#soundTrigger').text(settings.soundTrigger * 100);
		$('#soundRange')
			.slider({
				range: true,
				min: 0,
				max: 100,
				values: [settings.soundRelease * 100, settings.soundTrigger * 100],
				slide: function(event, ui) {
					$('#soundRelease').text(ui.values[0]);
					$('#soundTrigger').text(ui.values[1]);
				}
			});
	}

	document.fonts.load('40pt Bravura').then(init);

});
