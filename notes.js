import Music from './lib/music.mjs';
import StaffCanvas from './lib/staffCanvas.mjs';
import NoteListener from './lib/noteListener.mjs';

const dbg = window.dbg = {};
dbg.Music = Music;

$( () => {

	class Session {
		constructor(audioStream) {
			this.listener = new NoteListener(audioStream, this.onListen.bind(this));

			this.notesToPractice = ['C3', 'F3', 'C4', 'G4', 'C5'];
			this.lastNoteIndex = null;
			this.nextChallenge();
		}

		pickNextNote() {
			let nextNoteIndex;
			do {
				nextNoteIndex = Math.floor(Math.random() * this.notesToPractice.length);
			} while (nextNoteIndex == this.lastNoteIndex);
			this.lastNoteIndex = nextNoteIndex;
			return new Music.Note(this.notesToPractice[nextNoteIndex]);
		}

		nextChallenge () {
			const selectedNote = this.pickNextNote();

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

		onListen(note) {
			const canvas = $('#detectedNote')[0];
			const ctx = canvas.getContext('2d');
			ctx.font = '40px sans-serif';
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			if (note)
				ctx.fillText(note.name, canvas.width / 2, canvas.height / 2);
		}
	}

	function startSession(audioStream) {
		console.log('Starting session');

		$('#start').prop('disabled', true);

		const session = new Session(audioStream);

		$('#next')
			.click( () => { session.nextChallenge(); } )
			.prop('disabled', false);
	}

	function onStart() {
		console.log('Requesting audio');

		navigator.mediaDevices.getUserMedia( {audio: true} )
			.then( (audioStream) => startSession(audioStream) )
			.catch( (error) => console.log('getUserMedia error: ' + error) );
	}

	function init() {
		$('#start')
			.click( onStart )
			.prop('disabled', false);
	}

	document.fonts.load('40pt Bravura').then(init);

});
