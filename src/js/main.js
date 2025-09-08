import { init as initNavbar } from './components/navbar.js';
import { init as initSettings } from './components/settings.js';
import './components/scroll-reveal.js';
import './components/typing-animation.js';

function initMenuClosers() {
    const menus = [
        { 
            toggle: document.querySelector('.mobile-nav-toggle'), 
            menu: document.querySelector('.mobile-nav') 
        },
        { 
            toggle: document.querySelector('.settings-toggle'), 
            menu: document.querySelector('.settings-menu') 
        }
    ];

    document.addEventListener('click', (event) => {
        menus.forEach(item => {
            if (!item.menu || !item.toggle) return;
            if (item.toggle.contains(event.target)) return;
            if (item.menu.classList.contains('is-open') && !item.menu.contains(event.target)) {
                item.menu.classList.remove('is-open');
                item.toggle.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

// Novo: garante toggle funcional para mobile-nav-toggle e settings-toggle
// agora aceita um container (ex: headerPlaceholder) para escopar buscas
function initToggleHandlers(container = document) {
    const selector = '.mobile-nav-toggle, .settings-toggle, [data-toggle], [aria-controls]';
    const toggles = Array.from(container.querySelectorAll(selector));

    toggles.forEach(raw => {
        // normaliza para o elemento que deve receber o listener
        const toggle = raw;
        // evita inicializar duas vezes
        if (toggle.dataset.toggleInit === '1') return;
        toggle.dataset.toggleInit = '1';

        // Descobre o menu alvo usando aria-controls -> id, depois data-target, depois data-toggle mapping, por fim classes conhecidas
        let menu = null;

        const ariaId = toggle.getAttribute('aria-controls');
        if (ariaId) {
            menu = container.querySelector(`#${ariaId}`) || document.querySelector(`#${ariaId}`);
        }

        if (!menu) {
            const dataTarget = toggle.dataset.target || toggle.getAttribute('data-target');
            if (dataTarget) {
                // permite seletor (#id ou .classe)
                try { menu = container.querySelector(dataTarget) || document.querySelector(dataTarget); } catch(e) {}
            }
        }

        if (!menu) {
            const dataToggle = toggle.dataset.toggle || toggle.getAttribute('data-toggle');
            if (dataToggle) {
                // mapeia valores comuns
                if (dataToggle.includes('mobile')) menu = container.querySelector('.mobile-nav') || document.querySelector('.mobile-nav');
                if (dataToggle.includes('settings')) menu = container.querySelector('.settings-menu') || document.querySelector('.settings-menu');
            }
        }

        if (!menu) {
            // fallback por classe
            const targetClass = toggle.classList.contains('mobile-nav-toggle') ? '.mobile-nav' : '.settings-menu';
            menu = container.querySelector(targetClass) || document.querySelector(targetClass);
        }

        if (!menu) {
            // se não encontrou, não faz nada (permite outras lógicas do site)
            return;
        }

        const updateAria = (isOpen) => {
            toggle.setAttribute('aria-expanded', String(!!isOpen));
            // mantém aria-hidden no menu para acessibilidade
            try { menu.setAttribute('aria-hidden', String(!isOpen)); } catch(e) {}
        };

        const setOpen = (open) => {
            if (open) menu.classList.add('is-open'); else menu.classList.remove('is-open');
            updateAria(open);
        };

        const toggleMenu = (e) => {
            // permitir que o toggle seja ativado por tecla/enter/space
            if (e && e.type === 'keydown') {
                if (!(e.key === 'Enter' || e.key === ' ' || e.code === 'Space')) return;
                e.preventDefault();
            }
            const willOpen = !menu.classList.contains('is-open');
            setOpen(willOpen);
        };

        toggle.addEventListener('click', toggleMenu);
        toggle.addEventListener('keydown', toggleMenu);

        // fechar quando um link interno do menu for clicado
        menu.addEventListener('click', (ev) => {
            const link = ev.target.closest('a');
            if (link) {
                setOpen(false);
            }
        });
    });
}

// Novo: fallback robusto para inicializar toggle/menu mobile caso navbar.js não os encontre
function fallbackInitMobileFromHeader(headerContainer = document) {
    const toggleSelectors = [
        '.mobile-nav-toggle',
        '.hamburger',
        '.nav-toggle',
        '[data-mobile-toggle]',
        '[data-toggle="mobile"]',
        '[data-toggle="mobile-nav"]'
    ].join(',');

    const menuSelectors = [
        '.mobile-nav',
        '.mobile-menu',
        '#mobile-nav',
        '.nav--mobile'
    ].join(',');

    const toggles = Array.from(headerContainer.querySelectorAll(toggleSelectors));
    const menus = Array.from(headerContainer.querySelectorAll(menuSelectors));

    // Se nada encontrado no header, tenta procurar globalmente
    if (toggles.length === 0) toggles.push(...Array.from(document.querySelectorAll(toggleSelectors)));
    if (menus.length === 0) menus.push(...Array.from(document.querySelectorAll(menuSelectors)));

    if (toggles.length === 0 || menus.length === 0) {
        console.info('Fallback: nenhum toggle/menu mobile encontrado pelos seletores comuns.');
        return;
    }

    // associa o primeiro toggle a primeiro menu (com fallback inteligente)
    toggles.forEach((toggle, idx) => {
        // evita dupla inicialização
        if (toggle.dataset.toggleInit === '1') return;
        toggle.dataset.toggleInit = '1';

        // tenta mapear menu por aria-controls/data-target primeiro
        let menu = null;
        const ariaId = toggle.getAttribute('aria-controls');
        if (ariaId) menu = headerContainer.querySelector(`#${ariaId}`) || document.querySelector(`#${ariaId}`);

        if (!menu) {
            const dataTarget = toggle.dataset.target || toggle.getAttribute('data-target');
            if (dataTarget) {
                try { menu = headerContainer.querySelector(dataTarget) || document.querySelector(dataTarget); } catch(e) {}
            }
        }

        if (!menu) {
            // se existir um menu correspondente por índice, usa; senão pega o primeiro menu encontrado
            menu = menus[idx] || menus[0];
        }

        if (!menu) return;

        const setOpenState = (open) => {
            menu.classList[open ? 'add' : 'remove']('is-open');
            try { menu.setAttribute('aria-hidden', String(!open)); } catch(e) {}
            try { toggle.setAttribute('aria-expanded', String(!!open)); } catch(e) {}
        };

        const handler = (ev) => {
            if (ev && ev.type === 'keydown') {
                if (!(ev.key === 'Enter' || ev.key === ' ' || ev.code === 'Space')) return;
                ev.preventDefault();
            }
            const willOpen = !menu.classList.contains('is-open');
            setOpenState(willOpen);
        };

        toggle.addEventListener('click', handler);
        toggle.addEventListener('keydown', handler);

        // fechar ao clicar em link dentro do menu
        menu.addEventListener('click', (ev) => {
            const link = ev.target.closest('a');
            if (link) setOpenState(false);
        });

        // reforça estado inicial
        setOpenState(menu.classList.contains('is-open'));
        console.info('Fallback: móvel toggle inicializado para', toggle, '->', menu);
    });
}

// Novo: fallback para o toggle/menú de "settings" (engrenagem)
// AGORA: cria o .settings-menu dinamicamente se não existir
function fallbackInitSettingsFromHeader(headerContainer = document) {
    const toggleSelectors = [
        '.settings-toggle',
        '.settings-button',
        '.icon-settings',
        '.gear',
        '.gear-button',
        'button[id*="settings"]',
        'button[class*="settings"]',
        '[data-settings-toggle]',
        '[data-settings]',
        '[data-icon="settings"]',
        '[data-toggle="settings"]',
        '[data-toggle="settings-menu"]'
    ].join(',');

    const menuSelectors = [
        '.settings-menu',
        '[data-settings-menu]',
        '#settings-menu',
        '.menu--settings',
        '.settings-panel'
    ].join(',');

    const toggles = Array.from(headerContainer.querySelectorAll(toggleSelectors))
        .concat(Array.from(document.querySelectorAll(toggleSelectors)))
        .filter((v,i,a) => a.indexOf(v) === i);

    if (!toggles.length) {
        console.info('Fallback (settings): nenhum toggle encontrado (ampliado).');
        return;
    }

    let menus = Array.from(headerContainer.querySelectorAll(menuSelectors))
        .concat(Array.from(document.querySelectorAll(menuSelectors)))
        .filter((v,i,a) => a.indexOf(v) === i);

    // CSS fallback (reforçado)
    if (!document.getElementById('dynamic-settings-menu-styles')) {
        const style = document.createElement('style');
        style.id = 'dynamic-settings-menu-styles';
        style.textContent = `
            .settings-menu {
                position:absolute; top:60px; right:16px;
                background:var(--menu-bg-dark,#1c1c1c); border:1px solid var(--menu-border-dark,#333); border-radius:8px;
                padding:12px; min-width:200px;
                display:flex; flex-direction:column; gap:8px;
                box-shadow:0 4px 12px rgba(0,0,0,.35);
                opacity:0; transform:translateY(-8px);
                pointer-events:none; transition:opacity .18s ease, transform .18s ease;
                z-index:270;
            }
            .settings-menu.is-open { opacity:1; transform:translateY(0); pointer-events:auto; }
            .settings-menu__item button,
            .settings-menu__item a,
            .settings-menu__btn {
                background:none; border:0; padding:6px 8px; cursor:pointer;
                color:var(--menu-link-dark,#aaa); font:inherit; text-align:left; border-radius:4px; width:100%;
            }
            .settings-menu__item button:hover,
            .settings-menu__item a:hover,
            .settings-menu__btn:hover {
                background:var(--menu-hover-bg-dark,#333); color:var(--menu-hover-link-dark,#fff);
            }
            body.light .settings-menu,
            body.light-theme .settings-menu,
            body[data-theme="light"] .settings-menu {
                background:var(--menu-bg-light,#fff);
                border-color:var(--menu-border-light,#e2e2e2);
            }
            body.light .settings-menu__item button,
            body.light-theme .settings-menu__item button,
            body[data-theme="light"] .settings-menu__item button,
            body.light .settings-menu__item a,
            body.light-theme .settings-menu__item a,
            body[data-theme="light"] .settings-menu__item a,
            body.light .settings-menu__btn,
            body.light-theme .settings-menu__btn,
            body[data-theme="light"] .settings-menu__btn {
                color:var(--menu-link-light,#333);
            }
            body.light .settings-menu__item button:hover,
            body.light-theme .settings-menu__item button:hover,
            body[data-theme="light"] .settings-menu__item button:hover,
            body.light .settings-menu__item a:hover,
            body.light-theme .settings-menu__item a:hover,
            body[data-theme="light"] .settings-menu__item a:hover,
            body.light .settings-menu__btn:hover,
            body.light-theme .settings-menu__btn:hover,
            body[data-theme="light"] .settings-menu__btn:hover {
                background:var(--menu-hover-bg-light,#f2f2f2);
                color:var(--menu-hover-link-light,#000);
            }
        `;
        document.head.appendChild(style);
    }

    toggles.forEach((toggle, idx) => {
        if (toggle.dataset.settingsInit === '1') return;

        let menu = menus[idx] || menus[0];
        if (!menu) {
            menu = document.createElement('div');
            menu.className = 'settings-menu';
            menu.innerHTML = `
                <div class="settings-menu__item">
                    <button type="button" data-action="theme-toggle">Alternar Tema</button>
                </div>
                <div class="settings-menu__item">
                    <button type="button" data-action="lang-toggle">Idioma (pt-BR)</button>
                </div>
            `;
            const header = toggle.closest('header, .main-header') || headerContainer;
            (header || document.body).appendChild(menu);
            menus.push(menu);
            console.info('Fallback (settings): menu criado dinamicamente.');
        }

        if (!menu.id) menu.id = 'settings-menu-' + Math.random().toString(36).slice(2);
        if (!toggle.getAttribute('aria-controls')) toggle.setAttribute('aria-controls', menu.id);
        toggle.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');

        const setOpenState = (open) => {
            menu.classList[open ? 'add' : 'remove']('is-open');
            toggle.setAttribute('aria-expanded', String(open));
            menu.setAttribute('aria-hidden', String(!open));
            if (open) {
                // foca primeiro botão para acessibilidade
                const firstBtn = menu.querySelector('button, a');
                if (firstBtn) setTimeout(() => firstBtn.focus(), 10);
            }
        };

        const handler = (ev) => {
            if (ev && ev.type === 'keydown') {
                if (!(ev.key === 'Enter' || ev.key === ' ' || ev.code === 'Space')) return;
                ev.preventDefault();
            }
            ev && ev.stopPropagation();
            setOpenState(!menu.classList.contains('is-open'));
        };

        toggle.addEventListener('click', handler);
        toggle.addEventListener('keydown', handler);

        menu.addEventListener('click', (ev) => {
            const closeOn = ev.target.closest('[data-action], a, button');
            if (closeOn) setOpenState(false);
        });

        document.addEventListener('click', (ev) => {
            if (!menu.contains(ev.target) && !toggle.contains(ev.target) && menu.classList.contains('is-open')) {
                setOpenState(false);
            }
        });

        toggle.dataset.settingsInit = '1';
        menu.dataset.settingsManaged = '1';
        console.info('Fallback (settings): inicializado (ampliado)', { toggle, menu });
    });
}

// Novo: procura exaustiva por possíveis toggles no header e associa ao menu mais provável
function exhaustiveInitHeaderToggles(headerContainer = document) {
    const candidateSelector = [
        'button',
        '[role="button"]',
        '[aria-haspopup="true"]',
        '[data-toggle]',
        '[data-target]',
        '[data-mobile-toggle]',
        '.toggle',
        '.hamburger',
        '.nav-toggle',
        '.menu-toggle',
        'a[href="#"]'
    ].join(',');

    const menuCandidateSelector = [
        'nav',
        '.mobile-nav',
        '.mobile-menu',
        '.main-nav',
        '.nav',
        '[role="navigation"]',
        'ul',
        '.settings-menu',
        '.settings-panel'
    ].join(',');

    const candidates = Array.from(headerContainer.querySelectorAll(candidateSelector))
        .concat(Array.from(document.querySelectorAll(candidateSelector)))
        .filter(Boolean);

    if (!candidates.length) {
        console.info('Exhaustive: nenhum candidato a toggle encontrado.');
        return;
    }

    candidates.forEach((toggle) => {
        if (!toggle || toggle.dataset.toggleInit === '1') return;

        // heurísticas para encontrar o menu alvo
        let menu = null;

        const ariaId = toggle.getAttribute('aria-controls');
        if (ariaId) menu = headerContainer.querySelector(`#${ariaId}`) || document.querySelector(`#${ariaId}`);

        if (!menu) {
            const dataTarget = toggle.dataset.target || toggle.getAttribute('data-toggle');
            if (dataTarget) {
                try { menu = headerContainer.querySelector(dataTarget) || document.querySelector(dataTarget); } catch(e) {}
            }
        }

        if (!menu) {
            // se for link com href="#something"
            const href = toggle.getAttribute && toggle.getAttribute('href');
            if (href && href.startsWith('#')) {
                try { menu = headerContainer.querySelector(href) || document.querySelector(href); } catch(e) {}
            }
        }

        if (!menu) {
            // procura próximo nav/ul/sibling dentro do header
            const parent = toggle.closest('header, .main-header, .mobile-nav-container') || headerContainer;
            menu = parent.querySelector(menuCandidateSelector) || toggle.nextElementSibling && (toggle.nextElementSibling.matches ? (toggle.nextElementSibling.matches(menuCandidateSelector) ? toggle.nextElementSibling : null) : null);
        }

        if (!menu) {
            // procura por qualquer menu candidato no header e escolhe o primeiro visível
            const menus = Array.from(headerContainer.querySelectorAll(menuCandidateSelector))
                .concat(Array.from(document.querySelectorAll(menuCandidateSelector)));
            menu = menus.find(m => m && m.offsetParent !== null) || menus[0];
        }

        if (!menu) return;

        // marca e liga handlers
        toggle.dataset.toggleInit = '1';
        menu.dataset.toggleManaged = '1';

        const setOpenState = (open) => {
            menu.classList[open ? 'add' : 'remove']('is-open');
            try { menu.setAttribute('aria-hidden', String(!open)); } catch(e) {}
            try { toggle.setAttribute('aria-expanded', String(!!open)); } catch(e) {}
        };

        const handler = (ev) => {
            if (ev && ev.type === 'keydown') {
                if (!(ev.key === 'Enter' || ev.key === ' ' || ev.code === 'Space')) return;
                ev.preventDefault();
            }
            const willOpen = !menu.classList.contains('is-open');
            setOpenState(willOpen);
        };

        toggle.addEventListener('click', handler);
        toggle.addEventListener('keydown', handler);

        // fechar ao clicar em link/button dentro do menu
        menu.addEventListener('click', (ev) => {
            const link = ev.target.closest('a, button');
            if (link) setOpenState(false);
        });

        // garante cursor/tap friendly
        try { toggle.style.cursor = 'pointer'; } catch(e) {}

        console.info('Exhaustive: initialized toggle ->', toggle, 'menu ->', menu);
    });
}

async function loadAndInit() {
    // try several possible data-include values used across pages
    const headerPlaceholder = document.querySelector('[data-include="public/pages/components/header.html"]')
        || document.querySelector('[data-include="public/pages/header.html"]')
        || document.querySelector('[data-include="header.html"]')
        || document.querySelector('[data-include]');

    if (!headerPlaceholder) {
        console.warn('Header placeholder not found. Proceeding — fallback initializers will try to handle header behavior.');
    } else {
        // try multiple candidate paths for the header file (root, public, components)
        const tryPaths = [
            'public/pages/components/header.html',
            'public/pages/header.html',
            'components/header.html',
            'public/components/header.html'
        ];

        let injected = false;
        for (const p of tryPaths) {
            try {
                const response = await fetch(p);
                if (!response.ok) continue;
                const headerHtml = await response.text();
                headerPlaceholder.innerHTML = headerHtml;
                injected = true;
                console.info('Header injected from', p);
                break;
            } catch (e) {
                // ignore and try next path
            }
        }

        if (!injected) {
            console.warn('Could not fetch header.html from known locations. Proceeding without injected header.');
        }
    }

    try {
        // GARANTIA: Espera o navegador processar a injeção do HTML (se houve)
        requestAnimationFrame(() => {
            console.log("DOM ready after header injection (or skip). Initializing scripts.");

            // Inicializa imediatamente o menu de configurações simples
            try { initExplicitSettingsMenu(headerPlaceholder); } catch(e) { console.error('initExplicitSettingsMenu failed:', e); }

            // ADICIONA: debug do header injetado para identificar classes/atributos reais
            try {
                if (typeof debugHeaderElements === 'function') debugHeaderElements(headerPlaceholder);
            } catch (e) {
                console.error('debugHeaderElements failed:', e);
            }

            // Ajusta os links do header para o contexto (root ou public/pages)
            try {
                if (typeof adjustHeaderLinks === 'function') adjustHeaderLinks(headerPlaceholder);
            } catch (e) {
                console.warn('adjustHeaderLinks failed:', e);
            }
            
            // Agora os elementos existem e podem ser encontrados
            try {
                if (typeof initNavbar === 'function') {
                    try {
                        // tenta inicializar passando o header como escopo (se suportado)
                        initNavbar(headerPlaceholder);
                    } catch (errWithContainer) {
                        // fallback: tenta sem container
                        try {
                            initNavbar();
                        } catch (errNoContainer) {
                            console.error('initNavbar failed (with container and without):', errWithContainer, errNoContainer);
                        }
                    }
                } else {
                    console.warn('initNavbar is not a function', initNavbar);
                }
            } catch (e) {
                console.error('Unexpected error while calling initNavbar:', e);
            }

            try {
                if (typeof initSettings === 'function') {
                    try {
                        initSettings(headerPlaceholder);
                    } catch (errWithContainer) {
                        try {
                            initSettings();
                        } catch (errNoContainer) {
                            console.error('initSettings failed (with container and without):', errWithContainer, errNoContainer);
                        }
                    }
                } else {
                    console.warn('initSettings is not a function', initSettings);
                }
            } catch (e) {
                console.error('Unexpected error while calling initSettings:', e);
            }

            // Tentativa de manter fechamento/abertura do menu mesmo que initNavbar falhe
            try { initMenuClosers(); } catch (e) { console.error('initMenuClosers failed:', e); }

            // Inicializa handlers adicionais de toggle (passa o headerPlaceholder como container)
            try { initToggleHandlers(headerPlaceholder); } catch (e) { 
                try { initToggleHandlers(); } catch (e2) {
                    console.error('initToggleHandlers failed (with container and without):', e, e2);
                }
            }

            // Se navbar.js/others não tenham criado um toggle funcional, instala fallback
            const foundToggle = (headerPlaceholder && headerPlaceholder.querySelector('.mobile-nav-toggle, .hamburger, .nav-toggle, [data-mobile-toggle], [data-toggle="mobile"], [data-toggle="mobile-nav"]'))
                              || document.querySelector('.mobile-nav-toggle, .hamburger, .nav-toggle, [data-mobile-toggle], [data-toggle="mobile"], [data-toggle="mobile-nav"]');
            const foundMenu = (headerPlaceholder && headerPlaceholder.querySelector('.mobile-nav, .mobile-menu, #mobile-nav, .nav--mobile'))
                             || document.querySelector('.mobile-nav, .mobile-menu, #mobile-nav, .nav--mobile');

            if (!foundToggle || !foundMenu) {
                console.info('No mobile toggle/menu found by existing scripts — applying fallback initializer.');
                fallbackInitMobileFromHeader(headerPlaceholder);

                // Se o fallback específico também não encontrar, tenta busca exaustiva genérica
                const anyToggleAfter = (headerPlaceholder && headerPlaceholder.querySelector('[data-toggle-init], .mobile-nav-toggle, .hamburger, .nav-toggle, [data-mobile-toggle]')) || document.querySelector('[data-toggle-init], .mobile-nav-toggle, .hamburger, .nav-toggle, [data-mobile-toggle]');
                if (!anyToggleAfter) {
                    console.info('Applying exhaustive header detection as additional fallback.');
                    exhaustiveInitHeaderToggles(headerPlaceholder);
                }
            }

            // NOVO: verifica e aplica fallback para settings/engrenagem se necessário
            const foundSettingsToggle = (headerPlaceholder && headerPlaceholder.querySelector('.settings-toggle, .settings-button, [data-settings-toggle], [data-toggle="settings"]'))
                                    || document.querySelector('.settings-toggle, .settings-button, [data-settings-toggle], [data-toggle="settings"]');
            const foundSettingsMenu = (headerPlaceholder && headerPlaceholder.querySelector('.settings-menu, #settings-menu, .settings-panel'))
                                  || document.querySelector('.settings-menu, #settings-menu, .settings-panel');

            if (!foundSettingsToggle || !foundSettingsMenu) {
                console.info('No settings toggle/menu found by existing scripts — applying settings fallback initializer.');
                fallbackInitSettingsFromHeader(headerPlaceholder);

                const anySettingsAfter = (headerPlaceholder && headerPlaceholder.querySelector('.settings-toggle, [data-settings-toggle]')) || document.querySelector('.settings-toggle, [data-settings-toggle]');
                if (!anySettingsAfter) {
                    console.info('Applying exhaustive header detection for settings as additional fallback.');
                    exhaustiveInitHeaderToggles(headerPlaceholder);
                }
            }

            // NOVO: garantir menu de configurações simples antes de outras estratégias
            try { ensureSettingsMenuSimplified(headerPlaceholder); } catch(e) { console.warn('ensureSettingsMenuSimplified falhou', e); }

            try { injectLightMenuOverrideOnce(); } catch(e) { console.warn('injectLightMenuOverrideOnce falhou', e); }

            try { setupMenuThemeSync(); } catch(e){ console.warn('setupMenuThemeSync falhou', e); }

            // Ajusta links do header/nav para caminhos relativos corretos dependendo da página atual
            try { adjustHeaderLinks(headerPlaceholder); } catch(e) { console.warn('adjustHeaderLinks falhou', e); }

            console.log("Scripts initialized successfully.");
        });

    } catch (error) {
        console.error("CRITICAL ERROR during page initialization:", error);
    }
}

// NOVO: criação/garantia simplificada do menu de configurações
function ensureSettingsMenuSimplified(headerContainer = document) {
    const header = headerContainer.querySelector('header, .main-header') || headerContainer;

    // heurística de busca de toggle existente
    let toggle = header.querySelector([
        '.settings-toggle',
        '.settings-button',
        '[data-settings-toggle]',
        '[data-toggle="settings"]',
        '[data-toggle="settings-menu"]',
        'button[class*="setting"]',
        'button[class*="config"]',
        'button[class*="engren"]',
        'button[class*="gear"]',
        '[class*="settings"]',
        '[class*="config"]',
        '[class*="engren"]',
        '[class*="gear"]'
    ].join(',')) || null;

    // se não existir, cria botão
    if (!toggle) {
        toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'settings-toggle';
        toggle.setAttribute('aria-label', 'Configurações');
        toggle.innerHTML = '⚙'; // simples placeholder
        // injeta no header (fim)
        header.appendChild(toggle);
        console.info('[settings-simple] Toggle criado.');
    } else {
        console.info('[settings-simple] Toggle encontrado.', toggle);
    }

    // busca menu existente
    let menu = header.querySelector('.settings-menu, #settings-menu, .settings-panel, .menu--settings');
    if (!menu) {
        menu = document.createElement('div');
        menu.className = 'settings-menu';
        menu.innerHTML = `
            <div class="settings-menu__item">
                <button type="button" data-action="theme-toggle">Alternar Tema</button>
            </div>
            <div class="settings-menu__item">
                <button type="button" data-action="lang-toggle">Idioma (pt-BR)</button>
            </div>
        `;
        header.appendChild(menu);
        console.info('[settings-simple] Menu criado.');
    } else {
        console.info('[settings-simple] Menu encontrado.', menu);
    }

    // ARIA
    if (!menu.id) menu.id = 'settings-menu-simple';
    if (!toggle.getAttribute('aria-controls')) toggle.setAttribute('aria-controls', menu.id);
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');

    // evitar dupla
    if (toggle.dataset.simpleSettingsInit === '1') return;
    toggle.dataset.simpleSettingsInit = '1';

    const setOpen = (open) => {
        menu.classList[open ? 'add' : 'remove']('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        menu.setAttribute('aria-hidden', String(!open));
    };

    const handler = (e) => {
        if (e && e.type === 'keydown') {
            if (!(e.key === 'Enter' || e.key === ' ')) return;
            e.preventDefault();
        }
        e && e.stopPropagation();
        setOpen(!menu.classList.contains('is-open'));
    };

    toggle.addEventListener('click', handler);
    toggle.addEventListener('keydown', handler);

    menu.addEventListener('click', (e) => {
        const closeOn = e.target.closest('button,a,[data-action]');
        if (closeOn) setOpen(false);
    });

    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !toggle.contains(e.target) && menu.classList.contains('is-open')) {
            setOpen(false);
        }
    });

    // CSS mínimo se necessário
    if (!document.getElementById('settings-simple-inline-style')) {
        const style = document.createElement('style');
        style.id = 'settings-simple-inline-style';
        style.textContent = `
            .settings-toggle { background:none;border:0;cursor:pointer;padding:8px;color:#888; }
            .settings-toggle:hover,.settings-toggle:focus { color:var(--cor-texto,#fff); }
            .settings-menu { position:absolute; top:60px; right:64px; background:var(--menu-bg-dark,#1c1c1c); border:1px solid var(--menu-border-dark,#333);
                border-radius:8px; padding:12px; min-width:200px; display:flex; flex-direction:column; gap:8px;
                box-shadow:0 4px 12px rgba(0,0,0,.35); opacity:0; transform:translateY(-8px);
                pointer-events:none; transition:opacity .18s ease, transform .18s ease; z-index:270; }
            .settings-menu.is-open { opacity:1; transform:translateY(0); pointer-events:auto; }
            .settings-menu__item button { width:100%; text-align:left; background:none; border:0; color:var(--menu-link-dark,#aaa); padding:6px 8px; border-radius:4px; cursor:pointer; }
            .settings-menu__item button:hover { background:var(--menu-hover-bg-dark,#333); color:var(--menu-hover-link-dark,#fff); }
            body.light .settings-menu,
            body.light-theme .settings-menu,
            body[data-theme="light"] .settings-menu {
                background:var(--menu-bg-light,#fff);
                border-color:var(--menu-border-light,#e2e2e2);
            }
            body.light .settings-menu__item button,
            body.light-theme .settings-menu__item button,
            body[data-theme="light"] .settings-menu__item button,
            body.light .settings-menu__item a,
            body.light-theme .settings-menu__item a,
            body[data-theme="light"] .settings-menu__item a,
            body.light .settings-menu__btn,
            body.light-theme .settings-menu__btn,
            body[data-theme="light"] .settings-menu__btn {
                color:var(--menu-link-light,#333);
            }
            body.light .settings-menu__item button:hover,
            body.light-theme .settings-menu__item button:hover,
            body[data-theme="light"] .settings-menu__item button:hover,
            body.light .settings-menu__item a:hover,
            body.light-theme .settings-menu__item a:hover,
            body[data-theme="light"] .settings-menu__item a:hover,
            body.light .settings-menu__btn:hover,
            body.light-theme .settings-menu__btn:hover,
            body[data-theme="light"] .settings-menu__btn:hover {
                background:var(--menu-hover-bg-light,#f2f2f2);
                color:var(--menu-hover-link-light,#000);
            }
            @media (max-width:768px){ .settings-menu { right:16px; top:56px; } }
        `;
        document.head.appendChild(style);
    }

    console.info('[settings-simple] Inicialização concluída.');
}

// NOVO: inicialização explícita e simples do menu de configurações
function initExplicitSettingsMenu(scope = document) {
    const toggle = scope.querySelector('.settings-toggle');
    const menu = scope.querySelector('.settings-menu');
    if (!toggle || !menu) return;
    if (toggle.dataset.settingsBound === '1') return;
    toggle.dataset.settingsBound = '1';

    // garante atributos ARIA
    if (!menu.id) menu.id = 'settings-menu';
    if (!toggle.getAttribute('aria-controls')) toggle.setAttribute('aria-controls', menu.id);
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');

    const setOpen = (open) => {
        menu.classList[open ? 'add' : 'remove']('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        menu.setAttribute('aria-hidden', String(!open));
    };

    const onToggle = (e) => {
        e.stopPropagation();
        setOpen(!menu.classList.contains('is-open'));
    };

    toggle.addEventListener('click', onToggle);
    toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            onToggle(e);
        }
    });

    menu.addEventListener('click', (e) => {
        if (e.target.closest('button,a')) setOpen(false);
    });

    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !toggle.contains(e.target) && menu.classList.contains('is-open')) {
            setOpen(false);
        }
    });

    console.info('[settings-explicit] Menu de configurações inicializado.');
}

