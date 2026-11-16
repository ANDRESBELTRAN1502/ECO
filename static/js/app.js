const MODEL_URL = document.body.dataset.modelUrl;
/* =========================================================
   Datos del proyecto (los mismos del cuaderno)
   ========================================================= */
const CLASES_DEF = ['battery','biological','brown-glass','cardboard','clothes','green-glass','metal','paper','plastic','shoes','trash','white-glass'];
const NOMBRES_DEF = {battery:'Batería / pila',biological:'Orgánico (comida)','brown-glass':'Vidrio café',cardboard:'Cartón',clothes:'Ropa','green-glass':'Vidrio verde',metal:'Metal',paper:'Papel',plastic:'Plástico',shoes:'Zapatos',trash:'Basura general','white-glass':'Vidrio blanco'};
const CANECA_DEF = {battery:'Peligroso',biological:'Orgánico','brown-glass':'Aprovechable','green-glass':'Aprovechable','white-glass':'Aprovechable',cardboard:'Aprovechable',paper:'Aprovechable',plastic:'Aprovechable',metal:'Aprovechable',clothes:'No aprovechable',shoes:'No aprovechable',trash:'No aprovechable'};
const CANECA_TXT = {
  'Aprovechable':['Caneca BLANCA','aprovechables / reciclables'],
  'Orgánico':['Caneca VERDE','orgánicos'],
  'No aprovechable':['Caneca NEGRA','no aprovechables'],
  'Peligroso':['Punto POSCONSUMO','residuo peligroso, no va en ninguna caneca']
};
const BIN_COLOR = {'Aprovechable':'#d9dfda','Orgánico':'#2e7d32','No aprovechable':'#5a615c','Peligroso':'#c62828'};
const UMBRAL = 0.50;
const PREDICT_INTERVAL_MS = 600;
const ENABLE_MODEL_WARMUP = false;

/* Resultados reales del cuaderno */
const CONTEO = {battery:945,biological:985,'brown-glass':607,cardboard:891,clothes:5324,'green-glass':614,metal:768,paper:1050,plastic:863,shoes:1977,trash:697,'white-glass':772};
const PESOS = {battery:1.37,biological:1.31,'brown-glass':2.13,cardboard:1.45,clothes:0.24,'green-glass':2.10,metal:1.68,paper:1.23,plastic:1.50,shoes:0.65,trash:1.85,'white-glass':1.67};
const HIST = {
  acc:[.3688,.4502,.4853,.5106,.5473,.5606,.5787,.5928,.5962,.6090,.6250,.6270,.6284,.6297,.6494],
  val:[.3313,.5417,.5353,.5069,.5086,.5030,.6179,.5895,.5994,.6446,.6803,.7035,.6751,.6919,.6932],
  loss:[1.8963,1.5875,1.4776,1.4109,1.2986,1.2658,1.1990,1.1692,1.1585,1.1070,1.0833,1.0655,1.0500,1.0447,1.0002],
  vloss:[2.1897,1.3899,1.4121,1.5631,1.4335,1.4915,1.1510,1.1987,1.1814,1.0496,0.9779,0.9272,0.9855,0.9494,0.9357]
};
const REPORTE = {battery:[.583,.690,.632,142],biological:[.743,.723,.733,148],'brown-glass':[.699,.714,.707,91],cardboard:[.689,.767,.726,133],clothes:[.840,.831,.836,798],'green-glass':[.723,.935,.815,92],metal:[.479,.591,.529,115],paper:[.589,.778,.670,158],plastic:[.636,.523,.574,130],shoes:[.603,.296,.397,297],trash:[.655,.692,.673,104],'white-glass':[.584,.750,.657,116]};

let INFO = {clases:CLASES_DEF, nombres:NOMBRES_DEF, caneca:CANECA_DEF, img:224};
const nombre = c => INFO.nombres[c] || c;
const caneca = c => INFO.caneca[c] || 'No aprovechable';
const fmt = (n,d=1) => n.toLocaleString('es-CO',{minimumFractionDigits:d,maximumFractionDigits:d});

/* =========================================================
   Navegación entre vistas
   ========================================================= */
