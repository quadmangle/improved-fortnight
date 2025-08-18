(function() {
  const theme = localStorage.getItem('theme') || 'light';
  document.documentElement.classList.add(theme);
  document.documentElement.style.backgroundColor = theme === 'dark' ? '#121212' : '#ffffff';
})();