// Novo: função de debug para listar o que existe no header injetado
function debugHeaderElements(headerContainer = document) {
    const checks = {
        mobileToggles: [
            '.mobile-nav-toggle',
            '.hamburger',
            '.nav-toggle',
            '[data-mobile-toggle]',
            '[data-toggle="mobile"]',
            '[data-toggle="mobile-nav"]'
        ],
        mobileMenus: [
            '.mobile-nav',
            '.mobile-menu',
            '#mobile-nav',
            '.nav--mobile',
            '.main-nav'
        ],
        settingsToggles: [
            '.settings-toggle',
            '.settings-button',
            '[data-settings-toggle]',
            '[data-toggle="settings"]',
            '[data-toggle="settings-menu"]'
        ],
        settingsMenus: [
            '.settings-menu',
            '#settings-menu',
            '.settings-panel',
            '.menu--settings'
        ],
        genericButtons: [
            'button',
            '[role="button"]',
            '[aria-haspopup="true"]',
            '[data-toggle]',
            '[data-target]'
        ]
    };

    console.groupCollapsed('Header debug: scanning selectors');
    Object.entries(checks).forEach(([name, selectors]) => {
        const found = selectors.map(sel => {
            const els = Array.from(headerContainer.querySelectorAll(sel)).concat(Array.from(document.querySelectorAll(sel)));
            return { selector: sel, count: els.length, sample: els[0] || null };
        }).filter(Boolean);
        console.groupCollapsed(`${name} (${found.reduce((s, f) => s + f.count, 0)} total)`);
        found.forEach(f => console.log(f.selector, '=>', f.count, f.sample));
        console.groupEnd();
    });
    console.groupEnd();

    // relatório rápido se nenhum toggle/menu típico foi encontrado
    const totalToggles = checks.mobileToggles.concat(checks.settingsToggles)
        .map(sel => headerContainer.querySelectorAll(sel).length + document.querySelectorAll(sel).length)
        .reduce((a,b) => a + b, 0);

    const totalMenus = checks.mobileMenus.concat(checks.settingsMenus)
        .map(sel => headerContainer.querySelectorAll(sel).length + document.querySelectorAll(sel).length)
        .reduce((a,b) => a + b, 0);

    if (totalToggles === 0 || totalMenus === 0) {
        console.warn('Debug: nenhum toggle/menu típico detectado no header injetado. Mostrando trecho do HTML para inspeção (até 4000 chars).');
        try {
            const html = headerContainer.innerHTML || '(no innerHTML)';
            console.log(html.slice(0, 4000));
        } catch (e) {
            console.error('Não foi possível ler header innerHTML:', e);
        }
    } else {
        console.info('Debug: toggles/menus detectados (ver grupos acima).');
    }
}

