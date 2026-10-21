// Acha um Chrome ou Edge instalado para os scripts de render e captura.
import { existsSync } from 'node:fs';

const CANDIDATOS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

export function navegador() {
  const achado = CANDIDATOS.find((c) => c && existsSync(c));
  if (!achado) throw new Error('Nenhum Chrome/Edge encontrado. Defina CHROME_PATH.');
  return achado;
}
