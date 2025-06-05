// ***************************************
// Achtung: Three.js ist bereits via CDN in index.html eingebunden.
// ***************************************

// 1) Szene, Orthographic-Kamera und Renderer aufsetzen
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("bgCanvas"),
  antialias: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Auf Fenstergröße reagieren
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
});

// 2) Vertex- und Fragment-Shader

// Vertex-Shader: UV-Koordinaten weitergeben
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Fragment-Shader: Größeres Muster, intensivere psychedelische Verzerrung
const fragmentShader = `
  precision highp float;

  uniform vec2 u_mouse;       // Mausposition [0..1]
  uniform vec2 u_resolution;  // Bildschirmgröße
  uniform float u_time;       // Zeit für Animation
  varying vec2 vUv;

  // Pastelltöne mischen
  vec3 pastelColor(vec2 uv) {
    vec3 c1 = vec3(0.84, 0.75, 0.92);
    vec3 c2 = vec3(0.75, 0.85, 0.94);
    vec3 c3 = vec3(0.95, 0.85, 0.80);
    vec3 c4 = vec3(0.80, 0.94, 0.85);

    return mix(
      mix(c1, c2, uv.x),
      mix(c3, c4, uv.x),
      uv.y
    );
  }

  // Erzeugt die psychedelische Verzerrung und das große Wellenmuster
  vec3 psychedelicPattern(vec2 uv, vec2 m, float time) {
    // 1) Größeres Basismuster: niedrigere Frequenzen (4..6 bzw. 6..8)
    float freq1 = 4.0  + m.x * 2.0;   // 4 – 6
    float freq2 = 6.0  + m.y * 2.0;   // 6 – 8
    float phaseOffset = (m.x + m.y) * 0.5; // 0 – 0.5

    // 2) Psychedelische Verzerrung: stärkere Amplitude (0.05 statt 0.02)
    float distortion = sin((uv.x + uv.y) * 4.0 + time * 0.7 + (m.x + m.y) * 6.0);
    vec2 uvDist = uv + 0.05 * vec2(distortion, -distortion);

    // 3) Base-Farbe über verzerrte UVs
    vec3 base = pastelColor(uvDist);

    // 4) Große Wellenmuster, die sich langsam bewegen
    float w1 = sin((uvDist.x + uvDist.y + phaseOffset) * freq1 + time * 0.3);
    float w2 = sin((uvDist.x - uvDist.y - phaseOffset) * freq2 - time * 0.3);
    float w3 = sin((uvDist.x * (3.0 + m.x * 1.0) + uvDist.y * (2.0 + m.y * 1.0)) + phaseOffset * 0.3 + time * 0.2);

    float waveMix = (w1 + w2 + w3) / 3.0;

    // 5) Erhöhter Schimmerfaktor: 0.08 (anstatt vorher 0.06)
    vec3 shimmer = base + 0.08 * vec3(
      sin(3.14159 * waveMix),
      sin(3.14159 * waveMix + 2.0),
      sin(3.14159 * waveMix + 4.0)
    );

    return shimmer;
  }

  void main() {
    vec2 uv = vUv;

    // 6) Maus-Offset: X normal, Y auf ¼ reduziert
    vec2 m = u_mouse;
    float offsetX = (m.x - 0.5) * 0.04;
    float offsetY = (m.y - 0.5) * 0.04 * 0.25;  // Vertikal ¼

    // Parallax-Faktoren: X 0.1, Y 0.05
    uv.x += offsetX * 0.1;
    uv.y += offsetY * 0.05;

    // mAdjusted: Y auf ¼ reduziert, damit Wellenparameter vertikal minimal variieren
    vec2 mAdjusted = vec2(m.x, 0.5 + (m.y - 0.5) * 0.25);

    // 7) Finale Farbe mit psychedelischem Muster
    vec3 color = psychedelicPattern(uv, mAdjusted, u_time);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// 3) ShaderMaterial und Uniforms anlegen
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    u_mouse:      { value: new THREE.Vector2(0.5, 0.5) },
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    u_time:       { value: 0.0 }
  }
});

// 4) Fullscreen-Quad (PlaneGeometry) erstellen
const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// 5) Mausbewegung tracken und Uniform aktualisieren
window.addEventListener("mousemove", (event) => {
  const mx = event.clientX / window.innerWidth;
  const my = 1.0 - event.clientY / window.innerHeight;
  material.uniforms.u_mouse.value.set(mx, my);
});

// 6) Animations-Loop (rendern + Zeit-Uniform aktualisieren)
let clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  material.uniforms.u_time.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}
animate();
