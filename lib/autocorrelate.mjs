export default class Autocorrelate {

	constructor (sampleRate, timeWindow, chunkSize) {
		this._sampleRate = sampleRate;
		this._chunkSize = chunkSize;
		const minSamplesNeeded = Math.ceil(sampleRate * timeWindow);
		const chunksNeeded = Math.ceil(minSamplesNeeded / chunkSize);
		this._chunks = new Array(chunksNeeded);
		this._dataLength = this._chunks.length * this._chunkSize;
		this._maxPossibleLag = Math.floor(this._dataLength / 2);
	}

	addData(newChunk) {
		if (newChunk.length != this._chunkSize)
			throw `newChunk.length is ${newChunk.length}, but it must be ${this._chunkSize}`;
		this._chunks.shift();
		this._chunks.push(newChunk);
	}

	clear() {
		this._chunks = new Array(this._chunks.length);
	}

	isReady() {
		return this._chunks[0] !== undefined;
	}

	_get(t) {
		const chunkIndex = Math.floor(t / this._chunkSize);
		const chunkOffset = t % this._chunkSize;
		return this._chunks[chunkIndex][chunkOffset];
	}

	calcCorrelation(minLag = 0, maxLag = this._maxPossibleLag) {
		if ( ! this.isReady() )
			return undefined;

		const correlation = new Array(maxLag - minLag + 1);

		for (let tau = minLag ; tau <= maxLag ; ++tau) {
			let sum = 0;
			for (let t = 0 ; t < this._dataLength - tau ; ++t)
				sum += this._get(t) * this._get(t + tau);
			correlation[tau] = sum;
		}

		return correlation;
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
