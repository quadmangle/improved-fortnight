// This file contains the main logic for page-specific dynamic content and modals.

// Grab the translation data from langtheme.js (which is loaded first).
// The `translations` object contains all service card and modal data.
// We assume `translations` and `currentLanguage` are globally available after langtheme.js loads.

// CSRF token retrieved from the server. Updated after each request.
let csrfToken = '';

function createModal(serviceKey, lang) {
  const modalRoot = document.getElementById('modal-root');
  const serviceData = translations.services[serviceKey];
  const modalData = serviceData[lang].modal;
  if (!modalData) return;
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'ops-modal';

  // Build the modal HTML with new buttons in the footer
  modalContent.innerHTML = `
    <button class="close-modal" aria-label="Close modal">×</button>
    <div class="modal-header">
      <img src="${serviceData.img}" alt="${modalData.imgAlt}" class="modal-img">
      <h3 class="modal-title">${modalData.title}</h3>
    </div>
    <div class="modal-content-body">
      <p>${modalData.content}</p>
      <ul class="modal-features">
        ${modalData.features.map(feature => `<li>${feature}</li>`).join('')}
      </ul>
    </div>
    <div class="modal-actions">
      <a href="${serviceData.learn}" class="modal-btn learn-more" data-key="modal-learn-more"></a>
    </div>
  `;

  // Append modal directly to the modal root
  modalRoot.appendChild(modalContent);

  // Make the modal draggable
  makeDraggable(modalContent);

  // Update button text with translations
  updateModalContent(modalContent, lang);

  // Add event listener to close button
  modalContent.querySelector('.close-modal').addEventListener('click', closeModal);

  // Close modal on Escape key
  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  };
  document.addEventListener('keydown', handleKeydown);

  // Close modal when clicking outside of it
  function handleOutsideClick(event) {
    if (!modalContent.contains(event.target)) {
      closeModal();
    }
  }
  document.addEventListener('click', handleOutsideClick);
  function closeModal() {
    modalRoot.innerHTML = '';
    document.removeEventListener('click', handleOutsideClick);
    document.removeEventListener('keydown', handleKeydown);
  }
}

