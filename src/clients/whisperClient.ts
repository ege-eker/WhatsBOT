import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.WHISPER_API_KEY || '';
const apiUrl = process.env.WHISPER_API_URL || '';

export async function transcribeAudioFile(filePath: string) {
  if (!apiKey || !apiUrl) {
    throw new Error('Whisper API key or URL is not set in environment variables.');
  }

  const fileStream = fs.createReadStream(filePath);
  const formData = new FormData();
  formData.append('file', fileStream);

  try {
    const response = await axios.post(apiUrl, formData, {
      headers: {
        'x-api-key': apiKey,
        ...formData.getHeaders(),
      },
    });
    return response.data.text;
  } catch (error) {
    console.error('Whisper API transcribe error:', error);
    throw error;
  }
}