function showView(){
  const allowed = new Set(['detector', 'como-funciona']);
  const hashView = location.hash.replace(/^#/, '').trim();
  const v = allowed.has(hashView) ? hashView : document.body.dataset.view;
  document.body.dataset.view = v;
  document.querySelectorAll('.view').forEach(s => s.hidden = s.id !== 'v-' + v);
  document.querySelectorAll('nav.tabs a').forEach(a => { if (a.dataset.view === v) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
}
addEventListener('hashchange', showView); showView();
document.querySelectorAll('[data-jump]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); if (location.hash !== '#como-funciona') location.hash = 'como-funciona';
  document.getElementById(a.dataset.jump).scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
}));

/* =========================================================
   Gráficas (SVG a mano, colores desde los tokens)
   ========================================================= */
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs={}, text){ const e=document.createElementNS(NS,tag); for(const k in attrs) e.setAttribute(k,attrs[k]); if(text!=null) e.textContent=text; return e; }

function hbar(svg, items, max, fmtv, ticks){
  svg.innerHTML='';
  const W=640, rowH=26, padL=150, padR=56, top=8, H=top+items.length*rowH+26;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const x = v => padL + (W-padL-padR)*v/max;
  ticks.forEach(t => {
    svg.append(el('line',{x1:x(t),x2:x(t),y1:top,y2:H-22,stroke:css('--line')}));
    svg.append(el('text',{x:x(t),y:H-6,'text-anchor':'middle','font-size':11,fill:css('--muted')}, fmtv(t,true)));
  });
  items.forEach((it,i) => {
    const y = top + i*rowH;
    svg.append(el('text',{x:padL-10,y:y+17,'text-anchor':'end','font-size':13,fill:css('--ink')}, it.label));
    const r = el('rect',{x:padL,y:y+5,width:Math.max(1,x(it.v)-padL),height:rowH-10,rx:4,fill:it.color});
    if (it.edge) { r.setAttribute('stroke', it.edge); }
    svg.append(r);
    svg.append(el('text',{x:x(it.v)+6,y:y+17,'font-size':12,fill:css('--ink'),'font-family':css('--font-mono')}, fmtv(it.v)));
  });
}
function lines(svg, a, b, opts){
  svg.innerHTML='';
  const W=420,H=250,pl=44,pr=14,pt=12,pb=32, n=a.length;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const x = i => pl + (W-pl-pr)*i/(n-1);
  const y = v => pt + (H-pt-pb)*(1-(v-opts.min)/(opts.max-opts.min));
  opts.ticks.forEach(t => {
    svg.append(el('line',{x1:pl,x2:W-pr,y1:y(t),y2:y(t),stroke:css('--line')}));
    svg.append(el('text',{x:pl-6,y:y(t)+4,'text-anchor':'end','font-size':11,fill:css('--muted')}, opts.tf(t)));
  });
  [1,3,5,7,9,11,13,15].forEach(e => svg.append(el('text',{x:x(e-1),y:H-12,'text-anchor':'middle','font-size':11,fill:css('--muted')}, e)));
  svg.append(el('text',{x:(W+pl)/2,y:H-0.5,'text-anchor':'middle','font-size':10.5,fill:css('--muted')}, 'Época'));
  const path = arr => arr.map((v,i)=>(i?'L':'M')+x(i).toFixed(1)+','+y(v).toFixed(1)).join('');
  svg.append(el('path',{d:path(a),fill:'none',stroke:css('--chart-a'),'stroke-width':2.5}));
  svg.append(el('path',{d:path(b),fill:'none',stroke:css('--chart-b'),'stroke-width':2.5,'stroke-dasharray':'6 4'}));
  a.forEach((v,i)=>svg.append(el('circle',{cx:x(i),cy:y(v),r:2.6,fill:css('--chart-a')})));
  b.forEach((v,i)=>svg.append(el('circle',{cx:x(i),cy:y(v),r:2.6,fill:css('--chart-b')})));
  if (opts.star!=null){
    const i=opts.star;
    svg.append(el('text',{x:x(i),y:y(b[i])+6,'text-anchor':'middle','font-size':20,fill:css('--chart-b'),stroke:css('--ink'),'stroke-width':.8}, '★'));
    svg.append(el('text',{x:x(i),y:y(b[i])-12,'text-anchor':'middle','font-size':11.5,'font-weight':700,fill:css('--ink')}, opts.tf(b[i],1)));
  }
}
function drawCharts(){
  const orden = [...CLASES_DEF].sort((p,q)=>CONTEO[q]-CONTEO[p]);
  const edge = css('--bin-blanca-edge');
  hbar(document.getElementById('chClases'), orden.map(c=>({label:NOMBRES_DEF[c], v:CONTEO[c], color:BIN_COLOR[CANECA_DEF[c]], edge: CANECA_DEF[c]==='Aprovechable'?edge:null})), 6000, (v)=>v.toLocaleString('es-CO'), [0,1000,2000,3000,4000,5000,6000]);
  lines(document.getElementById('chAcc'), HIST.acc, HIST.val, {min:.3,max:.75,ticks:[.3,.4,.5,.6,.7],tf:(v,d)=>Math.round(v*100*(d?10:1))/(d?10:1)+'%',star:11});
  lines(document.getElementById('chLoss'), HIST.loss, HIST.vloss, {min:.8,max:2.3,ticks:[.8,1.2,1.6,2.0],tf:v=>fmt(v,1)});
  const f1 = [...CLASES_DEF].sort((p,q)=>REPORTE[q][2]-REPORTE[p][2]);
  hbar(document.getElementById('chF1'), f1.map(c=>({label:NOMBRES_DEF[c], v:REPORTE[c][2], color:BIN_COLOR[CANECA_DEF[c]], edge: CANECA_DEF[c]==='Aprovechable'?edge:null})), 1, (v,t)=>t?fmt(v,1):fmt(v,2), [0,.2,.4,.6,.8,1]);
}
function fillTables(){
  const grupos = {};
  CLASES_DEF.forEach(c => (grupos[CANECA_DEF[c]] ||= []).push(NOMBRES_DEF[c]));
  const tc = document.querySelector('#tblCanecas tbody');
  Object.keys(CANECA_TXT).forEach(k => {
    tc.insertAdjacentHTML('beforeend', `<tr><td><span class="chip"><span class="dot" style="background:${BIN_COLOR[k]}"></span>${CANECA_TXT[k][0]}</span></td><td>${grupos[k].join(', ')}</td></tr>`);
  });
  const tp = document.querySelector('#tblPesos tbody');
  [...CLASES_DEF].sort((p,q)=>PESOS[q]-PESOS[p]).forEach(c => tp.insertAdjacentHTML('beforeend', `<tr><td>${NOMBRES_DEF[c]}</td><td class="num">${fmt(PESOS[c],2)}</td></tr>`));
  const te = document.querySelector('#tblEpocas tbody');
  HIST.acc.forEach((a,i) => {
    const best = i===11 ? ' style="background:var(--accent-soft);font-weight:700"' : '';
    te.insertAdjacentHTML('beforeend', `<tr${best}><td class="num">${i+1}</td><td class="num">${fmt(a*100,2)}</td><td class="num">${fmt(HIST.val[i]*100,2)}</td><td class="num">${fmt(HIST.loss[i],4)}</td><td class="num">${fmt(HIST.vloss[i],4)}</td><td class="num">${fmt((a-HIST.val[i])*100,2)}</td></tr>`);
  });
  const tr = document.querySelector('#tblReporte tbody');
  CLASES_DEF.forEach(c => { const r=REPORTE[c]; tr.insertAdjacentHTML('beforeend', `<tr><td>${NOMBRES_DEF[c]}</td><td class="num">${fmt(r[0],3)}</td><td class="num">${fmt(r[1],3)}</td><td class="num">${fmt(r[2],3)}</td><td class="num">${r[3]}</td></tr>`); });
}
fillTables(); drawCharts();

