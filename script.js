/* CPP — interacción y movimiento.
   Sin GSAP ni Lenis: IntersectionObserver, un único bucle de scroll y three.js bajo demanda.
   Las lecturas del DOM van siempre antes que las escrituras para no recalcular el layout en cada frame. */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
/* Velocidades calibradas a 144 Hz e independientes de la tasa de refresco del monitor. */
const FRAME = 1000 / 144;

const fx = new Map();
const fxOf = (element) => {
  let value = fx.get(element);
  if (!value) {
    value = { off: 0, rx: 0, ry: 0 };
    fx.set(element, value);
  }
  return value;
};

/* Parallax y tilt actúan sobre el mismo elemento: se combinan en un solo transform en vez de pisarse. */
const applyFx = (element) => {
  const value = fxOf(element);
  const tilt = value.rx || value.ry
    ? ` perspective(1100px) rotateY(${value.ry.toFixed(2)}deg) rotateX(${value.rx.toFixed(2)}deg)`
    : '';
  element.style.transform = `translate3d(0, ${value.off.toFixed(1)}px, 0)${tilt}`;
};

document.querySelector('[data-year]').textContent = new Date().getFullYear();

/* ── Menú móvil ── */
const menuButton = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');

const closeMenu = () => {
  menuButton?.setAttribute('aria-expanded', 'false');
  siteNav?.classList.remove('open');
  document.body.classList.remove('menu-open');
};

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  siteNav.classList.toggle('open', !isOpen);
  document.body.classList.toggle('menu-open', !isOpen);
});

siteNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

/* ── El enlace de cada servicio preselecciona el formulario ── */
document.querySelectorAll('[data-service]').forEach((link) => {
  link.addEventListener('click', () => {
    const select = document.querySelector('#service');
    if (select) select.value = link.dataset.service;
  });
});

/* ── Acordeones: solo uno abierto por columna ── */
document.querySelectorAll('.service-list details').forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    item.closest('.service-list').querySelectorAll('details').forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

/* ── Apariciones al hacer scroll ── */
const revealNodes = [...document.querySelectorAll('[data-reveal]')];
let revealObserver = null;
let showReveal = null;
let sweepTimer = 0;

const initReveal = () => {
  if (!revealNodes.length) return;
  if (reduceMotion) {
    revealNodes.forEach((node) => { node.style.opacity = '1'; node.style.transform = 'none'; });
    return;
  }

  revealNodes.forEach((node) => {
    /* Sin will-change permanente: el navegador crea la capa solo mientras dura la transición. */
    node.style.opacity = '0';
    node.style.transform = 'translate3d(0, 34px, 0)';
    node.style.transition = 'opacity .9s cubic-bezier(.2,.7,.2,1) var(--rd, 0s), transform .9s cubic-bezier(.16,.86,.26,1) var(--rd, 0s)';
    const step = Number(node.getAttribute('data-reveal')) || 0;
    node.style.setProperty('--rd', `${(step * 0.085).toFixed(3)}s`);
    const line = node.querySelector('[data-line]');
    if (line) { line.style.transformOrigin = 'left'; line.style.transform = 'scaleX(0)'; }
  });

  showReveal = (node) => {
    if (node.dataset.revealed === '1') return;
    node.dataset.revealed = '1';
    node.style.opacity = '1';
    node.style.transform = 'none';
    const line = node.querySelector('[data-line]');
    if (line) { line.style.transition = 'transform 1s cubic-bezier(.2,.7,.2,1) .15s'; line.style.transform = 'scaleX(1)'; }
  };

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      showReveal(entry.target);
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

  revealNodes.forEach((node) => revealObserver.observe(node));
  sweepReveal();
};

/* Respaldo del observer: corre al cargar y al terminar de desplazarse, no en cada frame. */
const sweepReveal = () => {
  if (reduceMotion || !showReveal) return;
  const limit = window.innerHeight * 0.94;
  const pending = [];
  revealNodes.forEach((node) => {
    if (node.dataset.revealed === '1') return;
    const rect = node.getBoundingClientRect();
    if (rect.top < limit && rect.bottom > 0) pending.push(node);
  });
  /* Primero todas las lecturas y después las escrituras. */
  pending.forEach((node) => {
    showReveal(node);
    revealObserver?.unobserve(node);
  });
};

