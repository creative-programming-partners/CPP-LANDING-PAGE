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

const pageLoader = document.querySelector('[data-loader]');
const cursorAura = document.querySelector('[data-cursor-aura]');

const hideLoader = () => pageLoader?.classList.add('is-finished');

const prepareSplitWords = () => {
  document.querySelectorAll('[data-split-words]').forEach((element) => {
    const phrase = element.textContent.trim();
    element.setAttribute('aria-label', phrase);
    element.textContent = '';
    phrase.split(/\s+/).forEach((word) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = word;
      element.append(span, ' ');
    });
  });
};

prepareSplitWords();

const initPremiumMotion = () => {
  if (reducedMotion || !window.gsap || !window.ScrollTrigger) {
    document.querySelectorAll('.manifesto .word').forEach((word) => {
      word.style.opacity = '1';
    });
    hideLoader();
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    const lenis = new window.Lenis({
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: .92,
      anchors: true
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target, { offset: -92, duration: 1.1 });
      });
    });
  }

  const loaderTimeline = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: hideLoader
  });

  loaderTimeline
    .from('.loader-piece-a', { y: -24, x: 18, opacity: 0, duration: .55 })
    .from('.loader-piece-b', { x: -24, y: 18, opacity: 0, duration: .55 }, '-=.42')
    .from('.loader-piece-c', { x: 24, y: 18, opacity: 0, duration: .55 }, '-=.42')
    .from('.loader-mark span', { y: 12, opacity: 0, duration: .45 }, '-=.22')
    .to('.page-loader', { yPercent: -100, duration: .8, ease: 'power4.inOut' }, '+=.15');

  gsap.timeline({ delay: .72, defaults: { ease: 'power4.out' } })
    .from('.hero-kicker', { y: 22, opacity: 0, duration: .7 })
    .from('#hero-title', { y: 70, opacity: 0, duration: 1.05 }, '-=.45')
    .from('.hero-lede', { y: 30, opacity: 0, duration: .75 }, '-=.65')
    .from('.hero-actions > *', { y: 20, opacity: 0, duration: .65, stagger: .1 }, '-=.55')
    .from('.hero-assurance li', { y: 18, opacity: 0, duration: .6, stagger: .09 }, '-=.45');

  gsap.fromTo('.hero-visual img',
    { scale: 1.16, yPercent: -2 },
    {
      scale: 1.03,
      yPercent: 7,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.1
      }
    }
  );

  gsap.to('.manifesto .word', {
    opacity: 1,
    y: 0,
    stagger: .07,
    ease: 'none',
    scrollTrigger: {
      trigger: '.manifesto',
      start: 'top 72%',
      end: 'bottom 54%',
      scrub: .8
    }
  });

  gsap.from('.manifesto-foot span', {
    y: 24,
    opacity: 0,
    stagger: .12,
    duration: .8,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.manifesto-foot', start: 'top 84%', once: true }
  });

  gsap.utils.toArray('.benefit-grid article').forEach((card, index) => {
    gsap.from(card, {
      y: 42 + (index % 2) * 22,
      opacity: 0,
      duration: .9,
      ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 88%', once: true }
    });
  });

  const motionMedia = gsap.matchMedia();
  motionMedia.add('(min-width: 821px)', () => {
    const processHeading = document.querySelector('.process .section-heading');
    if (processHeading) {
      ScrollTrigger.create({
        trigger: '.process',
        start: 'top top+=110',
        end: 'bottom bottom-=110',
        pin: processHeading,
        pinSpacing: false,
        anticipatePin: 1
      });
    }
  });

  gsap.utils.toArray('.process-track li').forEach((step) => {
    gsap.timeline({
      scrollTrigger: {
        trigger: step,
        start: 'top 72%',
        end: 'bottom 35%',
        scrub: .7
      }
    })
      .to(step, { opacity: 1, duration: .55, ease: 'none' })
      .to(step, { opacity: .42, duration: .45, ease: 'none' });
  });

  gsap.utils.toArray('.project-media img').forEach((image) => {
    gsap.timeline({
      scrollTrigger: {
        trigger: image.closest('article, .project-feature'),
        start: 'top bottom',
        end: 'bottom top',
        scrub: .8
      }
    })
      .fromTo(image, { scale: .88, opacity: .45 }, { scale: 1, opacity: 1, duration: .55, ease: 'none' })
      .to(image, { scale: 1.045, opacity: .58, filter: 'brightness(.72)', duration: .45, ease: 'none' });
  });

  document.querySelectorAll('.service-list details').forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      gsap.fromTo(item.querySelectorAll('.service-body > *'),
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: .55, stagger: .06, ease: 'power3.out' }
      );
    });
  });

  if (cursorAura && window.matchMedia('(pointer: fine)').matches) {
    const moveX = gsap.quickTo(cursorAura, 'x', { duration: .55, ease: 'power3.out' });
    const moveY = gsap.quickTo(cursorAura, 'y', { duration: .55, ease: 'power3.out' });
    window.addEventListener('pointermove', (event) => {
      moveX(event.clientX);
      moveY(event.clientY);
    }, { passive: true });
  }

  const header = document.querySelector('[data-header]');
  ScrollTrigger.create({
    start: 90,
    end: 'max',
    onUpdate: () => header?.classList.toggle('is-condensed', window.scrollY > 90)
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
};

if (document.readyState === 'complete') initPremiumMotion();
else window.addEventListener('load', initPremiumMotion, { once: true });