/* =========================================================
   Modelo: se reconstruye en el navegador a partir de
   eco_web.json (capas) + eco_web_pesos.bin (pesos float32)
   ========================================================= */
let MODEL = null;          // {capas:[...], pesos:{}}
const $ = id => document.getElementById(id);
function setStatus(s, t){ $('mStatus').dataset.s = s; $('mText').textContent = t; }

function buildModel(meta, buffer){
  const f32 = new Float32Array(buffer);
  const capas = meta.capas.map(c => {
    const w = {};
    (c.pesos||[]).forEach(p => { w[p.nombre] = tf.tensor(f32.subarray(p.offset, p.offset + p.n), p.forma, 'float32'); });
    return {...c, w};
  });
  return {capas, meta};
}
function act(x, a){
  switch(a){
    case 'relu': return tf.relu(x);
    case 'softmax': return tf.softmax(x);
    case 'sigmoid': return tf.sigmoid(x);
    case 'tanh': return tf.tanh(x);
    case 'swish': case 'silu': return tf.mul(x, tf.sigmoid(x));
    case 'linear': case null: case undefined: return x;
    default: throw new Error('Activación no soportada: ' + a);
  }
}
function forward(x){
  for (const c of MODEL.capas){
    const k = c.config || {};
    switch(c.tipo){
      case 'Rescaling': x = tf.add(tf.mul(x, k.scale), k.offset||0); break;
      case 'Conv2D':
        x = tf.conv2d(x, c.w.kernel, k.strides||[1,1], k.padding||'valid', 'NHWC', k.dilation_rate||[1,1]);
        if (c.w.bias) x = tf.add(x, c.w.bias);
        x = act(x, k.activation); break;
      case 'BatchNormalization':
        x = tf.batchNorm(x, c.w.moving_mean, c.w.moving_variance, c.w.beta, c.w.gamma, k.epsilon ?? 1e-3); break;
      case 'MaxPooling2D': x = tf.maxPool(x, k.pool_size, k.strides || k.pool_size, k.padding||'valid'); break;
      case 'AveragePooling2D': x = tf.avgPool(x, k.pool_size, k.strides || k.pool_size, k.padding||'valid'); break;
      case 'GlobalAveragePooling2D': x = tf.mean(x, [1,2]); break;
      case 'GlobalMaxPooling2D': x = tf.max(x, [1,2]); break;
      case 'Flatten': x = tf.reshape(x, [x.shape[0], -1]); break;
      case 'Dense':
        x = tf.matMul(x, c.w.kernel); if (c.w.bias) x = tf.add(x, c.w.bias);
        x = act(x, k.activation); break;
      case 'Activation': case 'ReLU': x = act(x, k.activation || 'relu'); break;
      default: throw new Error('Capa no soportada: ' + c.tipo);
    }
  }
  return x;
}
async function useModel(meta, buffer, origen){
  if (meta.formato !== 'eco-web-1') throw new Error('El archivo JSON no es el exportado por la sección 12 del cuaderno.');
  if (MODEL) MODEL.capas.forEach(c => Object.values(c.w).forEach(t => t.dispose()));
  MODEL = buildModel(meta, buffer);
  INFO = {clases: meta.clases || CLASES_DEF, nombres: meta.nombres_es || NOMBRES_DEF, caneca: meta.caneca_de || CANECA_DEF, img: meta.img_size || 224};
  // Un calentamiento completo hace que la primera inferencia tarde más.
  // Se deja opcional para no bloquear la primera carga del sitio.
  if (ENABLE_MODEL_WARMUP) {
    try {
      tf.tidy(() => forward(tf.zeros([1, INFO.img, INFO.img, 3])));
    } catch (err) {
      console.warn('Warm-up del modelo omitido:', err);
    }
  }
  const mb = (buffer.byteLength/1048576).toFixed(1);
  setStatus('ok', `Modelo listo (${origen}, ${mb} MB, motor ${tf.getBackend()})`);
}

