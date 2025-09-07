function initSettings() {
    const settingsToggle = document.querySelector('.settings-toggle');
    const settingsMenu = document.querySelector('.settings-menu');
    const themeToggleButton = document.getElementById('theme-toggle');
    const translateButton = document.getElementById('translate-btn');

    if (!settingsToggle || !settingsMenu) return;

    // Lógica para abrir/fechar o menu de configurações
    settingsToggle.addEventListener('click', (event) => {
        // Impede que o clique no botão seja detectado pelo listener do documento
        event.stopPropagation();
        const isOpen = settingsMenu.classList.toggle('is-open');
        settingsToggle.setAttribute('aria-expanded', isOpen);
    });

    // Lógica para o botão de tema
    themeToggleButton.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    });

    // Lógica para o botão de tradução
    translateButton.addEventListener('click', () => {
        const currentPageUrl = window.location.href;
        const googleTranslateUrl = `https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(currentPageUrl)}`;
        window.open(googleTranslateUrl, '_blank');
    });

    // Aplica o tema salvo
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
    }
}

export { initSettings as init };