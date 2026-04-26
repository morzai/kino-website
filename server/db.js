import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Lädt Umgebungsvariablen aus .env Datei
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kino-db';

export async function connectDB () {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB verbunden');
  } catch (err) {
    console.error('MongoDB Verbindung fehlgeschlagen:', err);
    process.exit(1);
  }
}

export default mongoose;
