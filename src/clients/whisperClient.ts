import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.WHISPER_API_KEY || '';
const apiUrl = process.env.WHISPER_API_URL || '';

/** send audio to server, returns task id */
export async function submitAudioFile(filePath: string): Promise<string> {
  if (!apiKey || !apiUrl) {
    throw new Error('Whisper API key or URL is not set in environment variables.');
  }
  const fileStream = fs.createReadStream(filePath);
  const formData = new FormData();
  formData.append('file', fileStream);

  const response = await axios.post(apiUrl, formData, {
    headers: {
      'x-api-key': apiKey,
      ...formData.getHeaders()
    },
  });
  return response.data.task_id;
}

/** get job status with task_id */
export async function fetchTranscription(taskId: string): Promise<{ status: string, text?: string, error?: string }> {
  if (!apiKey || !apiUrl) {
    throw new Error('Whisper API key or URL is not set in environment variables.');
  }
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const url = `${baseUrl}/result/${taskId}`;
  const response = await axios.get(url, {
    headers: { 'x-api-key': apiKey }
  });
  return response.data;
}

export async function transcribeWithPolling(filePath: string, pollIntervalSec=5): Promise<string> {
  const taskId = await submitAudioFile(filePath);
  while (true) {
    const res = await fetchTranscription(taskId);
    if(res.status === "completed" && res.text) {
      return res.text!;
    } else if(res.status === "failed") {
      throw new Error(res.error || "Transcription failed");
    }
    await new Promise(res => setTimeout(res, pollIntervalSec * 1000));
  }
}