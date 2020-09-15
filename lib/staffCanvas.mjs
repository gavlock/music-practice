import SMuFL from './smufl.mjs';

const accidentalGlyphs = {
	'♭': SMuFL.glyphs.accidentalFlat,
	'♮': SMuFL.glyphs.accidentalNatural,
	'♯': SMuFL.glyphs.accidentalSharp,
};

export default class StaffCanvas {

	constructor(canvas, fontFamily, margin) {
		this.canvas = canvas;
		this.context = canvas.getContext('2d');
		this.fontFamily = fontFamily || 'Bravura';

		this.staffStep = Math.floor(canvas.height / 24);
		this.staffSpace = 2 * this.staffStep;
		this.fontSize = this.staffSpace * 4;
		this.margin = margin || this.fontSize / 4;

		this.baseLine = canvas.height - 9 * this.staffStep;
		this.staffLineThickness = Math.ceil(0.13  * this.staffSpace);
	}

	clear() {
		const ctx = this.context;
		ctx.resetTransform();
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		ctx.font = this.fontSize + 'px ' + this.fontFamily;
		ctx.textBaseline = 'alphabetic';
		ctx.textAlign = 'left';
		this.xPos = this.fontSize / 4;
	}

	_drawStaffLines(staff) {
		const ctx = this.context;
		ctx.beginPath();
		ctx.lineWidth = this.staffLineThickness;
		for (let i = 0 ; i < 5 ; ++i) {
			const yPos = - (i * this.staffSpace);
			ctx.moveTo(0, yPos);
			ctx.lineTo((staff.notes.length + 1) * this.fontSize, yPos);
		}
		ctx.stroke();
	}

	_writeGlyph(glyph, staffIndex) {
		this.context.fillText(SMuFL.glyphs[glyph], this.xPos, -(staffIndex * this.staffStep));
		this.xPos += this.fontSize;
	}

	_drawClef(staff) {
		this._writeGlyph(staff.clef, staff.clefStaffLine * 2);
		this.xPos += this.fontSize / 4;
	}

	_drawLedgerLines(from, to) {
		const ctx = this.context;
		ctx.beginPath();
		ctx.lineWidth = this.staffLineThickness;
		for (let i = from ; i <= to ; ++i) {
			const yPos = - (i * this.staffSpace);
			ctx.moveTo(this.xPos - 1/8 * this.fontSize, yPos);
			ctx.lineTo(this.xPos + 4/8 * this.fontSize, yPos);
		}
		ctx.stroke();
	}

	_drawNote(staff, note) {
		const staffIndex = staff.staffIndexForNote(note);
		const glyph = (staffIndex >= 4 ) ? 'noteQuarterUp' : 'noteQuarterDown';

		if (note.accidental) {
			const accidentalGlyph = accidentalGlyphs[note.accidental];
			this.context.fillText(accidentalGlyph, this.xPos - 2 * this.staffStep, -(staffIndex * this.staffStep));
		}

		if (staffIndex <= -2)
			this._drawLedgerLines(-Math.floor(staffIndex / -2), -1);
		else if (staffIndex >= 10)
			this._drawLedgerLines(5, Math.floor(staffIndex / 2));

		this._writeGlyph(glyph, staffIndex);
	}

	render(staff) {
		const ctx = this.context;
		ctx.save();

		this.clear();
		ctx.translate(this.margin, this.baseLine);

		this._drawStaffLines(staff);
		this._drawClef(staff);
		for (const note of staff.notes)
			this._drawNote(staff, note);

		ctx.restore();
	}

}
