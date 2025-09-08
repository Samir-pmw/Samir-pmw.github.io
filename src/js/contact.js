// Minimal clipboard/copy & "Get" handler for social icons
document.addEventListener('DOMContentLoaded', () => {
  const copyButtons = Array.from(document.querySelectorAll('.copy-btn'));
  const getButtons = Array.from(document.querySelectorAll('.get-btn'));

  // helper: copy text with fallback
  async function copyText(text, targetEl) {
    if (!text) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      showFeedback(targetEl, 'Copied');
      return true;
    } catch (err) {
      showFeedback(targetEl, 'Failed');
      return false;
    }
  }

  // attach copy-only buttons (if any)
  copyButtons.forEach(btn => {
    const perform = async () => {
      const text = btn.getAttribute('data-copy') || '';
      await copyText(text, btn);
    };
    btn.addEventListener('click', (e) => { e.preventDefault(); perform(); });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); perform(); }
    });
  });

  // attach unified "Get" buttons: attempt copy if provided, then open href/whatsapp if provided
  getButtons.forEach(btn => {
    const handle = async (e) => {
      e.preventDefault();
      const text = btn.getAttribute('data-copy');
      const href = btn.getAttribute('data-href');
      const phone = btn.getAttribute('data-phone'); // numeric, e.g. 63984194107

      if (text) {
        await copyText(text, btn);
      }

      // if phone present, open WhatsApp (and also copy phone if no text was provided)
      if (phone) {
        // open whatsapp web/mobile
        const clean = phone.replace(/\D/g, '');
        const wa = `https://wa.me/${clean}`;
        window.open(wa, '_blank', 'noopener');
        // if no explicit copy text, copy phone
        if (!text) copyText(clean, btn);
        return;
      }

      if (href) {
        window.open(href, '_blank', 'noopener');
        return;
      }
    };

    btn.addEventListener('click', handle);
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handle(e); }
    });
  });

  // floating feedback near the clicked element
  function showFeedback(targetEl, msg) {
    const rect = targetEl.getBoundingClientRect();
    const el = document.createElement('div');
    el.textContent = msg;
    Object.assign(el.style, {
      position: 'fixed',
      left: `${rect.left + rect.width / 2}px`,
      top: `${rect.top - 8}px`,
      transform: 'translate(-50%, -100%)',
      background: 'rgba(0,0,0,0.8)',
      color: '#fff',
      padding: '6px 8px',
      borderRadius: '6px',
      fontSize: '0.85rem',
      zIndex: 99999,
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 260ms ease, transform 260ms ease'
    });
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = 'translate(-50%, -140%)';
      el.style.opacity = '1';
    });
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%, -100%)';
      setTimeout(() => el.remove(), 300);
    }, 1100);
  }
});