function injectLightMenuOverrideOnce() {
    if (document.getElementById('menu-light-hard-override')) return;
    const style = document.createElement('style');
    style.id = 'menu-light-hard-override';
    style.textContent = `
    html.light .mobile-nav, body.light .mobile-nav,
    html.light-theme .mobile-nav, body.light-theme .mobile-nav,
    html[data-theme="light"] .mobile-nav, body[data-theme="light"] .mobile-nav,
    html.light .settings-menu, body.light .settings-menu,
    html.light-theme .settings-menu, body.light-theme .settings-menu,
    html[data-theme="light"] .settings-menu, body[data-theme="light"] .settings-menu {
        background:#ffffff !important;
        border-color:#e2e2e2 !important;
        color:#222 !important;
    }
    html.light .mobile-nav__link, body.light .mobile-nav__link,
    html.light-theme .mobile-nav__link, body.light-theme .mobile-nav__link,
    html[data-theme="light"] .mobile-nav__link, body[data-theme="light"] .mobile-nav__link,
    html.light .settings-menu__btn, body.light .settings-menu__btn,
    html.light-theme .settings-menu__btn, body.light-theme .settings-menu__btn,
    html[data-theme="light"] .settings-menu__btn, body[data-theme="light"] .settings-menu__btn,
    html.light .settings-menu__item button, body.light .settings-menu__item button,
    html.light-theme .settings-menu__item button, body.light-theme .settings-menu__item button,
    html[data-theme="light"] .settings-menu__item button, body[data-theme="light"] .settings-menu__item button {
        color:#222 !important;
    }
    html.light .mobile-nav__link:hover, body.light .mobile-nav__link:hover,
    html.light-theme .mobile-nav__link:hover, body.light-theme .mobile-nav__link:hover,
    html[data-theme="light"] .mobile-nav__link:hover, body[data-theme="light"] .mobile-nav__link:hover,
    html.light .settings-menu__btn:hover, body.light .settings-menu__btn:hover,
    html.light-theme .settings-menu__btn:hover, body.light-theme .settings-menu__btn:hover,
    html[data-theme="light"] .settings-menu__btn:hover, body[data-theme="light"] .settings-menu__btn:hover,
    html.light .settings-menu__item button:hover, body.light .settings-menu__item button:hover,
    html.light-theme .settings-menu__item button:hover, body.light-theme .settings-menu__item button:hover,
    html[data-theme="light"] .settings-menu__item button:hover, body[data-theme="light"] .settings-menu__item button:hover {
        background:#f2f2f2 !important;
        color:#000 !important;
    }`;
    document.head.appendChild(style);
}

