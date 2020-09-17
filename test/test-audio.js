import Debug from '../lib/debug.mjs';
import Music from '../lib/music.mjs';
import StaffCanvas from '../lib/staffCanvas.mjs';
import NoteListener from '../lib/noteListener.mjs';

const dbg = window.dbg = new Debug();
dbg.Music = Music;

class TestSession {

	constructor (audioStream, localEcho, levelsCanvas) {
		dbg.log('Starting test');

		this.levelsCanvas = levelsCanvas;
		this.localEcho = localEcho;

		const AudioContext = window.AudioContext || window.webkitAudioContext;

		this.sampleRate = 48000;
		this.audioContext = new AudioContext( {sampleRate: this.sampleRate} );
		this.micStream = this.audioContext.createMediaStreamSource(audioStream);
		this.audioProcessor = this.audioContext.createScriptProcessor(1024, 1, 1);
		this.micStream.connect(this.audioProcessor);
		this.audioProcessor.connect(this.audioContext.destination);

		this.levelsData = new Array(levelsCanvas.width());
		this.audioProcessor.onaudioprocess = this.onAudioProcess.bind(this);;
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

		const maxValue = Math.max(...data);
		this.levelsData.shift();
		this.levelsData.push(maxValue);
	}

}

$( () => {
	dbg.setLogContainer($('#log'));

	function startTest(audioStream) {
		$('#start').prop('disabled', true);

		const localEchoCheckBox = $('#localEcho');

		const testSession = new TestSession(audioStream, localEchoCheckBox[0].checked, $('#levels'));
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
