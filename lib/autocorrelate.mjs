export default class Autocorrelate {

	constructor (sampleRate, timeWindow, chunkSize) {
		this.sampleRate = sampleRate;
		this.chunkSize = chunkSize;
		const minSamplesNeeded = Math.ceil(sampleRate * timeWindow);
		const chunksNeeded = Math.ceil(minSamplesNeeded / chunkSize);
		this.chunks = new Array(chunksNeeded);
	}

	addData(newChunk) {
		if (newChunk.length != this.chunkSize)
			throw `newChunk.length is ${newChunk.length}, but it must be ${this.chunkSize}`;
		this.chunks.shift();
		this.chunks.push(newChunk);
	}

	frequencyToLag(frequency) { return Autocorrelate.frequencyToLag(frequency, this.sampleRate); }
	lagToFrequency(lag)       { return Autocorrelate.lagToFrequency(lag, this.sampleRate); }

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
