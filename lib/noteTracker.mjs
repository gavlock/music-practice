import Music from './music.mjs';
export default class NoteTracker {

	constructor(ringLength, threshold) {
		this._ringLength = ringLength;
		this._threshold = threshold;
		this.clear();
	}

	clear() {
		this.currentIndex = null;
		this.currentNote = null;
		this._ringBuffer = new Array(this.ringLength);
		this._ringIndex = 0;

		this._noteCount = new Map();
	}

	log(note) {
		this._increment(note);
		this._decrement(this._ringBuffer[this._ringIndex]);
		this._ringBuffer[this._ringIndex] = note;
		this._ringIndex = (this._ringIndex + 1) % this._ringLength;

		let maxCount = 0;
		let noteWithMaxCount;
		for (let [note, count] of this._noteCount) {
			if (count > maxCount) {
				maxCount = count;
				noteWithMaxCount = note;
			}
		}

		if (maxCount >= this._threshold) {
			if (this.currentIndex != noteWithMaxCount) {
				this.currentIndex = noteWithMaxCount;
				this.currentNote = new Music.Note(noteWithMaxCount);
			}
		}
		else {
			this.currentIndex = null;
			this.currentNote = null;
		}

		return this.currentNote;
	}

	_increment(note) {
		if (note) {
			const oldValue = this._noteCount.get(note) || 0;
			this._noteCount.set(note, oldValue + 1);
		}
	}

	_decrement(note) {
		if (note) {
			const oldValue = this._noteCount.get(note);
			if (oldValue && oldValue > 1)
				this._noteCount.set(note, oldValue - 1);
			else
				this._noteCount.delete(note);
		}
	}

}