async function loadInitial(){
  try { await tf.setBackend('webgl'); } catch(e) { /* usa el motor por defecto */ }
  await tf.ready();
  try {
    const r = await fetch(MODEL_URL + 'eco_web.json', {cache:'no-cache'});
    if (!r.ok) throw new Error(`No se encontró ${MODEL_URL}eco_web.json (HTTP ${r.status}).`);
    const meta = await r.json();
    const b = await fetch(MODEL_URL + (meta.archivo_pesos || 'eco_web_pesos.bin'));
    if (!b.ok) throw new Error(`No se pudieron cargar los pesos (HTTP ${b.status}).`);
    await useModel(meta, await b.arrayBuffer(), 'publicado con la página');
  } catch(e) {
    setStatus('off', 'No se pudo cargar el modelo publicado: ' + e.message);
  }
}

/* =========================================================
   Preparar la imagen igual que en el cuaderno:
   recorte cuadrado centrado → 224×224 → valores 0–255
   ========================================================= */
const work = document.createElement('canvas');
function cuadrado(src, w, h, size){
  const lado = Math.min(w, h), sx = (w - lado)/2, sy = (h - lado)/2;
  work.width = work.height = size;
  const g = work.getContext('2d', {willReadFrequently:true});
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(src, sx, sy, lado, lado, 0, 0, size, size);
  return work;
}
async function predecir(canvas, tta){
  const t = tf.tidy(() => {
    const x = tf.browser.fromPixels(canvas).toFloat().expandDims(0);
    let p = forward(x);
    if (tta) p = tf.div(tf.add(p, forward(tf.reverse(x, 2))), 2);   // promedio con la imagen volteada
    return p;
  });
  const out = Array.from(await t.data());   // asíncrono: la página no se congela mientras la red calcula
  t.dispose();
  return out;
}

