import Music from './music.mjs';
import NoteTracker from './noteTracker.mjs';

function autocorrelate(data, sampleRate, minLag, maxLag, windowSeconds) {
	const acValues = new Array(maxLag - minLag + 1);

	const window = Math.min(windowSeconds * sampleRate, data.length);

	let maxValue = 0;
	let frequencyAtMaxValue;

	for (let lag = minLag ; lag <= maxLag ; ++lag) {
		const frequency = sampleRate / lag;
		let accum = 0;
		let count = 0;
		for (let j = 0 ; j < window - 1; ++j) {
			accum += (data[j] / 128.0 - 1) * (data[j+lag] / 128.0 - 1);
			++count;
		}
		const value = accum / count;
		acValues[lag - minLag] = [frequency, count ? value : 0];
		if (value > maxValue) {
			maxValue = value;
			frequencyAtMaxValue = frequency;
		}
	}

	acValues.fundamental = frequencyAtMaxValue;
	return acValues;
};

export default class NoteListener {

	constructor(audioStream, callback) {
		const AudioContext = window.AudioContext || window.webkitAudioContext;

		this.sampleRate = 48000;
		const audioContext = new AudioContext( {sampleRate: this.sampleRate} );
		const micStream = audioContext.createMediaStreamSource(audioStream);

		this.analyser = audioContext.createAnalyser();
		this.analyser.fftSize = 8192;
		this.analyser.smoothingTimeConstant = 0.3;

		// build the graph
		micStream.connect(this.analyser);

		this.fftData = new Uint8Array(this.analyser.frequencyBinCount);
		this.timeDomainData = new Uint8Array(this.analyser.fftSize);

		this.noteTracker = new NoteTracker(20, 10);

		this.callback = callback;
		this.start();
	}

	start () {
		this.running = true;
		window.requestAnimationFrame( this.tick.bind(this) );
	}

	stop () {
		this.running = false;
	}

	tick () {
		if (this.running) {
			this.analyser.getByteTimeDomainData(this.timeDomainData);

			const maxAmplitude = Math.max(...this.timeDomainData);

			if (maxAmplitude < 32) {
				this.NoteTracker.clear();
				this.callback(null);
			}
			else {
				const minLag = Math.floor(this.sampleRate / Music.Note.highest.frequency * 3 / 2);
				const maxLag = Math.ceil(this.sampleRate / (Music.Note.lowest.frequency * 2 / 3));
				const windowSeconds = 0.1;

				const acValues = autocorrelate(this.timeDomainData, this.sampleRate, minLag, maxLag, windowSeconds);

				let noteIndex;
				try {
					noteIndex = Music.Note.indexFromFrequency(acValues.fundamental);
				}
				catch (err) {
				}

				if (noteIndex) console.log(`Note: ${noteIndex},   Current: ${this.noteTracker.currentIndex}`);
				this.callback(this.noteTracker.log(noteIndex));
			}

			window.requestAnimationFrame( this.tick.bind(this) );
		}
	}

}
