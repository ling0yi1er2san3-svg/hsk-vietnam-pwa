let currentRate = 1;

export function setSpeechRate(rate: number) {
  currentRate = rate;
}

export function getSpeechRate() {
  return currentRate;
}

export function speakChinese(text: string, rate = currentRate): boolean {
  if (!('speechSynthesis' in window) || !text.trim()) return false;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = rate;

  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith('zh-cn'))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('zh'));

  if (zhVoice) utterance.voice = zhVoice;
  window.speechSynthesis.speak(utterance);
  return true;
}
