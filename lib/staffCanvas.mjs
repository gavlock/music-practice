import SMuFL from './smufl.mjs';

const accidentalGlyphs = {
	'♭': SMuFL.glyphs.accidentalFlat,
	'♮': SMuFL.glyphs.accidentalNatural,
	'#': SMuFL.glyphs.accidentalSharp,
};

export default class StaffCanvas {

	constructor(canvas, fontFamily, margin) {
		this.canvas = canvas;
		this.context = canvas.getContext('2d');
		this.fontFamily = fontFamily || 'Bravura';

		this.fontSize = canvas.height / 3;
		this.margin = margin || this.fontSize / 4;;
		this.staffSpace = this.fontSize / 4;
		this.baseLine = canvas.height - 4 * this.staffSpace;
		this.staffLineThickness = 0.13;
	}

	clear() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	render(staff) {
		this.clear();
		const ctx = this.context;
		const staffSpace = this.staffSpace;
		const staffStep = staffSpace / 2;
		const fontSize = this.fontSize;

		ctx.save();
		ctx.font = this.fontSize + 'px ' + this.fontFamily;

		ctx.resetTransform();
		ctx.translate(this.margin, this.baseLine);

		ctx.beginPath();
		ctx.lineWidth = this.staffLineThickness * this.staffSpace;
		for (let i = 0 ; i < 5 ; ++i) {
			const yPos = - (i * staffSpace);
			ctx.moveTo(- this.margin / 2, yPos);
			ctx.lineTo(this.canvas.width - 3/2 * this.margin, yPos);
		}
		ctx.stroke();

		ctx.fillText(SMuFL.glyphs[staff.clef], 0, -(staff.clefStaffLine * staffSpace));

		let xPos = fontSize / 2;
		for (const note of staff.notes) {
			xPos += fontSize;
			const staffIndex = staff.staffIndexForNote(note);
			const glyph = (staffIndex >= 4 ) ? 'noteQuarterUp' : 'noteQuarterDown';
			ctx.fillText(SMuFL.glyphs[glyph], xPos, -(staffIndex * staffStep));
			if (note.accidental) {
				const accidentalGlyph = accidentalGlyphs[note.accidental];
				ctx.fillText(accidentalGlyph, xPos - 2 * staffStep, -(staffIndex * staffStep));
			}
		}

		ctx.restore();
	}

}