initReveal();

/* ── Scroll: progreso, sombra de cabecera y parallax ── */
const header = document.querySelector('[data-header]');
const progressBar = document.querySelector('[data-scroll-progress]');
const parallaxNodes = [...document.querySelectorAll('[data-parallax]')];
const boxes = new Map();
let scrollFrame = 0;
let documentHeight = 0;
let condensed = null;

/* Las posiciones se miden al cargar y cuando cambia el tamaño del documento, nunca durante el scroll.
   offsetTop ignora los transforms, así el parallax no depende de su propio desplazamiento. */
const measure = () => {
  documentHeight = document.documentElement.scrollHeight;
  parallaxNodes.forEach((node) => {
    let top = 0;
    for (let current = node; current; current = current.offsetParent) top += current.offsetTop;
    boxes.set(node, { top, height: node.offsetHeight });
  });
};

const onScrollFrame = () => {
  scrollFrame = 0;
  const y = window.scrollY || 0;
  const viewport = window.innerHeight;

  /* scaleX en lugar de width: lo resuelve el compositor, sin recalcular layout. */
  if (progressBar) {
    const ratio = Math.min(1, y / Math.max(1, documentHeight - viewport));
    progressBar.style.transform = `scaleX(${ratio.toFixed(4)})`;
  }

  const isCondensed = y > 90;
  if (header && isCondensed !== condensed) {
    condensed = isCondensed;
    header.classList.toggle('is-condensed', isCondensed);
  }

  if (!reduceMotion) {
    parallaxNodes.forEach((node) => {
      const box = boxes.get(node);
      /* Fuera de pantalla no se escribe nada; al volver se recalcula con la posición real de scroll. */
      if (!box || box.top + box.height + 200 < y || box.top - 200 > y + viewport) return;
      const value = fxOf(node);
      const speed = Number(node.getAttribute('data-parallax')) || 0;
      const offset = (box.top + box.height / 2 - y - viewport / 2) * -speed;
      if (Math.abs(offset - value.off) < 0.05) return;
      value.off = offset;
      applyFx(node);
    });
  }

  clearTimeout(sweepTimer);
  sweepTimer = setTimeout(sweepReveal, 180);
};

const requestScrollFrame = () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(onScrollFrame);
};

const onResize = () => { measure(); requestScrollFrame(); };

measure();
if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(document.body);
window.addEventListener('scroll', requestScrollFrame, { passive: true });
window.addEventListener('resize', onResize, { passive: true });
onScrollFrame();

/* ── Marquesina, badges y pulsos: en pausa cuando su sección no está a la vista ── */
if ('IntersectionObserver' in window) {
  const scopeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.removeAttribute('data-anim-off');
      else entry.target.setAttribute('data-anim-off', '');
    });
  });
  document.querySelectorAll('[data-anim-scope]').forEach((scope) => scopeObserver.observe(scope));
}

/* ── Navegación activa ── */
const navigationLinks = [...document.querySelectorAll('.site-nav a')];
const navigationSections = navigationLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window) {
  const navigationObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navigationLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50%', threshold: 0 });
  navigationSections.forEach((section) => navigationObserver.observe(section));
}

