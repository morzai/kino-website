import mongoose from 'mongoose';

const screeningSchema = new mongoose.Schema({
  start: { type: Date, required: true },
  movie: { type: String, required: true },
  hall: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true }
});

screeningSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;

    // hallId robust
    const hallValue = doc.hall;
    if (hallValue) {
      ret.hallId =
        hallValue._id ? hallValue._id.toString() : hallValue.toString();

      // hallName nur wenn populated
      ret.hallName = hallValue.name || undefined;
    }

    // hall nicht nach außen geben
    delete ret.hall;

    return ret;
  }
})
;

export const Screening = mongoose.model('Screening', screeningSchema);
