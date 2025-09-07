document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('bg-music');
  if (!audio) return;

  audio.volume = 0.3;

  const tryPlay = () => {
    audio.play().catch(() => {
      // Autoplay bloqueado: aguarda primeira interação
      document.addEventListener('click', onInteract, { once: true });
      document.addEventListener('keydown', onInteract, { once: true });
    });
  };

  const onInteract = () => {
    audio.play().catch(() => {});
  };

  tryPlay();

  // Bloqueia arrastar de todas as imagens
  document.querySelectorAll('img').forEach(img => {
    img.setAttribute('draggable', 'false');
    img.addEventListener('dragstart', e => e.preventDefault());
  });

  // Bloqueia arrastar dos links e ícones das redes
  const redes = document.querySelector('.perfil__redes');
  if (redes) {
    redes.addEventListener('dragstart', e => e.preventDefault());
    redes.querySelectorAll('a, img, svg').forEach(el => {
      el.setAttribute('draggable', 'false');
      el.addEventListener('dragstart', e => e.preventDefault());
    });
  }
});