// NOVO: CSS unificado e sincronização de cor clara para ambos os menus
function injectUnifiedMenuThemeStyles() {
    if (document.getElementById('menu-theme-unified')) return;
    const style = document.createElement('style');
    style.id = 'menu-theme-unified';
    style.textContent = `
        .mobile-nav.menu-light, .settings-menu.menu-light {
            background:#ffffff !important;
            border-color:#e2e2e2 !important;
        }
        .mobile-nav.menu-light .mobile-nav__link,
        .settings-menu.menu-light .settings-menu__btn,
        .settings-menu.menu-light button,
        .settings-menu.menu-light a,
        .mobile-nav.menu-light a {
            color:#222 !important;
        }
        .mobile-nav.menu-light .mobile-nav__link:hover,
        .settings-menu.menu-light .settings-menu__btn:hover,
        .settings-menu.menu-light button:hover,
        .settings-menu.menu-light a:hover,
        .mobile-nav.menu-light a:hover {
            background:#f2f2f2 !important;
            color:#000 !important;
        }
    `;
    document.head.appendChild(style);
}

// ==== NOVO BLOCO: heurísticas robustas para detectar tema claro ====
function _parseRGB(str) {
    if (!str) return null;
    const ctx = str.trim();
    // rgb/rgba
    let m = ctx.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/i);
    if (m) return { r: +m[1], g: +m[2], b: +m[3] };
    // hex #rrggbb
    m = ctx.match(/^#([0-9a-f]{6})$/i);
    if (m) {
        return {
            r: parseInt(m[1].slice(0,2),16),
            g: parseInt(m[1].slice(2,4),16),
            b: parseInt(m[1].slice(4,6),16)
        };
    }
    // hex #rgb
    m = ctx.match(/^#([0-9a-f]{3})$/i);
    if (m) {
        return {
            r: parseInt(m[1][0]+m[1][0],16),
            g: parseInt(m[1][1]+m[1][1],16),
            b: parseInt(m[1][2]+m[1][2],16)
        };
    }
    return null;
}

function _relativeLum({r,g,b}) {
    const srgb = [r,g,b].map(v=>{
        v/=255;
        return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4);
    });
    return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
}

