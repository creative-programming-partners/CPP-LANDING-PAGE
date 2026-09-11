const menuButton = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const form = document.querySelector('#quote-form');
const startedAt = Date.now();

document.querySelector('[data-year]').textContent = new Date().getFullYear();

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

document.querySelectorAll('[data-service]').forEach((link) => {
  link.addEventListener('click', () => {
    const select = document.querySelector('#service');
    select.value = link.dataset.service;
  });
});

document.querySelectorAll('.service-list details').forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    item.closest('.service-list').querySelectorAll('details').forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

const revealItems = document.querySelectorAll('.reveal');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('IntersectionObserver' in window && !reducedMotion) {
  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      activeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const scrollProgress = document.querySelector('[data-scroll-progress]');
let scrollTicking = false;

const updateScrollProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
  scrollProgress?.style.setProperty('width', `${progress * 100}%`);
  scrollTicking = false;
};

window.addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  window.requestAnimationFrame(updateScrollProgress);
}, { passive: true });
updateScrollProgress();

document.querySelectorAll('[data-spotlight]').forEach((item) => {
  item.addEventListener('pointermove', (event) => {
    const bounds = item.getBoundingClientRect();
    item.style.setProperty('--spot-x', `${event.clientX - bounds.left}px`);
    item.style.setProperty('--spot-y', `${event.clientY - bounds.top}px`);
  });
});

if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
  const tiltTarget = document.querySelector('[data-tilt]');
  const tiltFrame = tiltTarget?.querySelector('.visual-frame');

  tiltTarget?.addEventListener('pointermove', (event) => {
    const bounds = tiltTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    tiltFrame?.style.setProperty('--tilt-x', `${x * 5}deg`);
    tiltFrame?.style.setProperty('--tilt-y', `${y * -5}deg`);
  });

  tiltTarget?.addEventListener('pointerleave', () => {
    tiltFrame?.style.setProperty('--tilt-x', '0deg');
    tiltFrame?.style.setProperty('--tilt-y', '0deg');
  });

  document.querySelectorAll('[data-magnetic]').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      const bounds = button.getBoundingClientRect();
      const x = (event.clientX - bounds.left - bounds.width / 2) * .08;
      const y = (event.clientY - bounds.top - bounds.height / 2) * .12;
      button.style.transform = `translate(${x}px, ${y}px)`;
    });
    button.addEventListener('pointerleave', () => button.style.removeProperty('transform'));
  });
}

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
  }, { rootMargin: '-30% 0px -60%', threshold: 0 });
  navigationSections.forEach((section) => navigationObserver.observe(section));
}

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
