import Music from './lib/music.mjs';

const dbg = window.dbg = {};
dbg.Music = Music;

$( () => {
	const notesToPractice = ['C4', 'G4', 'C5', 'F5'];

	function start() {
		const selectedNoteIndex = Math.floor(Math.random() * notesToPractice.length);
		const selectedNote = new Music.Note(notesToPractice[selectedNoteIndex]);
		console.log(selectedNote);

		const staff = (selectedNote >= Music.Note.middleC) ? new Music.TrebleStaff() : new Music.BassStaff();
		dbg.staff = staff;
		//staff.addNote(selectedNote);

		const gClef = '\uE050';
		const staff5Lines = '\uE014';
		const noteQuarterUp = '\uE1D5';
		const noteQuarterDown = '\uE1D6';

		const canvas = $('#requestedNote')[0];
		const context = canvas.getContext('2d');

		const fontSize = canvas.height / 2;
		const staffSpace = fontSize / 4;
		const margin = fontSize / 4;
		const staffLineThickness = 0.13;
		
		context.font = fontSize + 'px Bravura';
		const baseLine = canvas.height - 2 * staffSpace;

		context.beginPath();
		context.lineWidth = staffLineThickness * staffSpace;
		for (let i = 0 ; i < 5 ; ++i) {
			//context.fillText(staff5Lines, (margin / 2) + (i * (fontSize / 2 - 1)), baseLine);
			const yPos = baseLine - (i * staffSpace);
			context.moveTo((margin / 2), yPos);
			context.lineTo(canvas.width - (margin / 2), yPos);
		}
		context.stroke();
		
		context.fillText(gClef, margin, baseLine - staffSpace);
		context.fillText(noteQuarterUp, margin + 1 * fontSize, baseLine - (-1) * staffSpace);
		context.fillText(noteQuarterDown, margin + 2 * fontSize, baseLine - 5 * staffSpace);
	}

	function init() {
		const startButton = $('#start');
		startButton.click( start );
		startButton.prop('disabled', false);

		start();
	}

	document.fonts.load('40pt Bravura').then(init);
	
});
