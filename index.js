// Typewriter effect for h1
let typewriterElement;
const phrases = [
  'N0201',
  'All my links at one place',
  'sudo mka bacon',
  'nohello.com!',
  'When new bliss build?',
];

let phraseIndex = 0;
let letterIndex = 0;
let isDeleting = false;

function typeWriter() {
  if (!typewriterElement) {
    typewriterElement = document.getElementById('typewriter');
    if (!typewriterElement) return;
  }
  const currentPhrase = phrases[phraseIndex];
  let displayText = currentPhrase.substring(0, letterIndex);
  typewriterElement.innerHTML = `<span style='color:#1DEDA2'>${displayText}</span>`;

  if (!isDeleting && letterIndex < currentPhrase.length) {
    letterIndex++;
    setTimeout(typeWriter, 100);
  } else if (isDeleting && letterIndex > 0) {
    letterIndex--;
    setTimeout(typeWriter, 50);
  } else {
    if (!isDeleting) {
      isDeleting = true;
      setTimeout(typeWriter, 1200);
    } else {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      setTimeout(typeWriter, 400);
    }
  }
}

document.addEventListener('DOMContentLoaded', typeWriter);