function isBodyLightByComputedStyle() {
    try {
        const bg = getComputedStyle(document.body).backgroundColor || getComputedStyle(document.documentElement).backgroundColor;
        const rgb = _parseRGB(bg);
        if (!rgb) return null;
        const L = _relativeLum(rgb);
        return L >= 0.5; // threshold
    } catch(e) { return null; }
}

// SUBSTITUI função de detecção: combina classes, data-theme, ausência de 'dark' e luminância
function isLightThemeActive() {
    const b = document.body;
    const d = document.documentElement;
    const classStr = (b.className + ' ' + d.className).toLowerCase();

    // Sinais explícitos
    if (/(^|\s)(light|light-theme|theme-light)\b/.test(classStr)) return true;
    if (/(^|\s)(dark|dark-theme|theme-dark)\b/.test(classStr)) return false;

    // data-theme
    if (b.dataset.theme === 'light' || d.dataset.theme === 'light') return true;
    if (b.dataset.theme === 'dark' || d.dataset.theme === 'dark') return false;

    // Heurística por luminância
    const computed = isBodyLightByComputedStyle();
    if (computed !== null) return computed;

    // Fallback: assume escuro se incerto
    return false;
}

// SUBSTITUI applyMenuTheme (remove cache para sempre reaplicar em ambos)
function applyMenuTheme() {
    const light = isLightThemeActive();
    document.querySelectorAll('.mobile-nav, .settings-menu').forEach(menu => {
        updateMenuInlineColors(menu, light);
    });
}

