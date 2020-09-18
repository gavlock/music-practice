import Debug from '../lib/debug.mjs';
import Music from '../lib/music.mjs';
import StaffCanvas from '../lib/staffCanvas.mjs';
import NoteListener from '../lib/noteListener.mjs';

import plotLevelsChart from './levels-chart.mjs';

const dbg = window.dbg = new Debug();
dbg.Music = Music;

class TestSession {

	constructor (audioStream, settings, levelsCanvas) {
		dbg.log('Starting test');

		this.settings = settings;

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

	setSoundDetection(trigger, release) {
		this.settings.soundTrigger = trigger;
		this.settings.soundRelease = release;
	}

	onAudioProcess(event) {
		const data = event.inputBuffer.getChannelData(0);
		dbg.event = event;
		dbg.inputData = data;

		const output = event.outputBuffer.getChannelData(0);
		if (this.settings.localEcho) {
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

	onAnimFrame() {
		plotLevelsChart(this.levelsCanvas,
										this.settings,
										[[this.levelsData, 'black'],
										 [this.levelsRMSData, 'red'],
										 [this.levelsMeanData, 'green']]);
		window.requestAnimationFrame(this.onAnimFrame.bind(this));
	}

}

$( () => {
	dbg.setLogContainer($('#log'));

	function startTest(audioStream, settings) {
		$('#start').prop('disabled', true);

		const localEchoCheckBox = $('#localEcho');

		const testSession = new TestSession(audioStream, settings, $('#levels')[0]);
		dbg.Test = testSession;

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
			.catch( (error) => dbg.error('getUserMedia error: ' + error) );
	}

	function init() {
		const settings = {
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