/* =========================================================
   Mostrar el resultado
   ========================================================= */
function mostrar(p){
  const idx = p.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]).slice(0,3);
  const [conf, i0] = idx[0];
  const clase = INFO.clases[i0], bin = caneca(clase), seguro = conf >= UMBRAL;
  const r = $('result');
  r.dataset.bin = seguro ? bin : 'duda';
  $('rEyebrow').textContent = seguro ? 'Residuo detectado' : 'No estoy seguro';
  $('rClase').textContent = nombre(clase);
  $('rConf').textContent = 'Confianza: ' + fmt(conf*100,1) + ' %';
  $('rDonde').textContent = seguro
    ? `Deposítalo en: ${CANECA_TXT[bin][0]} (${CANECA_TXT[bin][1]})`
    : 'Acerca el objeto, usa un fondo liso y buena luz. Si parece ' + nombre(clase).toLowerCase() + ', iría en: ' + CANECA_TXT[bin][0] + '.';
  $('ovl').hidden = false;
  $('ovlDot').style.background = seguro ? BIN_COLOR[bin] : 'transparent';
  $('ovlTxt').textContent = seguro ? `${nombre(clase)} · ${fmt(conf*100,0)} % → ${CANECA_TXT[bin][0]}` : `¿${nombre(clase)}? ${fmt(conf*100,0)} % · acércalo más`;
  $('top3').innerHTML = idx.map(([v,i]) => {
    const c = INFO.clases[i], col = BIN_COLOR[caneca(c)];
    return `<div class="row"><span>${nombre(c)}</span><span class="bar"><span style="width:${(v*100).toFixed(1)}%;background:${col}"></span></span><span class="pct">${fmt(v*100,1)}%</span></div>`;
  }).join('');
}
function sinModelo(){
  setStatus('off', 'El modelo publicado no está disponible. Revisa la carpeta modelo/ y vuelve a desplegar en Render.');
  $('result').dataset.bin = 'duda';
  $('rEyebrow').textContent = 'Falta el modelo';
  $('rClase').textContent = 'No puedo analizar todavía';
  $('rConf').textContent = 'Confianza: —';
  $('rDonde').textContent = 'Coloca eco_web.json y eco_web_pesos.bin en la carpeta modelo/ del proyecto y vuelve a publicar en Render.';
  $('ovl').hidden = false; $('ovlDot').style.background = 'transparent';
  $('ovlTxt').textContent = 'Falta el modelo: cárgalo para detectar';
}

/* =========================================================
   Cámara en vivo
   ========================================================= */
let stream = null, facing = 'environment', running = false, frozen = false, busy = false, ema = null;
const video = $('video'), stage = $('stage'), shot = $('shot');

