async function loadHTML() {
    const includeElements = document.querySelectorAll('[data-include]');
    for (const el of includeElements) {
        const url = el.dataset.include;
        // O caminho agora é pego diretamente do atributo data-include
        const fullPath = url; 
        try {
            const response = await fetch(fullPath);
            if (response.ok) {
                const html = await response.text();
                el.outerHTML = html; // Substitui o div pelo conteúdo do arquivo
            } else {
                el.innerHTML = 'Page not found.';
            }
        } catch (error) {
            console.error('Error loading HTML:', error);
        }
    }
}

// Função para inicializar os outros scripts
function initComponents() {
    // Importa e executa os scripts que dependem do HTML carregado
    import('./scroll-reveal.js');
    import('./typing-animation.js');
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadHTML(); // Espera o HTML ser carregado
    initComponents(); // Inicializa os componentes
});