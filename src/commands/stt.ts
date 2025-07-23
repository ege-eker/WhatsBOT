import type { WASocket, proto } from '@whiskeysockets/baileys';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { downloadMedia } from '../bot/utils/download';
import { transcribeAudioFile } from '../clients/whisperClient';
import { CommandFunction } from '../types/command';

async function convertToWav(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y', // overwrite output if exists
      '-i', inputPath,
      '-ac', '1', // mono
      '-ar', '16000', // 16 kHz
      '-f', 'wav',
      outputPath
    ]);

    ffmpeg.on('error', (err) => {
    reject(new Error(`ffmpeg couldn't start: ${err.message}`));
    });

    ffmpeg.on('exit', (code) => {
    if (code === 0) {
        resolve();
    } else {
      reject(new Error(`ffmpeg exited with code ${code}`));
    }
    });

    ffmpeg.stderr.on('data', (data) => {
      console.info(`ffmpeg stderr: ${data}`);
    });
    console.warn('ffmpeg started for conversion');
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg process exited with code ${code}`));
      }
    });
  });
}

const sttCommand: CommandFunction = async (sock, msg, args) => {
  const from = msg.key.remoteJid!;
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  if (!quoted) {
    await sock.sendMessage(from, { text: '❌ Lütfen /stt komutuyla bir sesli mesajı alıntılayınız.' }, { quoted: msg });
    return true;
  }

  const audioMsg = quoted.audioMessage;
  if (!audioMsg) {
    await sock.sendMessage(from, { text: '❌ Alıntılanan mesaj sesli mesaj değil.' }, { quoted: msg });
    return true;
  }

  try {
    const buffer = await downloadMedia(sock, { message: quoted, key: msg.key });
    const ext = audioMsg.mimetype?.split('/')[1] || 'ogg';
    const tmpInput = path.join(os.tmpdir(), `audio-${Date.now()}.${ext}`);
    const tmpOutput = tmpInput.replace(/\.[^/.]+$/, '.wav');

    await fs.writeFile(tmpInput, buffer);

    // Convert with ffmpeg
    await convertToWav(tmpInput, tmpOutput);
    await fs.unlink(tmpInput); // clean up original file

    const text = await transcribeAudioFile(tmpOutput);
    await fs.unlink(tmpOutput); // clean up .wav file

    await sock.sendMessage(from, {
      text: `🎙️ Sesli mesajdan yazıya:\n\n${text}`
    }, { quoted: msg });
  } catch (err) {
    console.error(`❌ STT command error for ${from}:`, err);
    await sock.sendMessage(from, {
      text: '❌ Sesli mesaj transkribe edilirken hata oluştu. Lütfen tekrar deneyiniz.'
    }, { quoted: msg });
  }

  return true;
};


export default sttCommand;