function camMsg(t){ const m=$('camMsg'); m.hidden = !t; m.innerHTML = t || ''; }
async function startCam(){
  camMsg('');
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    camMsg(location.protocol !== 'https:' && location.hostname !== 'localhost'
      ? 'La cámara solo funciona si la página se abre con <b>https://</b>. Publícala (por ejemplo en GitHub Pages o Netlify) o usa <b>Subir o tomar foto</b>.'
      : 'Este navegador no permite usar la cámara aquí. Usa <b>Subir o tomar foto</b>: en el celular abre la cámara directamente.');
    return;
  }
  try {
    stopCam();
    stream = await navigator.mediaDevices.getUserMedia({audio:false, video:{facingMode:{ideal:facing}, width:{ideal:1280}, height:{ideal:720}}});
    video.srcObject = stream; await video.play();
    video.style.transform = facing === 'user' ? 'scaleX(-1)' : '';
    stage.classList.add('live'); unfreeze();
    $('btnCam').querySelector('span').textContent = 'Apagar cámara';
    $('btnSnap').disabled = false;
    const cams = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
    $('btnFlip').disabled = cams.length < 2;
    loop();
  } catch(err){
    stream = null;
    const msg = {NotAllowedError:'Se negó el permiso de la cámara. Actívalo en el candado de la barra de direcciones y vuelve a intentar.', NotFoundError:'No se encontró ninguna cámara en este dispositivo.', NotReadableError:'Otra aplicación está usando la cámara. Ciérrala y vuelve a intentar.', SecurityError:'Esta vista no permite la cámara. Abre la página publicada en su propia pestaña o usa Subir o tomar foto.'}[err.name];
    camMsg((msg || 'No se pudo abrir la cámara (' + err.name + ').') + ' Mientras tanto puedes usar <b>Subir o tomar foto</b>.');
  }
}
function stopCam(){
  running = false;
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null; video.srcObject = null;
  stage.classList.remove('live');
  $('btnCam').querySelector('span').textContent = 'Encender cámara';
  $('btnSnap').disabled = true; $('btnFlip').disabled = true;
}
async function loop(){
  if (running) return; running = true; ema = null;
  let last = 0;
  const tick = async (t) => {
    if (!running || !stream) { running = false; return; }
    if (!frozen && !busy && MODEL && video.readyState >= 2 && t - last > PREDICT_INTERVAL_MS){
      last = t; busy = true;
      const c = cuadrado(video, video.videoWidth, video.videoHeight, INFO.img);
      const p = await predecir(c, false);
      busy = false;
      if (!frozen && running){
        ema = ema ? ema.map((v,i)=>0.65*v + 0.35*p[i]) : p;   // promedio móvil: el resultado no salta
        mostrar(ema);
      }
    } else if (!MODEL && !frozen && t - last > 1000) { last = t; sinModelo(); }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function freezeFrom(src, w, h, mirror){
  const lado = Math.min(w,h);
  const g = shot.getContext('2d');
  g.save(); if (mirror){ g.translate(shot.width,0); g.scale(-1,1); }
  g.drawImage(src, (w-lado)/2, (h-lado)/2, lado, lado, 0, 0, shot.width, shot.height); g.restore();
  stage.classList.add('has-shot'); frozen = true;
  $('btnSnap').querySelector('span').textContent = 'Seguir en vivo';
  if (!MODEL) { sinModelo(); return; }
  const c = cuadrado(src, w, h, INFO.img);
  predecir(c, true).then(mostrar);
}
function unfreeze(){ frozen = false; ema = null; stage.classList.remove('has-shot'); $('btnSnap').querySelector('span').textContent = 'Capturar'; }

$('btnCam').addEventListener('click', () => stream ? stopCam() : startCam());
$('btnFlip').addEventListener('click', () => { facing = facing === 'environment' ? 'user' : 'environment'; startCam(); });
$('btnSnap').addEventListener('click', () => frozen ? unfreeze() : freezeFrom(video, video.videoWidth, video.videoHeight, facing === 'user'));

/* Foto subida o tomada con la cámara del celular */
$('fileImg').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const bmp = await createImageBitmap(f, {imageOrientation:'from-image'});   // corrige la rotación EXIF, como exif_transpose
    if (stream) { running = false; }
    stage.classList.remove('live');
    if (stream) stopCam();
    freezeFrom(bmp, bmp.width, bmp.height, false);
  } catch(err){ camMsg('No se pudo leer la imagen. Prueba con un JPG o PNG.'); }
  e.target.value = '';
});
document.addEventListener('visibilitychange', () => { if (document.hidden && stream) stopCam(); });

if (document.body.dataset.view === 'detector') {
  if (window.tf) loadInitial();
  else setStatus('off', 'No cargó TensorFlow.js. Revisa tu conexión a internet y recarga la página.');
}
