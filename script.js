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
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
