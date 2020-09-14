function parseAccidental(accidental) {
	if (accidental == '♭' || accidental == '♮' || accidental == '#')
		return accidental;
	else if (accidental == 'b')
		return '♭';
	else if (accidental == 'n')
		return '♮';
	else
		return '';
}

function parseNoteName(name) {
	if (name.length < 2 || 3 < name.length)
		throw `"${name} is the wrong length to be a note name. Valid note names are 2 or 3 characters long.`;

	const basePitch = name[0].toUpperCase();
	if (basePitch < 'A' || 'G' < basePitch)
		throw `"${name[0]}" is not a valid pitch class in note name "${name}".`;

	const accidental = parseAccidental(name[1]);

	const octavePosition = (accidental == '') ? 1 : 2;
	const octave = parseInt(name[octavePosition], 10);
	if (name.length != octavePosition + 1 || isNaN(octave))
		throw `Invalid accidental or octave in note name "${name}"`;

	return {basePitch: basePitch,
					accidental: accidental,
					octave: octave
				 };
}

// A "note index" is a count of semitones above "C♭0".
// So "C0" has an index of 1, middle C ("C4") has an index of 49,
// and the highest note representable, "B#9", has an index of 121.

const pitchNames = 'CDEFGAB';

const indexPitchClass = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const basePitchIndex = {'C': 1,
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

function getNoteIndex(basePitch, accidental, octave) {
	const pitchIndex = basePitchIndex[basePitch] + accidentalIndex[accidental];
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
				this.basePitch = pitch[0];
				this.accidental = pitch[1] || '';
				this.octave = Math.floor(index / 12);

				this.name = pitch + this.octave;
				this.noteIndex = nameOrIndex;
			}
		} else {
			const parsedName = parseNoteName(nameOrIndex);
			this.basePitch = parsedName.basePitch;
			this.accidental = parsedName.accidental;
			this.octave = parsedName.octave;

			this.name = this.basePitch + this.accidental + this.octave;
			this.noteIndex = getNoteIndex(this.basePitch, this.accidental, this.octave);
		}

		this.frequency = getFrequency(this.noteIndex);
		this.staffIndex = pitchNames.indexOf(this.basePitch) + (pitchNames.length * this.octave);
	}

	valueOf() {
		return this.noteIndex;
	}
}

Note.middleC = new Note('C4');
Note.concertA = new Note('A4');
Note.lowest = new Note('C♭0');
Note.highest = new Note('B#9');

function shiftNoteByStaffSteps(note, staffSteps) {
	const pitchIndex = pitchNames.indexOf(note.basePitch);

	let shiftedIndex = pitchIndex + staffSteps;
	let shiftedOctave = note.octave;

	while (shiftedIndex < 0) {
		shiftedIndex += pitchNames.length;
		--shiftedOctave;
	}
		
	while (shiftedIndex > pitchNames.length) {
		shiftedIndex -= pitchNames.length;
		++shiftedOctave;
	}

	return new Note(pitchNames[shiftedIndex] + note.accidental + shiftedOctave);
}

function noteFromNoteOrName(noteOrName) {
	if (noteOrName instanceof Note)
		return noteOrName;
	else
		return new Note(noteOrName);
}

class Staff {
	constructor (clef, referenceNote, clefStaffLine) {
		this.clef = clef;
		this.referenceNote = referenceNote;
		this.clefStaffLine = clefStaffLine;

		// 1 staff line is 2 staff steps, because
		// because staff steps also count the spaces between the lines.
		this.bottomLineNote = shiftNoteByStaffSteps(referenceNote, -(2 * clefStaffLine));

		this.notes = new Array();
	}

	addNote(noteOrName) {
		this.notes.push(noteFromNoteOrName(noteOrName));
	}

	staffIndexForNote(note) {
		return note.staffIndex - this.bottomLineNote.staffIndex;
	}

}

class TrebleStaff extends Staff {
	constructor () {
		super('gClef', new Note('G4'), 1);
	}
}

class AltoStaff extends Staff {
	constructor () {
		super('cClef', new Note('C4'), 2);
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
	AltoStaff: AltoStaff,
	BassStaff: BassStaff
};

export default Music;
