import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  screening: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Screening',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  seatLabels: [{
    type: String,
    required: true,
    match: /^[A-Z]+\d+$/, // Erlaubt A1, B12, AA5
    set: (v) => v.toUpperCase() // Macht aus "a1" automatisch "A1"
  }]
});

reservationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;

    ret.screeningId = doc.screening ? doc.screening.toString() : null;
    delete ret.screening;

    return ret;
  }
});

export const Reservation = mongoose.model('Reservation', reservationSchema);
