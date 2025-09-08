document.addEventListener('DOMContentLoaded', () => {
    const SELECTOR = '.js-reveal, .js-reveal-up';
    const elements = new Set();

    const handleIntersect = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            } else {
                entry.target.classList.remove('is-visible');
            }
        });
    };

    const options = {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver(handleIntersect, options);

    const observeEl = (el) => {
        if (!el) return;
        if (elements.has(el)) return;
        observer.observe(el);
        elements.add(el);
    };

    // observa os que já existem
    document.querySelectorAll(SELECTOR).forEach(observeEl);

    // Ensure elements already within viewport are revealed immediately (handles layout shifts / injected header)
    const immediateVisibilityCheck = () => {
        document.querySelectorAll(SELECTOR).forEach(el => {
            if (!(el instanceof HTMLElement)) return;
            const rect = el.getBoundingClientRect();
            const inView = rect.top < (window.innerHeight * 0.9) && rect.bottom > 0;
            if (inView) el.classList.add('is-visible');
        });
    };
    // run immediately and once after a short delay to catch late layout changes
    immediateVisibilityCheck();
    setTimeout(immediateVisibilityCheck, 120);

    // observa elementos que forem adicionados dinamicamente
    const mo = new MutationObserver(mutations => {
        for (const m of mutations) {
            if (m.type === 'childList' && m.addedNodes.length) {
                m.addedNodes.forEach(node => {
                    if (!(node instanceof HTMLElement)) return;
                    // Se o nó em si é um reveal
                    if (node.matches && node.matches(SELECTOR)) observeEl(node);
                    // ou se contém elementos reveal
                    node.querySelectorAll && node.querySelectorAll(SELECTOR).forEach(observeEl);
                });
            }
        }
    });

    mo.observe(document.body, { childList: true, subtree: true });

    // === Inicia o efeito de tilt baseado no cursor (desktop only) ===
    const supportsHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (supportsHover) {
        const cards = () => Array.from(document.querySelectorAll('.card'));

        const addTiltListeners = (card) => {
            if (!card || card._tiltInit) return;
            card._tiltInit = true;

            const wrapper = card.querySelector('.wrapper');
            if (!wrapper) return;

            const style = getComputedStyle(card);
            const tiltMax = parseFloat(style.getPropertyValue('--tilt-max')) || 2;
            const translateMax = parseFloat(style.getPropertyValue('--card-translate')) || 4;
            const tiltZVar = style.getPropertyValue('--tilt-z').trim() || '8px';

            let nx = 0, ny = 0;
            let raf = null;

            const update = () => {
                raf = null;
                const rotateX = (-ny) * tiltMax;
                const rotateY = (nx) * tiltMax;
                // wrapper recebe rotação + translateZ para sensação de profundidade (positivo = aproxima)
                wrapper.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${tiltZVar})`;
                // card se move levemente na direção do mouse (não o contrário)
                const tx = nx * translateMax;
                const ty = ny * (translateMax * 0.45);
                card.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(0.995)`;
                card.classList.add('is-tilting');
            };

            const onMove = (clientX, clientY) => {
                const rect = card.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const px = (clientX - cx) / (rect.width / 2);
                const py = (clientY - cy) / (rect.height / 2);
                nx = Math.max(-1, Math.min(1, px));
                ny = Math.max(-1, Math.min(1, py));
                if (!raf) raf = requestAnimationFrame(update);
            };

            const mouseMoveHandler = (e) => onMove(e.clientX, e.clientY);
            const touchMoveHandler = (e) => {
                if (e.touches && e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
            };

            const reset = () => {
                if (raf) { cancelAnimationFrame(raf); raf = null; }
                nx = 0; ny = 0;
                wrapper.style.transform = '';
                card.style.transform = '';
                card.classList.remove('is-tilting');
            };

            card.addEventListener('mousemove', mouseMoveHandler);
            card.addEventListener('touchmove', touchMoveHandler, { passive: true });
            card.addEventListener('mouseleave', reset);
            card.addEventListener('touchend', reset);
        };

        // inicializa para os que já existem
        cards().forEach(addTiltListeners);

        // observa inserções dinâmicas e aplica listeners a novos cards
        const moCards = new MutationObserver(muts => {
            for (const m of muts) {
                if (m.type === 'childList' && m.addedNodes.length) {
                    m.addedNodes.forEach(n => {
                        if (!(n instanceof HTMLElement)) return;
                        if (n.matches && n.matches('.card')) addTiltListeners(n);
                        n.querySelectorAll && n.querySelectorAll('.card').forEach(addTiltListeners);
                    });
                }
            }
        });
        moCards.observe(document.body, { childList: true, subtree: true });
    }
});