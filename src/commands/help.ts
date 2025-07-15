import {WASocket,proto} from "@whiskeysockets/baileys";

export default async function help(
  sock: WASocket,
  msg: proto.IWebMessageInfo,
): Promise<boolean> {
  const from = msg.key.remoteJid;

  const helpMessage = `
🛠 *Komutlar Listesi*:

• */sticker [videosüre-max15s]* — Gönderdiğiniz görsel veya videoyu sticker'a çevirir
• */help* — Bu yardım mesajını gösterir

📌 Örnek kullanım:
- Fotoğraf atın/alıntılayın ve /sticker yazın
- /help yazarak bu mesajı tekrar görebilirsiniz
`;

  await sock.sendMessage(from!, { text: helpMessage.trim() }, { quoted: msg });
  return true;
}