/* ── Puntero: aura, spotlight, tilt y botones magnéticos ── */
if (!reduceMotion && finePointer) {
  const aura = document.querySelector('[data-aura]');
  const tiltBox = document.querySelector('[data-tilt]');
  const tiltTarget = tiltBox?.firstElementChild;
  const tiltFx = tiltTarget ? fxOf(tiltTarget) : null;

  const spots = [...document.querySelectorAll('[data-spot]')]
    .map((element) => ({ element, target: element.querySelector('[data-spot-bg]') || element }));
  const nearby = new Set();
  const spotObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const spot = spots.find((item) => item.element === entry.target);
      if (!spot) return;
      if (entry.isIntersecting) nearby.add(spot);
      else nearby.delete(spot);
    });
  }, { rootMargin: '60px' });
  spots.forEach((spot) => spotObserver.observe(spot.element));

  /* Botones magnéticos por delegación: no hace falta un listener por botón. */
  const baseTransition = (element) => {
    if (element.dataset.baseTransition === undefined) {
      element.dataset.baseTransition = element.style.transition || '';
    }
    return element.dataset.baseTransition;
  };
  const setMoveTransition = (element, value) => {
    const keep = baseTransition(element)
      .split(/,(?![^(]*\))/)
      .map((part) => part.trim())
      .filter((part) => part && !part.startsWith('transform'));
    element.style.transition = keep.concat(value).join(', ');
  };
  const grabMagnet = (element) => {
    setMoveTransition(element, 'transform .18s cubic-bezier(.2,.7,.2,1)');
    const sheen = element.querySelector('[data-sheen]');
    if (sheen) sheen.style.animation = 'cpp-sheen .9s ease';
  };
  const releaseMagnet = (element) => {
    setMoveTransition(element, 'transform .5s cubic-bezier(.2,.9,.2,1)');
    element.style.transform = 'translate3d(0, 0, 0)';
    const sheen = element.querySelector('[data-sheen]');
    if (sheen) sheen.style.animation = 'none';
  };

  let pointerX = 0, pointerY = 0, auraX = 0, auraY = 0;
  let targetRx = 0, targetRy = 0, lastTick = 0;
  let fresh = false, outside = false, auraVisible = false;
  let eventTarget = null, magnet = null, pointerFrame = 0;

  const tick = (now) => {
    pointerFrame = 0;
    const k = lastTick ? Math.min(64, now - lastTick) / FRAME : 1;
    lastTick = now;
    let again = false;

    if (fresh) {
      fresh = false;
      /* 1) lecturas */
      const hits = [];
      if (!outside) {
        nearby.forEach((spot) => {
          const rect = spot.element.getBoundingClientRect();
          if (pointerX >= rect.left - 60 && pointerX <= rect.right + 60 && pointerY >= rect.top - 60 && pointerY <= rect.bottom + 60) {
            hits.push({ spot, rect });
          }
        });
      }
      const tiltRect = tiltBox && !outside ? tiltBox.getBoundingClientRect() : null;
      const nextMagnet = !outside && eventTarget?.closest ? eventTarget.closest('[data-magnetic]') : null;
      const magnetRect = nextMagnet ? nextMagnet.getBoundingClientRect() : null;

      /* 2) escrituras */
      hits.forEach(({ spot, rect }) => {
        spot.target.style.setProperty('--mx', `${(((pointerX - rect.left) / rect.width) * 100).toFixed(1)}%`);
        spot.target.style.setProperty('--my', `${(((pointerY - rect.top) / rect.height) * 100).toFixed(1)}%`);
      });

      const inside = !!tiltRect && pointerX > tiltRect.left && pointerX < tiltRect.right && pointerY > tiltRect.top && pointerY < tiltRect.bottom;
      targetRy = inside ? ((pointerX - tiltRect.left) / tiltRect.width - 0.5) * 5 : 0;
      targetRx = inside ? -((pointerY - tiltRect.top) / tiltRect.height - 0.5) * 4 : 0;

      if (magnet && magnet !== nextMagnet) releaseMagnet(magnet);
      if (nextMagnet) {
        if (nextMagnet !== magnet) grabMagnet(nextMagnet);
        const dx = (pointerX - (magnetRect.left + magnetRect.width / 2)) / magnetRect.width;
        const dy = (pointerY - (magnetRect.top + magnetRect.height / 2)) / magnetRect.height;
        nextMagnet.style.transform = `translate3d(${(dx * 7).toFixed(1)}px, ${(dy * 5).toFixed(1)}px, 0)`;
      }
      magnet = nextMagnet;
    }

    if (aura && !outside && (auraX !== pointerX || auraY !== pointerY)) {
      const ease = 1 - Math.pow(0.88, k);
      auraX += (pointerX - auraX) * ease;
      auraY += (pointerY - auraY) * ease;
      aura.style.transform = `translate3d(${auraX.toFixed(1)}px, ${auraY.toFixed(1)}px, 0)`;
      if (Math.abs(pointerX - auraX) + Math.abs(pointerY - auraY) > 0.4) again = true;
    }

    if (tiltFx && (tiltFx.rx !== targetRx || tiltFx.ry !== targetRy)) {
      const ease = 1 - Math.pow(0.938, k);
      tiltFx.rx += (targetRx - tiltFx.rx) * ease;
      tiltFx.ry += (targetRy - tiltFx.ry) * ease;
      if (Math.abs(targetRx - tiltFx.rx) + Math.abs(targetRy - tiltFx.ry) < 0.02) {
        tiltFx.rx = targetRx;
        tiltFx.ry = targetRy;
      } else {
        again = true;
      }
      applyFx(tiltTarget);
    }

    if (again) pointerFrame = requestAnimationFrame(tick);
    else lastTick = 0;
  };

  const schedule = () => { if (!pointerFrame) pointerFrame = requestAnimationFrame(tick); };

  window.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    eventTarget = event.target;
    fresh = true;
    outside = false;
    if (aura && !auraVisible) { auraVisible = true; aura.style.opacity = '1'; }
    schedule();
  }, { passive: true });

  document.addEventListener('pointerout', (event) => {
    if (event.relatedTarget) return;
    outside = true;
    fresh = true;
    schedule();
  }, { passive: true });
}

