(function(){
  const SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Google test key

  function getRecaptchaSiteKey(){
    return SITE_KEY;
  }

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

  window.securityUtils = {
    getRecaptchaSiteKey,
    loadRecaptcha,
    getRecaptchaToken
  };
})();
