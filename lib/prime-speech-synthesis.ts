let hasAttachedVoicesListener = false;

/**
 * Call from a user gesture (tap). Unlocks speech on iOS Safari and warms the voice list.
 */
export function primeSpeechSynthesisFromUserGesture(): void {
  if (typeof window === "undefined" || window.speechSynthesis === undefined) {
    return;
  }
  window.speechSynthesis.cancel();
  if (!hasAttachedVoicesListener) {
    hasAttachedVoicesListener = true;
    const loadVoices = (): void => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
  } else {
    window.speechSynthesis.getVoices();
  }
  const utterance = new SpeechSynthesisUtterance("\u00a0");
  utterance.volume = 0;
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}