// === ADICIONADO: função usada por applyMenuTheme (estava sendo chamada mas não existia) ===
function updateMenuInlineColors(menu, light) {
    if (!menu) return;
    const isSettings = menu.classList.contains('settings-menu');
    const itemSelector = isSettings
        ? '.settings-menu__btn, .settings-menu__item button, .settings-menu__item a'
        : '.mobile-nav__link, a';
    const items = menu.querySelectorAll(itemSelector);
    if (light) {
        menu.classList.add('menu-light');
        menu.style.background = '#ffffff';
        menu.style.borderColor = '#e2e2e2';
        menu.style.color = '#222';
        items.forEach(el => el.style.color = '#222');
    } else {
        menu.classList.remove('menu-light');
        menu.style.background = '#1c1c1c';
        menu.style.borderColor = '#333';
        menu.style.color = '#aaa';
        items.forEach(el => el.style.color = '#aaa');
    }
}

// === ADICIONADO: garantir também o settings em modo claro (voltou a funcionar antes) ===
function forceSettingsMenuLightIfNeeded() {
    const sm = document.querySelector('.settings-menu');
    if (!sm) return;
    if (sm.classList.contains('menu-light') && sm.style.background === 'rgb(255, 255, 255)') return;
    const light = isLightThemeActive();
    if (light) {
        updateMenuInlineColors(sm, true);
        console.info('[settings-menu theme] aplicado inline (light).');
    }
}

