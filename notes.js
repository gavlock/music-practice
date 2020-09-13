
$( () => {
	const notesToPractice = ['C4', 'G4', 'C5', 'F5'];

	function start() {
		const selectedNoteIndex = Math.floor(Math.random() * notesToPractice.length);
		const selectedNote = notesToPractice[selectedNoteIndex];
		
		//$('#requestedNote').text(selectedNote);

		const gClef = '\uE050';
		const staff5Lines = '\uE014';
		const noteQuarterUp = '\uE1D5';
		const noteQuarterDown = '\uE1D6';

		const canvas = $('#requestedNote')[0];
		const context = canvas.getContext('2d');

		const fontSize = canvas.height / 2;
		const staffLineHeight = fontSize / 4;
		const margin = fontSize / 4;
		
		context.font = fontSize + 'px Bravura';
		const baseLine = canvas.height - 2 * staffLineHeight;

		//TODO: "Scoring programs should draw their own staff lines using
		//primitives, not use the glyphs in this range"
		for (let i = 0 ; i < 8 ; ++i)
			context.fillText(staff5Lines, (margin / 2) + (i * (fontSize / 2 - 1)), baseLine);
		
		context.fillText(gClef, margin, baseLine - staffLineHeight);
		context.fillText(noteQuarterUp, margin + 1 * fontSize, baseLine - (-1) * staffLineHeight);
		context.fillText(noteQuarterDown, margin + 2 * fontSize, baseLine - 5 * staffLineHeight);
	}

	function init() {
		const startButton = $('#start');
		startButton.click( start );
		startButton.prop('disabled', false);

		start();
	}

	document.fonts.load('40pt Bravura').then(init);
	
});