function makeDraggable(modal) {
  const header = modal.querySelector('.modal-header');
  if (!header) return;
  let isDragging = false;
  let offsetX, offsetY;
  header.addEventListener('mousedown', (e) => {
    isDragging = true;

    // We calculate the offset from the top-left of the modal.
    // This prevents the modal from "jumping" to the cursor position.
    offsetX = e.clientX - modal.offsetLeft;
    offsetY = e.clientY - modal.offsetTop;

    // The transform is removed to allow for smooth dragging based on top/left.
    modal.style.transform = 'none';

    // We add the listeners to the document so that dragging continues
    // even if the cursor moves outside the modal header.
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
  function onMouseMove(e) {
    if (!isDragging) return;

    // Prevent text selection during drag
    e.preventDefault();
    const newX = e.clientX - offsetX;
    const newY = e.clientY - offsetY;
    modal.style.left = `${newX}px`;
    modal.style.top = `${newY}px`;
  }

  function onMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
}

// Export the draggable helper for other modules
window.makeDraggable = makeDraggable;

// Helper function to update content inside the modal after creation
function updateModalContent(modalElement, lang) {
  const elements = modalElement.querySelectorAll('[data-key]');
  elements.forEach(el => {
    const key = el.getAttribute('data-key');
    const translation = translations[lang][key];
    if (translation) {
      el.textContent = translation;
    }
  });
}

// Basic sanitization helper
  function sanitizeInput(str) {
    // In a real application, we would use a library like DOMPurify here.
    // For now, remove any HTML tags with a simple regex fallback.
    if (typeof document !== 'undefined') {
      const div = document.createElement('div');
      if (typeof div.innerHTML === 'string') {
        div.innerHTML = str;
        return div.textContent || '';
      }
      div.textContent = str;
      return div.textContent.replace(/<[^>]*>/g, '');
    }
    return str.replace(/<[^>]*>/g, '');
  }

// Function to generate a random string for the CSRF token
function generateCsrfToken() {
  const randomBytes = new Uint8Array(32);
  window.crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// Function to set a cookie
function setCookie(name, value, days) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Strict; Secure';
}

// Function to get a cookie
function getCookie(name) {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Function to handle form submission
async function handleFormSubmit(event) {
  event.preventDefault();

  // Honeypot check: block bots that fill hidden fields
  const honeypot = event.target.querySelector('input[name="hp"]');
  if (honeypot && honeypot.value !== '') {
    console.warn('Honeypot filled. Blocking form submission.');
    event.target.reset();
    return;
  }

  const formData = new FormData(event.target);
  const hcaptchaResponse = formData.get('h-captcha-response');

  if (!hcaptchaResponse) {
    alert('Please complete the CAPTCHA.');
    return;
  }

  const sanitized = {};
  formData.forEach((value, key) => {
    if (key !== 'hp' && key !== 'h-captcha-response') {
      sanitized[key] = sanitizeInput(value);
    }
  });

  // Add CSRF token to the sanitized data.
  sanitized.csrf_token = getCookie('csrf_token');

  try {
    const response = await fetch('https://example.com/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify({ ...sanitized, 'h-captcha-response': hcaptchaResponse })
    });

    if (response.ok) {
      alert('Thank you for your submission!');
      event.target.reset();
      const dialog = event.target.closest('dialog');
      if (dialog) {
        dialog.close();
      } else {
        const modal = event.target.closest('.ops-modal');
        if (modal) {
          modal.remove();
        }
      }
    } else {
      alert('Form submission failed. Please try again.');
    }
  } catch (err) {
    console.error('Form submission failed:', err);
    // In a real application, we would send this error to a logging service.
    // logError(err);
    alert('Unable to submit form at this time.');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Generate and set the CSRF token when the page loads
  let csrfToken = generateCsrfToken();
  setCookie('csrf_token', csrfToken, 1);
  const navToggle = document.querySelector('.nav-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  // Backdrop element shown behind the mobile menu; clicking it closes the menu
  const navBackdrop = document.querySelector('.nav-backdrop');
  if (navToggle) {
    const ariaKey = navToggle.getAttribute('data-aria-label-key');
    const langData = (typeof translations !== 'undefined' && translations[currentLanguage]) || {};
    const navLabel = langData[ariaKey] || 'Menu';
    navToggle.setAttribute('aria-label', navLabel);

    const updateToggleVisibility = () => {
      navToggle.style.display = window.innerWidth <= 768 ? 'block' : 'none';
    };
    updateToggleVisibility();
    window.addEventListener('resize', updateToggleVisibility);
  }
  if (navToggle && navLinks) {
    let lastFocusedElement;
    let firstFocusable;
    let lastFocusable;

    function trapFocus(e) {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      } else if (e.key === 'Escape') {
        closeMenu();
      }
    }

    function handleClickOutside(e) {
      // Close the menu when clicking outside the nav links or on the backdrop
      if (!navLinks.contains(e.target) && e.target !== navToggle) {
        closeMenu();
      }
    }

    function openMenu() {
      navLinks.classList.add('open');
      navToggle.setAttribute('aria-expanded', 'true');
      if (navBackdrop) {
        navBackdrop.classList.add('open');
        navBackdrop.removeAttribute('hidden');
        navBackdrop.addEventListener('click', closeMenu); // Clicking the overlay closes the menu
      }
      const focusable = navLinks.querySelectorAll('a, button');
      firstFocusable = focusable[0];
      lastFocusable = focusable[focusable.length - 1];
      lastFocusedElement = document.activeElement;
      if (firstFocusable) {
        firstFocusable.focus();
      }
      document.addEventListener('keydown', trapFocus);
      document.addEventListener('click', handleClickOutside);
    }

    function closeMenu() {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      if (navBackdrop) {
        navBackdrop.classList.remove('open');
        navBackdrop.setAttribute('hidden', '');
        navBackdrop.removeEventListener('click', closeMenu);
      }
      document.removeEventListener('keydown', trapFocus);
      document.removeEventListener('click', handleClickOutside);
      if (lastFocusedElement) {
        lastFocusedElement.focus();
      }
    }

    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.contains('open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          closeMenu();
        }
      });
    });
  }

  // --- Learn More Links & Buttons ---
  // langtheme.js runs its own DOMContentLoaded handler before this script,
  // so translated text is available when wiring up the links.
  const learnMoreEls = document.querySelectorAll('.learn-more');
  learnMoreEls.forEach(el => {
    const card = el.closest('[data-service-key]');
    if (card) {
      const serviceKey = card.getAttribute('data-service-key');
      const service = translations.services[serviceKey];
      if (service && service.learn) {
        el.setAttribute('href', service.learn);
      }
      return;
    }

    const target = el.getAttribute('data-target');
    if (target) {
      el.addEventListener('click', e => {
        e.preventDefault();
        createModal(target, currentLanguage);
      });
    }
  });

  // --- CSRF Token Fetch ---
  const forms = document.querySelectorAll('form');
  try {
    const res = await fetch('/api/csrf-token', { credentials: 'include' });
    const data = await res.json();
    csrfToken = data.token;
    forms.forEach(form => {
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'csrfToken';
      hidden.value = csrfToken;
      form.appendChild(hidden);
    });
  } catch (err) {
    console.error('Failed to retrieve CSRF token', err);
  }

  // --- Form Submission Logic ---
  forms.forEach(form => {
    form.addEventListener('submit', handleFormSubmit);
  });

});
