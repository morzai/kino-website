import mongoose from 'mongoose';

const hallSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  rows: {
    type: Number,
    required: true,
    min: 1
  },
  seatsPerRow: {
    type: Number,
    required: true,
    min: 1
  }
});

// Frontend erwartet "id" statt "_id"
hallSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  }
});

export const Hall = mongoose.model('Hall', hallSchema);
