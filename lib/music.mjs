function parseNoteName(name) {
	if (name.length < 2 || 3 < name.length)
		throw `"${name} is the wrong length to be a note name. Valid note names are 2 or 3 characters long.`;

	const pitchClass = name[0].toUpperCase();
	if (pitchClass < 'A' || 'G' < pitchClass)
		throw `"${name[0]}" is not a valid pitch class in note name "${name}".`;

	const accidental = (name[1] == '#' || name[1] == '♭') ? name[1] : ((name[1] == 'b') ? '♭' : '');

	const octavePosition = (accidental == '') ? 1 : 2;
	const octave = parseInt(name[octavePosition], 10);
	if (name.length != octavePosition + 1 || isNaN(octave))
		throw `Invalid accidental or octave in note name "${name}"`;

	return {pitchClass: pitchClass,
					accidental: accidental,
					octave: octave
				 };
}

// A "note index" is a count of semitones above "C♭0".
// So "C0" has an index of 1, middle C ("C4") has an index of 49,
// and the highest note representable, "B#9", has an index of 121.

const indexPitchClass = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const pitchClassIndex = {'C': 1,
												 'D': 3,
												 'E': 5,
												 'F': 6,
												 'G': 8,
												 'A': 10,
												 'B': 12
												};

const accidentalIndex = {'♭': -1,
												 '': 0,
												 '#': 1
												};

function getNoteIndex(pitchClass, accidental, octave) {
	const pitchIndex = pitchClassIndex[pitchClass] + accidentalIndex[accidental];
	return (octave * 12) + pitchIndex;
}

const concertANoteIndex = getNoteIndex('A', '', 4);
const concertAFrequency = 440.0;

function getFrequency(noteIndex) {
	return concertAFrequency * Math.pow(2, (noteIndex - concertANoteIndex) / 12);
}

class Note {
	constructor(nameOrIndex) {
		if (Number.isInteger(nameOrIndex)) {
			if (nameOrIndex < 0 || Note.highest.noteIndex < nameOrIndex)
				throw `${nameOrIndex} is not a valid note index. Note indices must be in the range 0 to ${Note.highest.noteIndex}`;
			else if (nameOrIndex == 0)
				return Note.lowest;
			else if (nameOrIndex == Note.highest.noteIndex)
				return Note.highest;
			else {
				const index = nameOrIndex - 1;
				const pitch = indexPitchClass[index % 12];
				this.pitchClass = pitch[0];
				this.accidental = pitch[1] || '';
				this.octave = Math.floor(index / 12);

				this.name = pitch + this.octave;
				this.noteIndex = nameOrIndex;
				this.frequency = getFrequency(this.noteIndex);
			}
		} else {
			const parsedName = parseNoteName(nameOrIndex);
			this.pitchClass = parsedName.pitchClass;
			this.accidental = parsedName.accidental;
			this.octave = parsedName.octave;

			this.name = this.pitchClass + this.accidental + this.octave;
			this.noteIndex = getNoteIndex(this.pitchClass, this.accidental, this.octave);
			this.frequency = getFrequency(this.noteIndex);
		}
	}

	valueOf() {
		return this.noteIndex;
	}
}

Note.middleC = new Note('C4');
Note.concertA = new Note('A4');
Note.lowest = new Note('C♭0');
Note.highest = new Note('B#9');

class Staff {
	constructor (clef, referenceNote, clefStaffLine) {
		this.clef = clef;
		this.referenceNote = referenceNote;
		this.clefStaffLine = clefStaffLine;

		//TODO: NEXT: implement this calc...
		//this.bottomLineNote = /* calculate referenceNote moved down by clefStaffLine lines */
	}
}

class TrebleStaff extends Staff {
	constructor () {
		super('gClef', new Note('G4'), 1);
	}
}

class BassStaff extends Staff {
	constructor () {
		super('fClef', new Note('F3'), 3);
	}
}

// export classes wrapped in a "Music" namespace

const Music = {
	Note: Note,
	
	Staff: Staff,
	TrebleStaff: TrebleStaff,
	BassStaff: BassStaff
};

export default Music;

















