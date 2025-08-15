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

// Function to handle form submission from the bot trap
async function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  // --- Bot Trap Logic ---
  // This form is a honeypot. A real user should never be able to submit it.
  // We will check the honeypot fields first.

  const hp_main = formData.get('hp');
  const hp_comments = formData.get('comments');
  const hp_website = formData.get('website');

  if (hp_main || hp_comments || hp_website) {
    console.warn('BOT DETECTED: Honeypot field filled. Submission blocked.');
    // We don't reset the form, to avoid tipping off the bot.
    // We can optionally send a silent beacon to a logging service here.
    return;
  }

  // If honeypots are empty, it might be a smarter bot or a user with a screen reader
  // who found the form. Now we check the CAPTCHA.
  console.log('Honeypot check passed. Proceeding with bot trap submission for analysis.');

  const sanitized = {};
  const honeypotKeys = ['hp', 'comments', 'website'];
  formData.forEach((value, key) => {
    // We don't include the honeypot fields themselves in the final payload.
    if (!honeypotKeys.includes(key)) {
      sanitized[key] = sanitizeInput(value);
    }
  });

  // Add CSRF token to the sanitized data.
  sanitized.csrf_token = getCookie('csrf_token');

  // Add CAPTCHA responses to the payload for server-side analysis
  sanitized['h-captcha-response'] = formData.get('h-captcha-response');
  sanitized['g-recaptcha-response'] = formData.get('g-recaptcha-response');


  try {
    // This fetch request is part of the trap. The endpoint at `/api/contact`
    // should be configured to log these submissions as malicious attempts.
    const response = await fetch('https://example.com/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify(sanitized)
    });

    // To the bot, it looks like a successful submission.
    console.log('Bot trap submission sent for analysis. Status:', response.status);
    alert('Thank you for your submission!');
    form.reset(); // Reset to be ready for the next bot.

  } catch (err) {
    // Even if the fetch fails, we don't want to give any indication of an error.
    console.error('Bot trap submission failed to send, but this is hidden from the client:', err);
    // We still present a success message to the bot/client.
    alert('Thank you for your submission!');
    form.reset();
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
  let navLabel = 'Menu';
  let closeLabel = 'Close navigation menu';
  if (navToggle) {
    const ariaKey = navToggle.getAttribute('data-aria-label-key');
    const langData = (typeof translations !== 'undefined' && translations[currentLanguage]) || {};
    navLabel = langData[ariaKey] || 'Menu';
    closeLabel = langData['aria-close-menu'] || 'Close navigation menu';
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
      // Close the menu when clicking outside the nav links or toggle
      if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) {
        closeMenu();
      }
    }

    function openMenu() {
      navLinks.classList.add('open');
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', closeLabel);
      const icon = navToggle.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-xmark');
      }
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
      // Delay adding outside click handler so the opening click doesn't trigger it
      setTimeout(() => document.addEventListener('click', handleClickOutside));
    }

    function closeMenu() {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', navLabel);
      const icon = navToggle.querySelector('i');
      if (icon) {
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-xmark');
      }
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
