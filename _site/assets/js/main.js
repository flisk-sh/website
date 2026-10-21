// Flisk CLI Website - Main JavaScript

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Add active class to navigation based on scroll position
function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  let current = '';

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.pageYOffset >= (sectionTop - 200)) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

window.addEventListener('scroll', updateActiveNav);
window.addEventListener('load', updateActiveNav);

// Shared navigation behavior
function initNavigation() {
  const navigation = document.querySelector('.aw-nav');
  const menuButton = navigation?.querySelector('.aw-nav-burger');
  const menu = navigation?.querySelector('.aw-nav-links');
  const exploreMenu = navigation?.querySelector('.aw-nav-more');

  if (!navigation || !menuButton || !menu || navigation.dataset.navigationReady) return;
  navigation.dataset.navigationReady = 'true';

  const closeNavigation = () => {
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation menu');
    if (exploreMenu) exploreMenu.open = false;
  };

  menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  });

  menu.addEventListener('click', event => {
    if (event.target.closest('a')) closeNavigation();
  });

  document.addEventListener('click', event => {
    if (!navigation.contains(event.target)) closeNavigation();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeNavigation();
      menuButton.focus();
    }
  });

  const updateNavigation = () => {
    navigation.classList.toggle('is-scrolled', window.scrollY > 24);
  };

  window.addEventListener('scroll', updateNavigation, { passive: true });
  updateNavigation();
}

// Copy code blocks
function addCopyButtons() {
  document.querySelectorAll('pre').forEach(pre => {
    if (pre.querySelector('.copy-code-button')) return;
    const button = document.createElement('button');
    button.className = 'btn btn-sm btn-outline-light copy-code-button';
    button.style.cssText = 'position: absolute; top: 0.5rem; right: 0.5rem; padding: 0.25rem 0.75rem; font-size: 0.75rem;';
    button.innerHTML = '<i class="bi bi-clipboard"></i>';
    button.setAttribute('aria-label', 'Copy to clipboard');

    button.addEventListener('click', () => {
      const code = pre.querySelector('code');
      const text = code ? code.innerText : pre.innerText;

      navigator.clipboard.writeText(text).then(() => {
        button.innerHTML = '<i class="bi bi-check"></i>';
        setTimeout(() => {
          button.innerHTML = '<i class="bi bi-clipboard"></i>';
        }, 2000);
      });
    });

    pre.style.position = 'relative';
    pre.appendChild(button);
  });
}

function initializeSite() {
  initNavigation();
  addCopyButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSite);
} else {
  initializeSite();
}