/* ── El símbolo de la cabecera se arma al cargar ── */
if (!reduceMotion) {
  const origins = [[0, -18], [-16, 10], [16, 10]];
  document.querySelectorAll('[data-mod]').forEach((module, index) => {
    module.style.opacity = '0';
    module.style.transform = `translate(${origins[index][0]}px, ${origins[index][1]}px)`;
    requestAnimationFrame(() => {
      const delay = index * 0.11 + 0.15;
      module.style.transition = `opacity .5s ease ${delay}s, transform .65s cubic-bezier(.16,.86,.26,1) ${delay}s`;
      module.style.opacity = '1';
      module.style.transform = 'translate(0, 0)';
    });
  });
}

/* ── Ficha de cada socio ── */
const roster = document.querySelector('[data-roster]');
if (roster) {
  const partners = [
    { name: 'José Santana', initials: 'JS' },
    { name: 'Darnell Cuba', initials: 'DC' },
    { name: 'Juan Flores', initials: 'JF' }
  ];
  const dialog = roster.querySelector('[data-partner-dialog]');
  const overlay = roster.querySelector('[data-partner-overlay]');
  const rows = [...roster.querySelectorAll('[data-partner]')];
  const closeButton = dialog.querySelector('[data-partner-close]');
  let lastTrigger = null;

  const closePartner = () => {
    dialog.hidden = true;
    overlay.hidden = true;
    roster.classList.remove('is-open');
    rows.forEach((row) => row.classList.remove('is-active'));
    lastTrigger?.focus();
    lastTrigger = null;
  };

  const openPartner = (index, trigger) => {
    const partner = partners[index];
    if (!partner) return;
    dialog.querySelector('[data-partner-name]').textContent = partner.name;
    dialog.querySelector('[data-partner-initials]').textContent = partner.initials;
    dialog.querySelector('[data-partner-index]').textContent = `partner 0${index + 1}`;
    rows.forEach((row) => row.classList.toggle('is-active', Number(row.dataset.partner) === index));
    roster.classList.add('is-open');
    overlay.hidden = false;
    dialog.hidden = false;
    lastTrigger = trigger;
    closeButton.focus();
  };

  roster.querySelectorAll('[data-partner-open]').forEach((button) => {
    button.addEventListener('click', () => openPartner(Number(button.dataset.partnerOpen), button));
  });
  roster.querySelectorAll('[data-partner-close]').forEach((button) => {
    button.addEventListener('click', closePartner);
  });
  overlay.addEventListener('click', closePartner);

  document.addEventListener('keydown', (event) => {
    if (dialog.hidden) return;
    if (event.key === 'Escape') { closePartner(); return; }
    if (event.key !== 'Tab') return;
    /* El foco se queda dentro de la ficha mientras está abierta. */
    const focusable = [...dialog.querySelectorAll('button, a[href]')].filter((node) => !node.hidden);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
}

/* ── Formulario ── */
const form = document.querySelector('#quote-form');
const startedAt = Date.now();

const validationMessages = {
  name: 'Escribe tu nombre.',
  email: 'Escribe un correo válido.',
  phone: 'Escribe un teléfono o WhatsApp.',
  service: 'Selecciona el servicio que necesitas.',
  message: 'Cuéntanos un poco más. Usa al menos 20 caracteres.',
  privacy: 'Necesitamos tu aceptación para procesar la solicitud.'
};

const showFieldState = (field) => {
  const error = document.querySelector(`#${field.id}-error`);
  if (!error) return field.validity.valid;
  error.textContent = field.validity.valid ? '' : validationMessages[field.id];
  field.setAttribute('aria-invalid', String(!field.validity.valid));
  if (!field.validity.valid) field.setAttribute('aria-describedby', error.id);
  else field.removeAttribute('aria-describedby');
  return field.validity.valid;
};

form?.querySelectorAll('[required]').forEach((field) => {
  field.addEventListener('blur', () => showFieldState(field));
  field.addEventListener('input', () => {
    if (field.getAttribute('aria-invalid') === 'true') showFieldState(field);
  });
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const requiredFields = [...form.querySelectorAll('[required]')];
  const isValid = requiredFields.map(showFieldState).every(Boolean);
  const status = form.querySelector('.form-status');
  const button = form.querySelector('.submit-button');
  const honeypot = form.querySelector('#website').value;

  status.className = 'form-status';
  if (!isValid) {
    status.textContent = 'Revisa los campos marcados antes de continuar.';
    status.classList.add('error');
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  if (honeypot || Date.now() - startedAt < 2500) {
    status.textContent = 'No pudimos validar el envío. Inténtalo de nuevo.';
    status.classList.add('error');
    return;
  }

  button.disabled = true;
  button.textContent = 'Enviando...';

  try {
    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      await new Promise((resolve) => setTimeout(resolve, 650));
      status.textContent = 'Formulario validado. Añade tu endpoint en data-endpoint para recibir solicitudes reales.';
      status.classList.add('success');
      return;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });

    if (!response.ok) throw new Error('Request failed');
    form.reset();
    status.textContent = 'Recibimos tu solicitud. Nos pondremos en contacto contigo.';
    status.classList.add('success');
  } catch {
    status.textContent = 'No pudimos enviar la solicitud. Inténtalo de nuevo o usa otro canal de contacto.';
    status.classList.add('error');
  } finally {
    button.disabled = false;
    button.textContent = 'Solicitar propuesta';
  }
});

/* ── Escenas 3D (three.js bajo demanda) ── */
const symbolCanvas = document.querySelector('[data-3d="symbol"]');
const panelsCanvas = document.querySelector('[data-3d="panels"]');
const accentColor = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#1d5ae0';

const buildSymbolScene = (THREE, canvas) => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(0, 0.1, 8.6);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(5, 7, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(new THREE.Color(accentColor()), 1.5);
  rim.position.set(-6, -2, 3);
  scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);
  const polygons = [
    [[64, 8], [112, 36], [90, 49], [64, 34], [42, 47], [20, 34]],
    [[20, 34], [42, 47], [42, 83], [64, 96], [64, 121], [20, 95]],
    [[64, 96], [86, 83], [86, 60], [108, 47], [108, 96], [64, 121]]
  ];
  const materials = [
    new THREE.MeshStandardMaterial({ color: new THREE.Color(accentColor()), metalness: 0.25, roughness: 0.2 }),
    new THREE.MeshStandardMaterial({ color: 0x0c1d2b, metalness: 0.4, roughness: 0.45 }),
    new THREE.MeshStandardMaterial({ color: 0x9aafb9, metalness: 0.65, roughness: 0.28 })
  ];
  const modules = polygons.map((polygon, index) => {
    const shape = new THREE.Shape(polygon.map((point) => new THREE.Vector2((point[0] - 64) / 26, (64 - point[1]) / 26)));
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.026, bevelSize: 0.026, bevelSegments: 2 });
    const mesh = new THREE.Mesh(geometry, materials[index]);
    mesh.position.z = -0.2;
    group.add(mesh);
    return mesh;
  });
  const directions = [[0, 0.34, 0.1], [-0.3, -0.16, 0.1], [0.3, -0.16, 0.1]];

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(3.1, 0.012, 8, 128),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(accentColor()), transparent: true, opacity: 0.5 })
  );
  halo.rotation.x = Math.PI / 2.3;
  scene.add(halo);

  const state = { rx: -0.12, ry: -0.5, tx: -0.12, ty: -0.5, drag: false, px: 0, py: 0, spread: 0, want: 0, auto: true };
  canvas.addEventListener('pointerdown', (event) => {
    state.drag = true;
    state.auto = false;
    state.px = event.clientX;
    state.py = event.clientY;
    canvas.style.cursor = 'grabbing';
    canvas.setPointerCapture(event.pointerId);
    const hint = document.querySelector('[data-3d-hint]');
    if (hint) { hint.style.transition = 'opacity .4s ease'; hint.style.opacity = '0'; }
  });
  canvas.addEventListener('pointermove', (event) => {
    state.want = 1;
    if (!state.drag) {
      const rect = canvas.getBoundingClientRect();
      state.tx = -0.12 + ((event.clientY - rect.top) / rect.height - 0.5) * 0.5;
      return;
    }
    state.ty += (event.clientX - state.px) * 0.008;
    state.tx += (event.clientY - state.py) * 0.006;
    state.tx = Math.max(-0.7, Math.min(0.7, state.tx));
    state.px = event.clientX;
    state.py = event.clientY;
  });
  const release = () => {
    state.drag = false;
    canvas.style.cursor = 'grab';
    setTimeout(() => { state.auto = true; }, 1400);
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => { state.want = 0; release(); });

  return {
    canvas, renderer, scene, camera, visible: false,
    resize() {
      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    update(time, k) {
      if (state.auto && !state.drag) state.ty += 0.0035 * k;
      state.rx += (state.tx - state.rx) * (1 - Math.pow(0.93, k));
      state.ry += (state.ty - state.ry) * (1 - Math.pow(0.91, k));
      group.rotation.x = state.rx;
      group.rotation.y = state.ry;
      group.position.y = Math.sin(time * 0.6) * 0.09;
      state.spread += (state.want * 0.26 - state.spread) * (1 - Math.pow(0.94, k));
      modules.forEach((mesh, index) => {
        mesh.position.set(
          directions[index][0] * state.spread,
          directions[index][1] * state.spread,
          -0.2 + directions[index][2] * state.spread + Math.sin(time * 0.9 + index) * 0.02
        );
      });
      halo.rotation.z = time * 0.12;
      halo.position.y = Math.sin(time * 0.5) * 0.1;
    }
  };
};