// Ajusta o existente para sempre reaplicar depois
function forceMobileNavLightIfNeeded() {
    const nav = document.querySelector('.mobile-nav');
    if (!nav) return;
    const light = isLightThemeActive();
    if (light) {
        updateMenuInlineColors(nav, true);
    }
}

// Observer agora chama ambos
(function observeMenusCreation(){
    const maybeApply = () => {
        forceMobileNavLightIfNeeded();
        forceSettingsMenuLightIfNeeded();
    };
    if (document.querySelector('.mobile-nav')) maybeApply();
    const mo = new MutationObserver(() => {
        if (document.querySelector('.mobile-nav') || document.querySelector('.settings-menu')) {
            maybeApply();
        }
    });
    mo.observe(document.documentElement, { childList:true, subtree:true });
})();

// (Opcional debug manual)
window.__forceMobileNavLight = forceMobileNavLightIfNeeded;
window.__forceSettingsMenuLight = forceSettingsMenuLightIfNeeded;

document.addEventListener('DOMContentLoaded', loadAndInit);

// ===== NOVO: Força tema claro nos menus se o body já estiver claro (ex: rgb(240,240,240)) =====
function _ensureParseFnsForMenu() {
    // reutiliza se já existem
    if (typeof _parseRGB === 'function' && typeof _relativeLum === 'function') return;
    // fallback mínimo (caso removidos no futuro)
    window._parseRGB = (str) => {
        const m = /rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/i.exec(str||'');
        return m ? {r:+m[1],g:+m[2],b:+m[3]} : null;
    };
    window._relativeLum = ({r,g,b})=>{
        const c=[r,g,b].map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});
        return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];
    };
}

