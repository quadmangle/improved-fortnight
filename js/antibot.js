(function(){
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

  function injectFormHoneypot(form){
    if(!form) return;
    let node;
    if(templates.form){
      node = templates.form.content.cloneNode(true);
    } else {
      const div = document.createElement('div');
      div.hidden = true;
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'hp_text';
      input.name = 'hp_text';
      div.appendChild(input);
      node = div;
    }
    const firstField = form.querySelector('input, select, textarea, button');
    if(firstField && firstField.parentNode === form){
      form.insertBefore(node, firstField);
    } else {
      form.prepend(node);
    }
  }

  function injectChatbotHoneypot(form){
    if(!form) return;
    let node;
    if(templates.chat){
      node = templates.chat.content.cloneNode(true);
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
      node = div;
    }
    const firstField = form.querySelector('input, select, textarea, button');
    if(firstField && firstField.parentNode === form){
      form.insertBefore(node, firstField);
    } else {
      form.prepend(node);
    }
  }

  function isHoneypotTriggered(root){
    const text = root ? root.querySelector('#hp_text') : null;
    const check = root ? root.querySelector('#hp_check') : null;
    return (text && text.value.trim() !== '') || (check && check.checked);
  }

  window.antibot = {
    injectFormHoneypot,
    injectChatbotHoneypot,
    isHoneypotTriggered
  };
})();