const buildPanelsScene = (THREE, canvas) => {
  /* Paneles translúcidos y difusos: sin antialias y a 1x se ven igual y cuestan varias veces menos a la GPU. */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setPixelRatio(1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80);
  camera.position.set(0, 0, 10);
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(3, 5, 6);
  scene.add(key);

  const group = new THREE.Group();
  scene.add(group);
  const accent = new THREE.Color(accentColor());
  const specs = [
    [4.2, 1.9, -1.2, -1.4, 0.1, 1.8, 2.4],
    [5.6, -0.4, -2.2, -0.6, 0.08, 2.6, 1.8],
    [3.1, 2.9, -0.4, -2.6, 0.11, 1.2, 1.6],
    [6.4, -2.6, -1.6, 0.4, 0.07, 2.2, 2.8],
    [-4.8, 2.4, -2.8, -3.4, 0.07, 1.6, 1.3]
  ];
  const items = specs.map((spec) => {
    const material = new THREE.MeshStandardMaterial({ color: accent.clone(), transparent: true, opacity: spec[4], roughness: 0.08, metalness: 0.1, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(spec[5], spec[6], 0.05), material);
    mesh.position.set(spec[0], spec[1], spec[2] + spec[3] * 0.4);
    mesh.rotation.set(0.1, spec[3] * 0.12, spec[3] * 0.05);
    group.add(mesh);
    return { mesh, base: mesh.position.clone(), seed: spec[3] };
  });

  let mx = 0, my = 0, targetX = 0, targetY = 0;
  const onMove = (event) => {
    targetX = (event.clientX / window.innerWidth - 0.5) * 2;
    targetY = (event.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  requestAnimationFrame(() => { canvas.style.opacity = '1'; });

  return {
    canvas, renderer, scene, camera, visible: false,
    resize() {
      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    update(time, k) {
      const ease = 1 - Math.pow(0.95, k);
      mx += (targetX - mx) * ease;
      my += (targetY - my) * ease;
      group.rotation.y = mx * 0.16;
      group.rotation.x = -my * 0.1;
      const scroll = (window.scrollY || 0) * 0.0012;
      items.forEach((item) => {
        item.mesh.position.y = item.base.y + Math.sin(time * 0.35 + item.seed) * 0.28 + scroll * (1 + item.seed * 0.2);
        item.mesh.rotation.z = item.seed * 0.05 + Math.sin(time * 0.2 + item.seed) * 0.04;
      });
    }
  };
};

const initScenes = (THREE, wantPanels) => {
  const scenes = [];
  if (symbolCanvas) scenes.push(buildSymbolScene(THREE, symbolCanvas));
  if (panelsCanvas && wantPanels) scenes.push(buildPanelsScene(THREE, panelsCanvas));
  if (!scenes.length) return;

  /* Un único bucle que se detiene cuando ningún canvas está a la vista. */
  let running = 0;
  let last = 0;
  const loop = (time) => {
    const live = scenes.filter((scene) => scene.visible);
    if (!live.length) { running = 0; return; }
    running = requestAnimationFrame(loop);
    /* Tope ~90 fps: en monitores de 120/144 Hz se dibuja un frame de cada dos. */
    if (last && time - last < 10.5) return;
    const k = last ? Math.min(64, time - last) / FRAME : 1;
    last = time;
    live.forEach((scene) => {
      scene.update(time / 1000, k);
      scene.renderer.render(scene.scene, scene.camera);
    });
  };
  const kick = () => { if (!running) { last = 0; running = requestAnimationFrame(loop); } };

  const resizeObserver = new ResizeObserver(() => scenes.forEach((scene) => scene.resize()));
  const visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const scene = scenes.find((item) => item.canvas === entry.target);
      if (scene) scene.visible = entry.isIntersecting;
    });
    kick();
  }, { rootMargin: '120px' });

  scenes.forEach((scene) => {
    scene.resize();
    /* Compilar los shaders ahora, en reposo, evita el tirón al llegar a la sección. */
    try { scene.renderer.compile(scene.scene, scene.camera); } catch { /* se compilan al dibujar */ }
    resizeObserver.observe(scene.canvas);
    visibilityObserver.observe(scene.canvas);
  });
};

if (!reduceMotion && (symbolCanvas || panelsCanvas)) {
  /* Los paneles del hero son decorativos: no se dibujan en táctiles, pantallas angostas ni equipos modestos. */
  const modest = !finePointer
    || window.matchMedia('(max-width: 900px)').matches
    || (navigator.hardwareConcurrency || 8) <= 4
    || Boolean(navigator.connection?.saveData);
  const idle = (callback, timeout) => (window.requestIdleCallback
    ? window.requestIdleCallback(callback, { timeout })
    : setTimeout(callback, 200));

  /* three.js se descarga cuando el navegador queda libre, sin competir con la primera pintura. */
  idle(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js';
    script.onload = () => idle(() => {
      try { initScenes(window.THREE, !modest); } catch { /* sin 3D, la página sigue */ }
    }, 800);
    document.head.appendChild(script);
  }, modest ? 2500 : 1200);
}