function forceLightMenusOnce() {
    if (window.__menusLightForced) return;
    _ensureParseFnsForMenu();
    const rgb = _parseRGB(getComputedStyle(document.body).backgroundColor);
    if (!rgb) return;
    const L = _relativeLum(rgb);
    if (L < 0.70) return; // só força se claramente claro
    window.__menusLightForced = true;

    const applyLightInline = () => {
        document.querySelectorAll('.mobile-nav, .settings-menu').forEach(menu => {
            // aplica claro usando função já existente
            updateMenuInlineColors(menu, true);
        });
        console.info('[menu-force] aplicado claro inicial (L=' + L.toFixed(3) + ')');
    };

    applyLightInline();

    // Observa mudanças: se continuar claro garante classe; se virar dark remove estilos claros e reaplica tema
    const obs = new MutationObserver(() => {
        const light = isLightThemeActive();
        if (light) {
            document.querySelectorAll('.mobile-nav, .settings-menu').forEach(m => {
                if (!m.classList.contains('menu-light')) updateMenuInlineColors(m, true);
            });
        } else {
            // limpar vestígios de force e deixar applyMenuTheme() cuidar
            document.querySelectorAll('.mobile-nav.menu-light, .settings-menu.menu-light').forEach(m => {
                m.classList.remove('menu-light');
                // limpar cores forcadas para que updateMenuInlineColors(dark) prevaleça
                m.style.background = '';
                m.style.borderColor = '';
                m.style.color = '';
                m.querySelectorAll('a,button').forEach(el => el.style.color = '');
            });
            applyMenuTheme();
        }
    });
    obs.observe(document.documentElement, { attributes:true, attributeFilter:['class','data-theme'] });
    obs.observe(document.body, { attributes:true, attributeFilter:['class','data-theme'] });
}

// (REINTRODUZIDO / NOVO) Observador simples para mudar tema dinamicamente
function initMenuThemeWatcher() {
    if (window.__menuThemeWatcher) return;
    window.__menuThemeWatcher = true;
    const apply = () => {
        try { applyMenuTheme(); } catch {}
    };
    const obs = new MutationObserver(apply);
    obs.observe(document.documentElement, { attributes:true, attributeFilter:['class','data-theme'] });
    obs.observe(document.body, { attributes:true, attributeFilter:['class','data-theme'] });
}

// NEW: Public small API used by other modules; sets up initial sync and watcher
function setupMenuThemeSync() {
    try {
        applyMenuTheme();
        initMenuThemeWatcher();
        // ensure light menus if body already light
        forceLightMenusOnce();
        console.info('setupMenuThemeSync completed');
    } catch (e) {
        console.warn('setupMenuThemeSync encountered an error', e);
    }
}

// GARANTE: chama initMenuThemeWatcher e forceLightMenusOnce após loadAndInit
document.addEventListener('readystatechange', () => {
    if (document.readyState === 'complete') {
        try { initMenuThemeWatcher(); forceLightMenusOnce(); } catch(e){ console.warn('theme watch/init fail', e); }
    }
});
// ===== FIM NOVO BLOCO =====

// Adjust header nav links so they work both from root (index.html) and from public/pages/*
function adjustHeaderLinks(headerPlaceholder) {
    if (!headerPlaceholder) headerPlaceholder = document;
    const path = location.pathname.replace(/\\\\/g, '/');
    // detect if current document is inside public/pages folder
    const inPublicPages = /\/public\/pages\//.test(path) || /\/pages\//.test(path) || path.split('/').slice(-2).join('/').toLowerCase() === 'public/pages';

    // find nav links in both desktop and mobile navs
    const navSelectors = ['.main-nav a', '.mobile-nav a'];
    navSelectors.forEach(sel => {
        const links = headerPlaceholder.querySelectorAll(sel);
        links.forEach(a => {
            const text = (a.textContent || '').trim().toLowerCase();
            let target = a.getAttribute('href') || '#';
            // normalize by text if href is generic
            if (text === 'home' || /home/i.test(target)) {
                target = inPublicPages ? '../../index.html' : 'index.html';
            } else if (text === 'about') {
                target = inPublicPages ? 'about.html' : 'public/pages/about.html';
            } else if (text === 'projects') {
                target = inPublicPages ? 'projects.html' : 'public/pages/projects.html';
            } else if (text === 'contact') {
                target = inPublicPages ? 'contact.html' : 'public/pages/contact.html';
            }
            a.setAttribute('href', target);
        });
    });
}