import { WASocket, proto } from '@whiskeysockets/baileys';
import sharp from 'sharp';
import { downloadMedia } from '../bot/utils/download';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';

function tmpFilePath(extension: string): string {
    const tmpDir = os.tmpdir();
    const filename = `sticker-${Date.now()}.${extension}`;
    return path.join(tmpDir, filename);
}

async function videoToWebp(buffer: Buffer, duration: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const inputPath = tmpFilePath('mp4');
        const outputPath = tmpFilePath('webp');
        fs.writeFileSync(inputPath, buffer);

        ffmpeg(inputPath)
            .inputOption([`-t ${duration}`]) // Set duration for the video
            .outputOptions([
                '-vcodec', 'libwebp',
                '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
                '-loop', '0',
                '-preset', 'default',
                '-an',
                '-vsync', '0',
                '-lossless', '1',   // Lossless compression
                '-quality', '80',   // 0-100 quality scale
            ])
            .output(outputPath)
            .on('end', () => {
                const webp = fs.readFileSync(outputPath);
                fs.unlinkSync(inputPath);
                fs.unlinkSync(outputPath);
                resolve(webp);
            })
            .on('error', (err) => {
                reject(err);
            })
            .run();
    });
}

export default async function stickerCommand(
    sock: WASocket,
    msg: proto.IWebMessageInfo,
    args: string[],
): Promise<boolean> {
    if (args[0] && isNaN(parseInt(args[0]))) {
        await sock.sendMessage(msg.key.remoteJid!, {
            text: '❌ Invalid duration.',
        }, {quoted: msg});
        return true; // handled
    }

    const from = msg.key.remoteJid!;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    const image = msg.message?.imageMessage || quoted?.imageMessage;
    const video = msg.message?.videoMessage || quoted?.videoMessage;
    const duration = Math.min(parseInt(args[0] || '6'), 15); // default 6, max 15

    if (!image && !video) {
        await sock.sendMessage(from, {
            text: '❌ Please send or quote an image or video to convert to a sticker.',
        }, {quoted: msg});
        return true; // handled
    }
    try {
        const message = image
            ? {message: {imageMessage: image}, key: msg.key}
            : {message: {videoMessage: video}, key: msg.key};

        const buffer = await downloadMedia(sock, message);

        let stickerBuffer: Buffer;

        if (image) {
            stickerBuffer = await sharp(buffer)
                .resize(512, 512, {
                    fit: 'contain',
                    background: {r: 0, g: 0, b: 0, alpha: 0},
                })
                .webp()
                .toBuffer();
        } else {
            stickerBuffer = await videoToWebp(buffer, duration);
        }

        await sock.sendMessage(from, {sticker: stickerBuffer}, {quoted: msg});
        console.log(`✅ Sticker sent to ${from}`);
    } catch (err) {
        console.error(`❌ Error creating sticker for ${from}:`, err);
        await sock.sendMessage(from, {
            text: '❌ Failed to create sticker. Please try again with a different image or video.',
        }, {quoted: msg});
    }
    return true; // handled
}