function pow2Ceil(x) {
		return Math.pow(2, Math.ceil(Math.log(x) / Math.log(2)));
}

export default class Autocorrelate {

	constructor (sampleRate, timeWindow, chunkSize) {
		this._sampleRate = sampleRate;
		this._chunkSize = chunkSize;

		const minSamplesNeeded = Math.ceil(sampleRate * timeWindow);
		this._signalLength = pow2Ceil(minSamplesNeeded);
		this._maxPossibleLag = Math.floor(this._signalLength / 2);

		tf.tidy('Autocorrelate: init', () => {
			this._signalVar = tf.variable(tf.zeros([this._signalLength]), false, 'signal');
		});
	}

	clear() {
		tf.tidy('Autocorrelate: clear', () => {
			this._signalVar.assign(tf.zeros([this._signalLength]));
		});
	}

	addData(newChunk) {
		if (newChunk.length != this._chunkSize)
			throw `newChunk.length is ${newChunk.length}, but it must be ${this._chunkSize}`;
		tf.tidy('Autocorrelate: addData', () => {
			this._signalVar.assign(this._signalVar.slice(newChunk.length).concat(tf.tensor1d(newChunk)));
		});
	}

	isReady() {
		//TODO: implement, or remove from API
		if ( ! this._isReadyToDoWarend) {
			this._isReadyToDoWarend = true;
			console.log('Autocorrelate.isReady(): TODO: implement, or remove from API');
		}
		return true;
	}

	async calcCorrelation() {
		if ( ! this.isReady() )
			return undefined;

		const [tCorrelation, tScale] = tf.tidy('Autocorrelate: calc correlation', () => {
			const maxLag = this._maxPossibleLag;
			const tLagged = this._signalVar.slice(0, this._signalLength - maxLag);

			const tData = this._signalVar.reshape([1, this._signalLength, 1]);
			const tKernel = tLagged.reshape([this._signalLength - maxLag, 1, 1]);

			const tConvolution = tData.conv1d(tKernel, 1, 'valid').squeeze();
			const tScale = tConvolution.abs().max();

			return [tConvolution, tScale];
		});

		const correlation = await tCorrelation.data();
		const scale = (await tScale.data())[0];
		tCorrelation.dispose();
		tScale.dispose();

		return [correlation, scale];
	}

	frequencyToLag(frequency) { return Autocorrelate.frequencyToLag(frequency, this._sampleRate); }
	lagToFrequency(lag)       { return Autocorrelate.lagToFrequency(lag, this._sampleRate); }

	// static helper methods

	static frequencyToLag(frequency, sampleRate) { return sampleRate / frequency; }
	static lagToFrequency(lag, sampleRate)       { return sampleRate / lag; }

	/*
		For a given lag, τ, each autocorrelation pair product is x[t] × x[t + τ].

		To correlate at least 1 period for a given lag, we want to sum
		the pair products from x[0] × x[0 + τ] up to x[τ-1] to x[τ-1 + τ],
		so we would need 2τ samples.

		In general, to correlate at least P periods of the lowest frequency, f_min,
		we have τ = frequencyToLag(f_min), and we need (P + 1)τ samples.
	*/
	static samplesNeeded(periods, minFrequency, sampleRate) {
		return Math.ceil((periods + 1) * this.frequencyToLag(minFrequency, sampleRate));
	}

}
