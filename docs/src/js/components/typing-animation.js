document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('typing-animation-container');
    if (!container) return;

    const textElement = container.querySelector('.typing-text');
    const textsToType = [
        "Software Developer",
        "C.C. University student at UFT",
        "Web Developer",
        "Enthusiast of C, Python Java and JavaScript",
    ];

    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const currentText = textsToType[textIndex];
        // Velocidade aumentada
        const speed = isDeleting ? 50 : 100;

        // Digita ou apaga um caractere
        textElement.textContent = currentText.substring(0, charIndex);

        if (!isDeleting && charIndex < currentText.length) {
            charIndex++;
        } else if (isDeleting && charIndex > 0) {
            charIndex--;
        } else {
            // Pausa no final da digitação ou exclusão
            isDeleting = !isDeleting;
            if (!isDeleting) {
                textIndex = (textIndex + 1) % textsToType.length;
            }
            setTimeout(type, isDeleting ? 2500 : 500);
            return;
        }

        setTimeout(type, speed);
    }

    type();
});