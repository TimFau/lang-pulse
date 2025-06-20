export const speak = (text: string, lang: string = 'en') => {
  if (typeof window === 'undefined') return;
  if ('speechSynthesis' in window && text) {
    const synth = window.speechSynthesis;
    synth.cancel();
    const processedText = text.replace(/_{2,}/g, 'blank');
    const voices = synth.getVoices();
    const voice =
      voices.find((v) => v.lang === lang) ||
      voices.find((v) => v.lang.startsWith(lang.split('-')[0]));
    const utterance = new window.SpeechSynthesisUtterance(processedText);
    utterance.lang = lang;
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
  }
}; 