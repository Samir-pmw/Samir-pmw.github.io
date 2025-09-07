// Inicializa navegação mobile: cria/clona menu, aplica acessibilidade e listeners
function initNavbar(container = document) {
    const header = container.querySelector('header, .main-header') || container;
    // Evita reinicialização
    if (header && header.dataset.navbarInit === '1') return;
    if (header) header.dataset.navbarInit = '1';

    // Seletores possíveis para toggle
    const toggleSelectors = [
        '.mobile-nav-toggle','.hamburger','.nav-toggle',
        '[data-mobile-toggle]','[data-toggle="mobile"]',
        '[data-toggle="mobile-nav"]','button[aria-haspopup="true"]'
    ];

    // Localiza toggle
    let mobileNavToggle = null;
    for (const sel of toggleSelectors) {
        mobileNavToggle = header.querySelector(sel) || document.querySelector(sel);
        if (mobileNavToggle) break;
    }
    if (!mobileNavToggle) {
        console.warn('[navbar] Nenhum toggle encontrado.');
        return;
    }

    // Gera/clona menu mobile se ausente
    let mobileNav = header.querySelector('.mobile-nav') || document.querySelector('.mobile-nav');
    if (!mobileNav) {
        const mainNav = header.querySelector('.main-nav');
        if (mainNav) {
            mobileNav = document.createElement('div');
            mobileNav.className = 'mobile-nav';
            mainNav.querySelectorAll('a').forEach(a => {
                const clone = a.cloneNode(true);
                clone.classList.add('mobile-nav__link');
                mobileNav.appendChild(clone);
            });
            (header || document.body).appendChild(mobileNav);
        } else {
            mobileNav = document.createElement('div');
            mobileNav.className = 'mobile-nav';
            mobileNav.innerHTML = '<a class="mobile-nav__link" href="#">Home</a>';
            (header || document.body).appendChild(mobileNav);
        }
    }

    // ARIA básica
    if (!mobileNav.id) mobileNav.id = 'mobile-nav-generated';
    if (!mobileNavToggle.getAttribute('aria-controls'))
        mobileNavToggle.setAttribute('aria-controls', mobileNav.id);
    mobileNavToggle.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');

    // CSS fallback único (evita ausência de estilo)
    if (!document.getElementById('dynamic-mobile-nav-styles')) {
        const hasRule = !!Array.from(document.styleSheets).find(ss => {
            try { return Array.from(ss.cssRules || []).some(r => r.selectorText?.includes('.mobile-nav')); }
            catch { return false; }
        });
        if (!hasRule) {
            const style = document.createElement('style');
            style.id = 'dynamic-mobile-nav-styles';
            style.textContent = `
                .mobile-nav {
                    position:absolute; top:60px; right:16px;
                    background:var(--menu-bg-dark,#1c1c1c);
                    border:1px solid var(--menu-border-dark,#333);
                    border-radius:8px;
                    padding:8px; width:180px;
                    display:flex; flex-direction:column; gap:4px;
                    box-shadow:0 4px 12px rgba(0,0,0,.3);
                    opacity:0; transform:translateY(-8px);
                    pointer-events:none; transition:opacity .2s ease, transform .2s ease;
                    z-index:250;
                }
                .mobile-nav.is-open { opacity:1; transform:translateY(0); pointer-events:auto; }
                .mobile-nav__link { color:var(--menu-link-dark,#aaa); text-decoration:none; padding:10px 12px; border-radius:4px; font-size:14px; }
                .mobile-nav__link:hover { background:var(--menu-hover-bg-dark,#333); color:var(--menu-hover-link-dark,#fff); }
                body.light .mobile-nav,
                body.light-theme .mobile-nav,
                body[data-theme="light"] .mobile-nav {
                    background:var(--menu-bg-light,#fff);
                    border-color:var(--menu-border-light,#e2e2e2);
                }
                body.light .mobile-nav__link,
                body.light-theme .mobile-nav__link,
                body[data-theme="light"] .mobile-nav__link { color:var(--menu-link-light,#333); }
                body.light .mobile-nav__link:hover,
                body.light-theme .mobile-nav__link:hover,
                body[data-theme="light"] .mobile-nav__link:hover {
                    background:var(--menu-hover-bg-light,#f2f2f2);
                    color:var(--menu-hover-link-light,#000);
                }
                .mobile-nav.menu-light { background:#ffffff !important; border-color:#e2e2e2 !important; }
                .mobile-nav.menu-light .mobile-nav__link { color:#222 !important; }
                .mobile-nav.menu-light .mobile-nav__link:hover { background:#f2f2f2 !important; color:#000 !important; }
            `;
            document.head.appendChild(style);
        }
    }

    // Evita múltiplos listeners
    if (mobileNavToggle.dataset.toggleInit === '1') return;
    mobileNavToggle.dataset.toggleInit = '1';

    const setOpenState = (open) => {
        mobileNav.classList[open ? 'add' : 'remove']('is-open');
        mobileNavToggle.setAttribute('aria-expanded', String(open));
        mobileNav.setAttribute('aria-hidden', String(!open));
    };

    // Toggle principal
    const handler = (e) => {
        if (e) e.stopPropagation();
        const openSettings = document.querySelector('.settings-menu.is-open');
        if (openSettings) {
            openSettings.classList.remove('is-open');
            const stToggle = document.querySelector('[aria-controls="' + openSettings.id + '"]');
            if (stToggle) stToggle.setAttribute('aria-expanded', 'false');
        }
        setOpenState(!mobileNav.classList.contains('is-open'));
    };

    mobileNavToggle.addEventListener('click', handler);
    mobileNavToggle.addEventListener('keydown', (e) => {
        if (['Enter',' ','Space'].includes(e.key) || e.code === 'Space') {
            e.preventDefault();
            handler(e);
        }
    });

    // Fecha ao clicar em link
    mobileNav.addEventListener('click', (e) => {
        if (e.target.closest('a')) setOpenState(false);
    });

    // Fecha clique fora
    document.addEventListener('click', (e) => {
        if (!mobileNav.contains(e.target) && !mobileNavToggle.contains(e.target)) {
            if (mobileNav.classList.contains('is-open')) setOpenState(false);
        }
    });
}
export { initNavbar as init };