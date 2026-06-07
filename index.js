// Enhanced typewriter effect with smooth animations
let typewriterElement;
const phrases = [
  'N0201',
  'All my links at one place',
  'sudo mka bacon',
  'nohello.com!',
  'When new bliss build?',
  'Welcome!',
  'Connect with me →',
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
  
  // Clean typewriter without blinking cursor - looks much smoother
  typewriterElement.innerHTML = `<span style='
    color: #1DEDA2;
    display: inline-block;
    text-shadow: 0 0 10px #1DEDA2, 0 0 15px rgba(29, 237, 162, 0.5);
    letter-spacing: 0.5px;
  '>${displayText}</span>`;

  if (!isDeleting && letterIndex < currentPhrase.length) {
    letterIndex++;
    setTimeout(typeWriter, 70); // Smooth typing speed
  } else if (isDeleting && letterIndex > 0) {
    letterIndex--;
    setTimeout(typeWriter, 35); // Smooth deletion speed
  } else {
    if (!isDeleting) {
      isDeleting = true;
      setTimeout(typeWriter, 1800); // Pause to read
    } else {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      setTimeout(typeWriter, 600); // Pause between phrases
    }
  }
}

document.addEventListener('DOMContentLoaded', typeWriter);
