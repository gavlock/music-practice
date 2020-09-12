
$( () => {
	const notesToPractice = ['C4', 'G4', 'C5', 'F5'];

	function start() {
		const selectedNoteIndex = Math.floor(Math.random() * notesToPractice.length);
		const selectedNote = notesToPractice[selectedNoteIndex];
		
		$('#requestedNote').text(selectedNote);
	}

	const startButton = $('#start');
	startButton.click( start );
	startButton.prop('disabled', false);
	
});
