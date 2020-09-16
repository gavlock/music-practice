import Music from './lib/music.mjs';
import StaffCanvas from './lib/staffCanvas.mjs';

const dbg = window.dbg = {};
dbg.Music = Music;

$( () => {
	const notesToPractice = ['C3', 'F3', 'C4', 'G4', 'C5'];

	function start() {
		const selectedNoteIndex = Math.floor(Math.random() * notesToPractice.length);
		const selectedNote = new Music.Note(notesToPractice[selectedNoteIndex]);

		const staff = (selectedNote >= Music.Note.middleC) ? new Music.TrebleStaff() : new Music.BassStaff();
		dbg.staff = staff;
		staff.addNote(selectedNote);

		const canvas = $('#requestedNote')[0];
		const staffCanvas = new StaffCanvas(canvas);
		staffCanvas.render(staff);

		{
			const ctx = canvas.getContext('2d');
			const size = staffCanvas.fontSize;
			ctx.font = size + 'px sans-serif';
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'right';
			ctx.fillText(selectedNote.name, canvas.width - staffCanvas.margin, canvas.height / 2);
		}
	}

	function init() {
		const startButton = $('#start');
		startButton.click( start );
		startButton.prop('disabled', false);

		start();
	}

	document.fonts.load('40pt Bravura').then(init);

});
