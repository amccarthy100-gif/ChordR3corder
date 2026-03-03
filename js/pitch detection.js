</>JavaScript
let analyser;
let dataArray;
let stream;

export async function startMic() {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ac = new (window.AudioContext || window.webkitAudioContext)();
  const source = ac.createMediaStreamSource(stream);

  analyser = ac.createAnalyser();
  analyser.fftSize = 2048;

  source.connect(analyser);
  dataArray = new Float32Array(analyser.fftSize);

  detectPitch();
}

function autoCorrelate(buf, sampleRate) {
  let SIZE = buf.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    rms += buf[i] * buf[i];
  }

  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  let r1 = 0, r2 = SIZE - 1;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < 0.2) {
      r1 = i;
      break;
    }
  }

  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < 0.2) {
      r2 = SIZE - i;
      break;
    }
  }

  buf = buf.slice(r1, r2);
  SIZE = buf.length;

  let c = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c[i] = c[i] + buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d+1]) d++;
  let maxval = -1, maxpos = -1;

  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;
  return sampleRate / T0;
}

function detectPitch() {
  analyser.getFloatTimeDomainData(dataArray);
  const pitch = autoCorrelate(dataArray, 44100);

  if (pitch !== -1) {
    console.log("Pitch:", pitch);
  }

  requestAnimationFrame(detectPitch);
}
