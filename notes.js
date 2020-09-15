import Music from './lib/music.mjs';
import StaffCanvas from './lib/staffCanvas.mjs';

const dbg = window.dbg = {};
dbg.Music = Music;

$( () => {
	const notesToPractice = ['C3', 'F3', 'C4', 'G4', 'C5'];

	function start() {
		const selectedNoteIndex = Math.floor(Math.random() * notesToPractice.length);
		const selectedNote = new Music.Note(notesToPractice[selectedNoteIndex]);
		console.log(selectedNote);

		const staff = new Music.TrebleStaff();
		dbg.staff = staff;

		staff.addNote('E4');
		staff.addNote('G4');
		staff.addNote('B4');
		staff.addNote('D5');
		staff.addNote('F5');

		staff.addNote('F4');
		staff.addNote('A♭4');
		staff.addNote('C#5');
		staff.addNote('E♮5');

		staff.addNote('A3');
		staff.addNote('B3');
		staff.addNote('C4');
		staff.addNote('D4');

		//const staff = (selectedNote >= Music.Note.middleC) ? new Music.TrebleStaff() : new Music.BassStaff();
		//dbg.staff = staff;
		//staff.addNote(selectedNote);

		const staffCanvas = new StaffCanvas($('#requestedNote')[0]);
		staffCanvas.render(staff);
	}

	function init() {
		const startButton = $('#start');
		startButton.click( start );
		startButton.prop('disabled', false);

		start();
	}

	document.fonts.load('40pt Bravura').then(init);

});
