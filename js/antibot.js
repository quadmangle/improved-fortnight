(function(){
  const SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Google test key
  const templates = {};

  // Preload honeypot templates
  fetch('security/honeypots.html')
    .then(res => res.text())
    .then(html => {
      const t = document.createElement('template');
      t.innerHTML = html;
      templates.form = t.content.querySelector('#form-honeypot');
      templates.chat = t.content.querySelector('#chat-honeypot');
    })
    .catch(()=>{});

  function loadRecaptcha(){
    return new Promise((resolve, reject) => {
      if (window.grecaptcha){
        return resolve(window.grecaptcha);
      }
      const script = document.createElement('script');
      script.id = 'recaptcha-script';
      script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.grecaptcha);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function getRecaptchaToken(action='submit'){
    const grecaptcha = await loadRecaptcha();
    return grecaptcha.execute(SITE_KEY, { action });
  }

  function injectFormHoneypot(form){
    if(!form) return;
    if(templates.form){
      form.appendChild(templates.form.content.cloneNode(true));
    } else {
      const div = document.createElement('div');
      div.hidden = true;
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'hp_text';
      input.name = 'hp_text';
      div.appendChild(input);
      form.appendChild(div);
    }
  }

  function injectChatbotHoneypot(form){
    if(!form) return;
    if(templates.chat){
      form.appendChild(templates.chat.content.cloneNode(true));
    } else {
      const div = document.createElement('div');
      div.hidden = true;
      const text = document.createElement('input');
      text.type = 'text';
      text.id = 'hp_text';
      text.name = 'hp_text';
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.id = 'hp_check';
      check.name = 'hp_check';
      div.appendChild(text);
      div.appendChild(check);
      form.appendChild(div);
    }
  }

  function isHoneypotTriggered(root){
    const text = root ? root.querySelector('#hp_text') : null;
    const check = root ? root.querySelector('#hp_check') : null;
    return (text && text.value.trim() !== '') || (check && check.checked);
  }

  window.antibot = {
    loadRecaptcha,
    getRecaptchaToken,
    injectFormHoneypot,
    injectChatbotHoneypot,
    isHoneypotTriggered
  };
})();
