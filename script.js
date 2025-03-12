document.addEventListener("DOMContentLoaded", function () {
  const addProjectButton = document.getElementById("add-project-button");
  const addAchievementButton = document.getElementById("add-achievement-button");
  const repositoriesDiv = document.getElementById("repositories");
  const achievementsDiv = document.getElementById("achievements");
  const discordLink = document.getElementById("discord-link");
  const gmailLink = document.getElementById("gmail-link");
  const instagramLink = document.getElementById("instagram-link");
  const themeToggle = document.getElementById("theme-toggle");
  const translateToggle = document.getElementById("translate-toggle");
  const exportDataButton = document.getElementById("export-data");
  let isEnglish = false;

  // Textos em português
  const portugueseTexts = {
    title: "Samir Batista dos Santos",
    location: "Brasil",
    aboutTitle: "SOBRE",
    aboutText:
      "Um programador com anos de experiência em programação e estudante de Ciências da Computação na Universidade Federal do Tocantins. Esse site é o meu portfólio e contém resumos, códigos e links para contato em diversas redes sociais.",
    portfolioTitle: "PORTFÓLIO",
    addProjectButton: "Adicionar Projeto",
    achievementsTitle: "CONQUISTAS E CERTIFICADOS",
    addAchievementButton: "Adicionar Conquista/Certificado",
    navAbout: "SOBRE",
    navPortfolio: "PORTFÓLIO",
    navAchievements: "CONQUISTAS",
  };

  // Textos em inglês
  const englishTexts = {
    title: "Samir Batista dos Santos",
    location: "Brazil",
    aboutTitle: "ABOUT",
    aboutText:
      "A programmer with years of experience in programming and a Computer Science student at the Federal University of Tocantins. This site is my portfolio and contains summaries, codes, and links to contact me on various social networks.",
    portfolioTitle: "PORTFOLIO",
    addProjectButton: "Add Project",
    achievementsTitle: "ACHIEVEMENTS AND CERTIFICATES",
    addAchievementButton: "Add Achievement/Certificate",
    navAbout: "ABOUT",
    navPortfolio: "PORTFOLIO",
    navAchievements: "ACHIEVEMENTS",
  };

  // Dicionário de tradução para projetos e conquistas
  const translationDictionary = {
    MeuProjeto: "MyProject", // Exemplo de tradução
    OutroProjeto: "AnotherProject", // Adicione mais traduções conforme necessário
  };

  // Função para traduzir os textos
  function translatePage() {
    const texts = isEnglish ? portugueseTexts : englishTexts;

    // Atualiza os textos estáticos
    document.querySelector("title").textContent = texts.title;
    document.querySelector("header h1").textContent = texts.title;
    document.querySelector("header p").textContent = texts.location;
    document.querySelector("#sobre h2").textContent = texts.aboutTitle;
    document.querySelector("#sobre-texto").textContent = texts.aboutText;
    document.querySelector("#portfolio h2").textContent = texts.portfolioTitle;
    document.querySelector("#add-project-button").textContent = texts.addProjectButton;
    document.querySelector("#conquistas h2").textContent = texts.achievementsTitle;
    document.querySelector("#add-achievement-button").textContent = texts.addAchievementButton;

    // Atualiza os textos de navegação
    document.querySelector('a[href="#sobre"]').textContent = texts.navAbout;
    document.querySelector('a[href="#portfolio"]').textContent = texts.navPortfolio;
    document.querySelector('a[href="#conquistas"]').textContent = texts.navAchievements;

    // Alterna o estado da tradução
    isEnglish = !isEnglish;
  }

  // Adiciona o evento de clique ao botão de tradução
  translateToggle.addEventListener("click", translatePage);

  // Verificar se é você (baseado em um parâmetro na URL)
  const urlParams = new URLSearchParams(window.location.search);
  const isAdmin = urlParams.has("admin"); // Exemplo: ?admin=true

  // Alternar visibilidade dos botões de admin
  function toggleAdminButtons(show) {
    addProjectButton.style.display = show ? "block" : "none";
    addAchievementButton.style.display = show ? "block" : "none";
    exportDataButton.style.display = show ? "block" : "none";
    document.querySelectorAll(".delete-button").forEach((button) => {
      button.style.display = show ? "block" : "none";
    });
  }

  // Função para carregar dados do arquivo JSON
  async function loadData() {
    const response = await fetch('data.json');
    const data = await response.json();
    return data;
  }

  // Inicializar dados
  async function init() {
    const data = await loadData();
    data.projects.forEach(project => displayProject(project));
    data.achievements.forEach(achievement => displayAchievement(achievement));
  }

  // Inicializar
  toggleAdminButtons(isAdmin);
  init(); // Chama a função init em vez de loadProjects e loadAchievements

  // Adicionar projeto
  addProjectButton.addEventListener("click", function () {
    const repoName = prompt("Digite o nome do projeto:");
    const repoImageUrl = prompt("Digite a URL da imagem do projeto:");
    const repoUrl = prompt("Digite a URL do projeto:");

    if (repoName && repoImageUrl && repoUrl) {
      const project = { name: repoName, image: repoImageUrl, url: repoUrl };
      saveProject(project);
      displayProject(project);
    }
  });

  // Adicionar conquista/certificado
  addAchievementButton.addEventListener("click", function () {
    const achievementName = prompt("Digite o nome da conquista/certificado:");
    const achievementImageUrl = prompt("Digite a URL da imagem (ou deixe em branco):");
    const achievementFileUrl = prompt("Digite o link do arquivo, PDF, ou qualquer coisa (ou deixe em branco):");

    if (achievementName) {
      const achievement = {
        name: achievementName,
        image: achievementImageUrl || "",
        file: achievementFileUrl || "",
      };
      saveAchievement(achievement);
      displayAchievement(achievement);
    }
  });

  // Funções para projetos
  function saveProject(project) {
    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    projects.push(project);
    localStorage.setItem("projects", JSON.stringify(projects));
  }

  function loadProjects() {
    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    repositoriesDiv.innerHTML = ""; // Limpar antes de recarregar
    projects.forEach((project) => displayProject(project));
  }

  function displayProject(project) {
    const projectElement = document.createElement("div");
    projectElement.classList.add("project-item"); // Adiciona classe para o efeito de hover
    projectElement.innerHTML = `
      <a href="${project.url}" target="_blank">
        <img src="${project.image}" alt="${project.name}">
        <p>${project.name}</p>
      </a>
      <button class="delete-button">×</button>
    `;
    const deleteButton = projectElement.querySelector(".delete-button");
    deleteButton.addEventListener("click", () => deleteProject(project.name));
    repositoriesDiv.appendChild(projectElement);
    if (isAdmin) {
      deleteButton.style.display = "block";
    }
  }

  function deleteProject(name) {
    let projects = JSON.parse(localStorage.getItem("projects")) || [];
    projects = projects.filter((project) => project.name !== name);
    localStorage.setItem("projects", JSON.stringify(projects));
    loadProjects();
  }

  // Funções para conquistas
  function saveAchievement(achievement) {
    const achievements = JSON.parse(localStorage.getItem("achievements")) || [];
    achievements.push(achievement);
    localStorage.setItem("achievements", JSON.stringify(achievements));
  }

  function loadAchievements() {
    const achievements = JSON.parse(localStorage.getItem("achievements")) || [];
    achievementsDiv.innerHTML = ""; // Limpar antes de recarregar
    achievements.forEach((achievement) => displayAchievement(achievement));
  }

  function displayAchievement(achievement) {
    const achievementElement = document.createElement("div");
    achievementElement.classList.add("achievement-item"); // Adiciona classe para o efeito de hover
    achievementElement.innerHTML = `
      ${achievement.file ? `<a href="${achievement.file}" target="_blank">` : "<div>"}
        ${achievement.image ? `<img src="${achievement.image}" alt="${achievement.name}">` : ""}
        <p>${achievement.name}</p>
      ${achievement.file ? "</a>" : "</div>"}
      <button class="delete-button">×</button>
    `;
    const deleteButton = achievementElement.querySelector(".delete-button");
    deleteButton.addEventListener("click", () => deleteAchievement(achievement.name));
    achievementsDiv.appendChild(achievementElement);
    if (isAdmin) {
      deleteButton.style.display = "block";
    }
  }

  function deleteAchievement(name) {
    let achievements = JSON.parse(localStorage.getItem("achievements")) || [];
    achievements = achievements.filter((achievement) => achievement.name !== name);
    localStorage.setItem("achievements", JSON.stringify(achievements));
    loadAchievements();
  }

  // Função para mostrar a mensagem de "copiado"
  function showCopyMessage() {
    const copyMessage = document.getElementById("copy-message");
    copyMessage.classList.add("show");
    setTimeout(() => {
      copyMessage.classList.remove("show");
    }, 2000); // A mensagem desaparece após 2 segundos
  }

  // Funções para redes sociais
  discordLink.addEventListener("click", function (e) {
    e.preventDefault();
    navigator.clipboard.writeText("vezkalinn");
    showCopyMessage();
  });

  gmailLink.addEventListener("click", function (e) {
    e.preventDefault();
    navigator.clipboard.writeText("samirbatistasantos@gmail.com"); // Substitua pelo seu e-mail
    showCopyMessage();
  });

  instagramLink.addEventListener("click", function (e) {
    e.preventDefault();
    navigator.clipboard.writeText("@samirpmw"); // Substitua pelo seu @
    showCopyMessage();
  });

  // Light/Dark Mode
  themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("light-mode");
    const isLightMode = document.body.classList.contains("light-mode");
    localStorage.setItem("lightMode", isLightMode);
  });

  // Verificar o modo salvo no localStorage
  const savedLightMode = localStorage.getItem("lightMode") === "true";
  if (savedLightMode) {
    document.body.classList.add("light-mode");
  }

  // Rolagem suave para os links de navegação
  document.querySelectorAll("nav ul li a").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault(); // Evita o comportamento padrão de teleportar
      const targetId = this.getAttribute("href"); // Pega o ID da seção
      const targetSection = document.querySelector(targetId); // Encontra a seção
      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: "smooth", // Rolagem suave
          block: "start", // Alinha o topo da seção com o topo da viewport
        });
      }
    });
  });

  // Função para exportar dados
  function exportData() {
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const achievements = JSON.parse(localStorage.getItem('achievements')) || [];
    const data = { projects, achievements };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
  }

  // Adiciona o evento de clique ao botão de exportação
  exportDataButton.addEventListener("click", exportData);
});
