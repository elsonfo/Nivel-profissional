// =====================================================
// VARIÁVEIS GLOBAIS
// =====================================================

let faseAtual = Number(localStorage.getItem("faseAtual")) || 1;
let etapa = 0;
let score = 0;
let tempoTotal = 0;
let timer;
let permitirProximoDesafio = false;
let chartProgresso = null;
let teveFalha = false;

let historico = JSON.parse(localStorage.getItem("historicoWord")) || [];
let achievements = JSON.parse(localStorage.getItem("achievementsWord")) || {};
let desafiosAtuais = [];

// =====================================================
// SISTEMA DE ACHIEVEMENTS
// =====================================================

const achievementsData = {
  "first_challenge": {
    name: "Primeiro Passo",
    icon: "👣",
    description: "Conclua o primeiro desafio",
    condition: (score, etapa) => etapa >= 1
  },
  "speed_demon": {
    name: "Velocista",
    icon: "⚡",
    description: "Complete em menos de 5 minutos",
    condition: (score, etapa, tempo) => etapa >= desafiosAtuais.length && tempo < 300
  },
  "perfect_score": {
    name: "Perfeição",
    icon: "💯",
    description: "Obtenha 100 pontos",
    condition: (score, etapa) => score >= 100
  },
  "high_score": {
    name: "Grande Pontuação",
    icon: "⭐",
    description: "Obtenha 80+ pontos",
    condition: (score, etapa) => score >= 80
  },
  "explorer": {
    name: "Explorador",
    icon: "🔍",
    description: "Conclua todos os 10 desafios",
    condition: (score, etapa) => etapa >= desafiosAtuais.length
  },
  "comeback": {
    name: "Volta por Cima",
    icon: "🔄",
    description: "Tente novamente após falha",
    condition: (score, etapa, tempo) => teveFalha && etapa > 0
  },
  "scholar": {
    name: "Acadêmico",
    icon: "🎓",
    description: "Complete 5 tentativas",
    condition: (score, etapa) => historico.length >= 5
  }
};

// =====================================================
// TEMA DARK/LIGHT
// =====================================================

function initTheme() {
  const savedTheme = localStorage.getItem("themeWord") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    updateThemeButton();
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("themeWord", isDark ? "dark" : "light");
  updateThemeButton();
}

function updateThemeButton() {
  const btn = document.querySelector(".theme-toggle");
  if (btn) {
    btn.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
  }
}

// =====================================================
// ACHIEVEMENTS
// =====================================================

function verificarAchievements() {
  Object.keys(achievementsData).forEach(key => {
    const achievement = achievementsData[key];
    
    if (!achievements[key] && achievement.condition(score, etapa, tempoTotal)) {
      achievements[key] = {
        unlocked: true,
        unlockedAt: new Date().toISOString()
      };
      
      mostrarAchievementNotificacao(key);
      salvarAchievements();
    }
  });
  renderAchievements();
}

function mostrarAchievementNotificacao(key) {
  const achievement = achievementsData[key];
  const msg = `🎉 Achievement Desbloqueado: ${achievement.name}!`;
  
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--success);
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 200;
    animation: slideIn 0.3s ease;
    font-weight: 600;
  `;
  notification.textContent = msg;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function renderAchievements() {
  const grid = document.getElementById("achievementsGrid");
  if (!grid) return;
  
  grid.innerHTML = "";
  
  Object.keys(achievementsData).forEach(key => {
    const achievement = achievementsData[key];
    const isUnlocked = achievements[key];
    
    const div = document.createElement("div");
    div.className = `achievement ${isUnlocked ? "unlocked" : ""}`;
    div.title = achievement.description;
    div.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-name">${achievement.name}</div>
    `;
    
    grid.appendChild(div);
  });
}

function salvarAchievements() {
  localStorage.setItem("achievementsWord", JSON.stringify(achievements));
}

// =====================================================
// GRÁFICO DE PROGRESSO
// =====================================================

function renderProgressChart() {
  const ctx = document.getElementById("progressChart");
  if (!ctx || historico.length === 0) return;
  
  // Limitar a últimas 10 tentativas
  const dados = historico.slice(0, 10).reverse();
  
  if (chartProgresso) {
    chartProgresso.destroy();
  }
  
  const labels = dados.map((_, i) => `Tentativa ${i + 1}`);
  const pontos = dados.map(h => h.pontos);
  const tempos = dados.map(h => h.tempo);
  
  chartProgresso = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Pontuação",
          data: pontos,
          borderColor: "#0066cc",
          backgroundColor: "rgba(0, 102, 204, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#0066cc",
          pointBorderColor: "#fff",
          pointRadius: 6,
          pointHoverRadius: 8
        },
        {
          label: "Tempo (s)",
          data: tempos,
          borderColor: "#ff9800",
          backgroundColor: "rgba(255, 152, 0, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#ff9800",
          pointBorderColor: "#fff",
          pointRadius: 5,
          yAxisID: "y1"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: document.body.classList.contains("dark-mode") ? "#e0e0e0" : "#333",
            font: { size: 12, weight: "bold" }
          }
        }
      },
      scales: {
        y: {
          type: "linear",
          position: "left",
          ticks: {
            color: document.body.classList.contains("dark-mode") ? "#e0e0e0" : "#333"
          },
          grid: {
            color: document.body.classList.contains("dark-mode") ? "#444" : "#e0e0e0"
          }
        },
        y1: {
          type: "linear",
          position: "right",
          ticks: {
            color: document.body.classList.contains("dark-mode") ? "#e0e0e0" : "#333"
          },
          grid: {
            drawOnChartArea: false
          }
        },
        x: {
          ticks: {
            color: document.body.classList.contains("dark-mode") ? "#e0e0e0" : "#333"
          },
          grid: {
            color: document.body.classList.contains("dark-mode") ? "#444" : "#e0e0e0"
          }
        }
      }
    }
  });
}

// CSS para animações
const styleAnimation = document.createElement("style");
styleAnimation.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(styleAnimation);

const textoBaseFase1 = `<h1>Assistente Administrativo: Competências Essenciais</h1>

<h2>Introdução ao Papel Profissional</h2>

<p>O assistente administrativo exerce um papel estratégico dentro das organizações modernas, sendo responsável por apoiar as atividades operacionais e garantir o fluxo adequado das informações.</p>

<p>Entre suas principais funções estão:</p>
<ul>
<li>Organização de documentos</li>
<li>Controle de processos internos</li>
<li>Atendimento a clientes</li>
<li>Suporte às equipes de gestão</li>
<li>Produção de relatórios</li>
</ul>

<p>Para isso, é essencial que o profissional domine ferramentas digitais, especialmente editores de texto como o Microsoft Word.</p>

<h2>Importância da Formatação Profissional</h2>

<p>A produção de documentos bem estruturados, claros e padronizados contribui diretamente para a eficiência organizacional e para a qualidade da comunicação empresarial.</p>

<p>Além disso, o uso adequado de recursos como formatação, alinhamento, listas e revisão textual permite que os documentos transmitam profissionalismo e credibilidade.</p>

<p>Dessa forma, o domínio das ferramentas tecnológicas não é apenas um diferencial, mas uma competência essencial para o assistente administrativo no mercado de trabalho atual.</p>`;

const textoBaseFase2 = `<h1>Fase 2: Domínio Avançado do Word</h1>

<h2>Produtividade com Estilos e Sumário</h2>

<p>Nesta fase, focaremos em navegação e formatação avançada: estilos de parágrafo, sumário automático e revisão de documentos.</p>

<p>Concentre-se em consistência visual e precisão de formatação profissional.</p>`;

let textoBase = textoBaseFase1;

// =====================================================
// DESAFIOS COM VALIDAÇÃO MELHORADA
// =====================================================

// =====================================================
// UTILITÁRIOS
// =====================================================

function isBoldNode(el, editor) {
  while (el && el !== editor && el !== document.body) {
    const tag = (el.tagName || "").toUpperCase();
    if (tag === "B" || tag === "STRONG") return true;

    const computed = window.getComputedStyle(el);
    const fw = computed.fontWeight;
    if (fw === "bold" || fw === "bolder" || Number(fw) >= 600) {
      return true;
    }

    el = el.parentElement;
  }
  return false;
}

function getFirstTwoRelevantBlocks(editor) {
  const blocks = Array.from(editor.children).filter(child => child.innerText.trim().length > 0);
  if (blocks.length >= 2) {
    return blocks.slice(0, 2);
  }

  const fallback = Array.from(editor.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6')).filter(el => el.innerText.trim().length > 0);
  if (fallback.length >= 2) {
    return fallback.slice(0, 2);
  }

  return [];
}

function blockHasMajorityBoldText(block, editor) {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
  let total = 0;
  let bold = 0;

  while (walker.nextNode()) {
    const txt = walker.currentNode.nodeValue.replace(/\s+/g, ' ').trim();
    if (!txt) continue;
    const length = txt.length;
    total += length;
    if (isBoldNode(walker.currentNode.parentElement, editor)) {
      bold += length;
    }
  }

  if (total === 0) return false;
  return (bold / total) >= 0.5;
}

// =====================================================
// VALIDAÇÕES
// =====================================================

function validarPrimeirosBlocosEmNegrito() {
  const editor = document.getElementById("editor");
  if (!editor) return false;

  const blocks = getFirstTwoRelevantBlocks(editor);
  if (blocks.length < 2) {
    return false;
  }

  return blocks.every(block => blockHasMajorityBoldText(block, editor));
}

const desafiosFase1 = [
  {
    id: 1,
    texto: "1️⃣ Digite o texto completo no editor",
    dica: "Copie o texto amarelo acima mantendo a estrutura de parágrafos.",
    criterio: "Mínimo 350 caracteres",
    validar: (t, h) => {
      const textoLimpo = t.trim();
      return textoLimpo.length > 350;
    },
    pontos: 15
  },

  {
    id: 2,
    texto: "2️⃣ Aplique NEGRITO no título principal e no subtítulo",
    dica: "Deixe negrito somente em 'Assistente Administrativo: Competências Essenciais' e 'Introdução ao Papel Profissional'.",
    criterio: "Primeiros 2 blocos em negrito",
    validar: () => {
      return validarPrimeirosBlocosEmNegrito();
    },
    pontos: 10
  },

  {
    id: 3,
    texto: "3️⃣ Aplique ITÁLICO em 'Microsoft Word'",
    dica: "Procure a expressão exata no texto e italicize-a.",
    criterio: "Microsoft Word em itálico",
    validar: (t, h) => {
      return h.toLowerCase().includes("<i>") || h.toLowerCase().includes("<em>");
    },
    pontos: 10
  },

  {
    id: 4,
    texto: "4️⃣ Aplique SUBLINHADO em 'comunicação empresarial'",
    dica: "Localize a expressão e use o botão U para sublinhar.",
    criterio: "Texto sublinhado aplicado",
    validar: (t, h) => {
      return h.toLowerCase().includes("<u>") || h.toLowerCase().includes("<ins>");
    },
    pontos: 10
  },

  {
    id: 5,
    texto: "5️⃣ Justifique todo o texto",
    dica: "Selecione todo o conteúdo (Ctrl+A) e clique em ☰.",
    criterio: "Texto completamente justificado",
    validar: (t, h) => {
      return h.toLowerCase().includes("justify") || 
             document.getElementById("editor").style.textAlign === "justify";
    },
    pontos: 10
  },

  {
    id: 6,
    texto: "6️⃣ Crie uma lista com os pontos principais (adicione mais itens)",
    dica: "Use o botão 'Lista' para criar uma lista com pelo menos 7 itens no total.",
    criterio: "Lista com marcadores (mín. 7 itens)",
    validar: (t, h) => {
      const liCount = (h.match(/<li>/gi) || []).length;
      return liCount >= 7;
    },
    pontos: 15
  },

  {
    id: 7,
    texto: "7️⃣ Revise a ortografia e estrutura do documento",
    dica: "Verifique se há espaços duplos, quebras inadequadas ou erros.",
    criterio: "Documento bem formatado",
    validar: (t, h) => {
      return t.length > 350 && !t.includes("  ");
    },
    pontos: 10
  },

  {
    id: 8,
    texto: "8️⃣ Aplique negrito nos títulos existentes",
    dica: "Identifique os títulos H1 e H2 e aplique negrito neles.",
    criterio: "Títulos em negrito",
    validar: (t, h) => {
      const bCount = (h.match(/<b>|<strong>/gi) || []).length;
      return bCount >= 3; // Título principal + 2 subtítulos
    },
    pontos: 12
  },

  {
    id: 9,
    texto: "9️⃣ Finalize com numeração de parágrafos (opcional)",
    dica: "Numere cada parágrafo para melhor organização.",
    criterio: "Parágrafos organizados",
    validar: (t, h) => {
      return t.length > 350 && h.includes("<");
    },
    pontos: 8
  },

  {
    id: 10,
    texto: "🔟 Parabéns! Seu documento está pronto",
    dica: "Verifique a pontuação final e clique em Validar.",
    criterio: "Desafio completo",
    validar: (t, h) => {
      return t.length > 350;
    },
    pontos: 0
  }
];

const desafiosFase2 = [
  // Desafios da Fase 2 serão definidos posteriormente (esqueleto)
];

desafiosAtuais = desafiosFase1;

function carregarFase(fase) {
  faseAtual = fase;
  etapa = 0;
  score = 0;
  tempoTotal = 0;
  clearInterval(timer);

  if (faseAtual === 1) {
    desafiosAtuais = desafiosFase1;
    textoBase = textoBaseFase1;
  } else {
    desafiosAtuais = desafiosFase2;
    textoBase = textoBaseFase2;
  }

  localStorage.setItem("faseAtual", String(faseAtual));

  const textoBaseElement = document.getElementById("textoBase");
  if (textoBaseElement) {
    textoBaseElement.innerHTML = textoBase;
  }

  atualizar();
  renderAchievements();
  mostrarHistorico();
  renderProgressChart();
}

// =====================================================
// INICIALIZAÇÃO
// =====================================================

function iniciar() {
  initTheme();
  carregarFase(faseAtual);

  // Recuperar nome do aluno do localStorage (não reatribui placeholder falso)
  const nomeAlunoSalvo = localStorage.getItem("nomeAlunoWord");
  if (nomeAlunoSalvo && nomeAlunoSalvo.trim() && nomeAlunoSalvo !== "Aluno não informado") {
    const inputNome = document.getElementById("nomeAluno");
    if (inputNome) {
      inputNome.value = nomeAlunoSalvo;
    }
  }

  const inputNome = document.getElementById("nomeAluno");
  if (inputNome) {
    inputNome.addEventListener("input", () => {
      const valor = inputNome.value.trim();
      if (valor) {
        localStorage.setItem("nomeAlunoWord", valor);
      } else {
        localStorage.removeItem("nomeAlunoWord");
      }
    });
  }
  
  // Adicionar atalhos de teclado ao editor
  const editor = document.getElementById("editor");
  if (editor) {
    editor.addEventListener("keydown", handleKeyboardShortcuts);
  }
  
  renderAchievements();
  mostrarHistorico();
  renderProgressChart();
  
  atualizar();
  iniciarTempo();
}

// =====================================================
// TIMER
// =====================================================

function iniciarTempo() {
  timer = setInterval(() => {
    tempoTotal++;
    const tempoElement = document.getElementById("tempo");
    if (tempoElement) {
      tempoElement.innerText = tempoTotal;
    }
  }, 1000);
}

// =====================================================
// ATUALIZAR INTERFACE
// =====================================================

function atualizar() {
  const d = desafiosAtuais[etapa];

  const missaoElement = document.getElementById("missao");
  if (missaoElement) {
    missaoElement.innerHTML = d.texto;
  }

  const dicaElement = document.getElementById("dica");
  if (dicaElement) {
    dicaElement.innerHTML = "💡 " + d.dica;
  }

  const criterioElement = document.getElementById("criterio");
  if (criterioElement) {
    criterioElement.innerHTML = "📋 " + d.criterio;
  }

  const nivelElement = document.getElementById("nivel");
  if (nivelElement) {
    nivelElement.innerText = `${etapa + 1}/${desafiosAtuais.length}`;
  }

  // Atualizar barra de progresso
  const progressFill = document.getElementById("progressBar");
  if (progressFill) {
    const porcentagem = ((etapa) / desafiosAtuais.length) * 100;
    progressFill.style.width = porcentagem + "%";
  }

  // Limpar feedback anterior
  const feedbackElement = document.getElementById("feedback");
  if (feedbackElement) {
    feedbackElement.textContent = "";
    feedbackElement.classList.remove("show", "success", "error");
  }

  permitirProximoDesafio = false;
}

// =====================================================
// VALIDAÇÃO COM FEEDBACK MELHORADO
// =====================================================

function validar() {
  const editor = document.getElementById("editor");
  if (!editor) return;

  const textoAtual = editor.innerText;
  const htmlAtual = editor.innerHTML;

  const d = desafiosAtuais[etapa];
  const feedbackElement = document.getElementById("feedback");

  if (!feedbackElement) return;

  // Validar
  if (d.validar(textoAtual, htmlAtual)) {
    // Sucesso
    score += d.pontos;
    score = Math.max(0, score);

    feedbackElement.innerHTML = `✅ Parabéns! Você ganhou ${d.pontos} pontos!`;
    feedbackElement.classList.add("show", "success");

    atualizarScore();
    verificarAchievements();
    registrarTentativa("Sucesso", d.pontos);

    etapa++;
    permitirProximoDesafio = true;

    if (etapa >= desafiosAtuais.length) {
      clearInterval(timer);
      setTimeout(finalizar, 1500);
    } else {
      setTimeout(() => {
        atualizar();
      }, 1500);
    }
  } else {
    // Erro
    score = Math.max(0, score - 3);
    teveFalha = true;

    feedbackElement.innerHTML = `❌ Não conseguiu completar. Verifique o critério (-3 pts)`;
    feedbackElement.classList.add("show", "error");

    atualizarScore();
    registrarTentativa("Falha", -3);
  }
}

// =====================================================
// ATUALIZAR PONTUAÇÃO
// =====================================================

function atualizarScore() {
  const scoreElement = document.getElementById("score");
  if (scoreElement) {
    scoreElement.innerText = score;
  }
}

// =====================================================
// FINALIZAÇÃO
// =====================================================

function finalizar() {
  clearInterval(timer);
  
  // Verificar achievements finais
  verificarAchievements();
  renderAchievements();

  const pontosFinal = score;
  const tempoFinal = tempoTotal;
  const percentualConclusao = desafiosAtuais.length ? Math.round((100 * etapa) / desafiosAtuais.length) : 0;
  const desempenho = obterDesempenho(pontosFinal);
  const botaoFase2 = faseAtual === 1 ? `
        <button onclick="carregarFase(2)" 
                style="background: #4caf50; color: white; border: none; padding: 15px 30px; 
                       font-size: 16px; font-weight: bold; border-radius: 8px; cursor: pointer; 
                       box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: all 0.3s;">
          🚀 Iniciar Fase 2
        </button>
      ` : '';

  document.body.innerHTML = `
    <div style="background: linear-gradient(135deg, #0066cc 0%, #00a3ff 100%); 
                color: white; padding: 40px 20px; text-align: center; min-height: 100vh; 
                display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <h1 style="font-size: 48px; margin-bottom: 10px;">🏁 Missão Finalizada!</h1>
      <p style="font-size: 18px; margin-bottom: 40px; opacity: 0.9;">Você completou o desafio com êxito</p>

      <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 30px; 
                  margin-bottom: 30px; max-width: 500px;">
        <div style="margin: 20px 0;">
          <span style="font-size: 14px; opacity: 0.8;">Pontuação Final</span>
          <div style="font-size: 48px; font-weight: bold; margin-top: 5px;">${pontosFinal} 🌟</div>
        </div>

        <div style="margin: 20px 0;">
          <span style="font-size: 14px; opacity: 0.8;">Tempo Total</span>
          <div style="font-size: 36px; font-weight: bold; margin-top: 5px;">${tempoFinal}s ⏱</div>
        </div>

        <div style="margin: 20px 0;">
          <span style="font-size: 14px; opacity: 0.8;">Conclusão</span>
          <div style="font-size: 36px; font-weight: bold; margin-top: 5px;">${percentualConclusao}%</div>
        </div>

        <div style="margin: 20px 0;">
          <span style="font-size: 14px; opacity: 0.8;">Desempenho</span>
          <div style="font-size: 24px; font-weight: bold; margin-top: 5px;">${desempenho}</div>
        </div>
      </div>

      <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center;">
        <button onclick="exportarRelatorioPDF()" 
                style="background: #ff9800; color: white; border: none; padding: 15px 30px; 
                       font-size: 16px; font-weight: bold; border-radius: 8px; cursor: pointer;
                       box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: all 0.3s;">
          📄 Exportar Relatório
        </button>
        ${botaoFase2}
        <button onclick="location.reload()" 
                style="background: white; color: #0066cc; border: none; padding: 15px 30px; 
                       font-size: 16px; font-weight: bold; border-radius: 8px; cursor: pointer;
                       box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: all 0.3s;">
          🔄 Jogar Novamente
        </button>
      </div>
    </div>
  `;
}

// =====================================================
// AVALIAÇÃO DE DESEMPENHO
// =====================================================

function obterDesempenho(pontuacao) {
  if (pontuacao >= 100) return "🏆 Excelente!";
  if (pontuacao >= 80) return "⭐ Muito Bom!";
  if (pontuacao >= 60) return "👍 Bom!";
  if (pontuacao >= 40) return "📈 Pode Melhorar";
  return "💪 Tente Novamente";
}

function registrarTentativa(resultado, pontosGanhados) {
  const entrada = {
    tentativa: historico.length + 1,
    etapa: etapa + 1,
    conclusao: etapa + 1,
    resultado: resultado,
    pontos: score,
    pontosGanhados: pontosGanhados,
    tempo: tempoTotal,
    data: new Date().toLocaleString("pt-BR")
  };

  historico.unshift(entrada);
  historico = historico.slice(0, 10);
  localStorage.setItem("historicoWord", JSON.stringify(historico));

  mostrarHistorico();
  renderProgressChart();
}

// =====================================================
// HISTÓRICO
// =====================================================

function salvarHistorico() {
  historico.unshift({
    pontos: score,
    tempo: tempoTotal,
    data: new Date().toLocaleString("pt-BR"),
    conclusao: etapa
  });

  historico = historico.slice(0, 10);
  localStorage.setItem("historicoWord", JSON.stringify(historico));
  
  // Atualizar gráfico
  renderProgressChart();
}

function mostrarHistorico() {
  const div = document.getElementById("historico");
  if (!div) return;

  div.innerHTML = "";

  if (historico.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "historico-empty";
    emptyMsg.innerText = "Nenhuma tentativa registrada ainda. Comece agora!";
    div.appendChild(emptyMsg);
    return;
  }

  historico.forEach((h, idx) => {
    const item = document.createElement("div");
    item.className = "historico-item";
    item.innerHTML = `
      <strong>Tentativa ${idx + 1}</strong><br>
      ⭐ ${h.pontos} pts | ⏱ ${h.tempo}s | 📊 ${h.conclusao}/10 desafios
    `;
    div.appendChild(item);
  });
}

// =====================================================
// EXPORTAR PDF
// =====================================================

function exportarRelatorioPDF() {
  // Ler nome do aluno do input ou localStorage para permitir fluxo após tela final
  const inputNome = document.getElementById("nomeAluno")?.value || "";
  let nomeAluno = inputNome.trim();

  if (!nomeAluno) {
    nomeAluno = (localStorage.getItem("nomeAlunoWord") || "").trim();
  }

  if (nomeAluno) {
    localStorage.setItem("nomeAlunoWord", nomeAluno);
  } else {
    nomeAluno = "Aluno não informado";
  }

  // Conteúdo atual + localStorage (backup)
  const historicoAtual = JSON.parse(localStorage.getItem("historicoWord")) || historico;
  const achievementsAtual = JSON.parse(localStorage.getItem("achievementsWord")) || achievements;

  const dados = {
    aluno: nomeAluno,
    data: new Date().toLocaleString("pt-BR"),
    pontosFinal: score,
    tempoTotal: tempoTotal,
    faseAtual: faseAtual,
    desafiosCompletados: etapa,
    totalDesafios: desafiosAtuais.length,
    percentualConclusao: desafiosAtuais.length ? Math.round((100 * etapa) / desafiosAtuais.length) : 0,
    progresso: `${etapa}/${desafiosAtuais.length}`,
    desempenho: obterDesempenho(score),
    texto: document.getElementById("editor")?.innerText || "N/A",
    historico: historicoAtual,
    achievements: achievementsAtual
  };

  // Construir linhas do histórico
  let historicoLinhas = "";
  if (dados.historico.length > 0) {
    dados.historico.forEach((h, idx) => {
      historicoLinhas += `<tr><td>${idx + 1}</td><td>${h.resultado || "N/A"}</td><td>${h.pontos}</td><td>${h.tempo}s</td><td>${h.data}</td></tr>`;
    });
  } else {
    historicoLinhas = `<tr><td colspan="5">Nenhuma tentativa registrada.</td></tr>`;
  }

  // Construir linhas de achievements
  let achievementsLinhas = "";
  if (Object.keys(dados.achievements).length > 0) {
    Object.keys(dados.achievements).forEach(key => {
      const item = dados.achievements[key];
      const metadata = achievementsData[key] || { name: key, icon: "🏅" };
      const status = item.unlocked ? "Desbloqueado" : "Bloqueado";
      const dataHora = item.unlockedAt ? ` (${item.unlockedAt})` : "";
      achievementsLinhas += `<tr><td>${metadata.icon}</td><td>${metadata.name}</td><td>${status}${dataHora}</td></tr>`;
    });
  } else {
    achievementsLinhas = `<tr><td colspan="3">Nenhum achievement desbloqueado.</td></tr>`;
  }

  // HTML simples para impressão
  const htmlCompleto = `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório - Word Office Challenge</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          background: #fff;
          color: #000;
          line-height: 1.5;
          padding: 15px;
        }
        h1 { 
          font-size: 24px; 
          margin: 0 0 15px 0; 
          text-align: center; 
          border-bottom: 2px solid #0066cc; 
          padding-bottom: 8px;
          page-break-after: avoid;
        }
        h2 { 
          font-size: 16px; 
          margin: 15px 0 10px 0; 
          color: #0066cc;
          page-break-after: avoid;
        }
        p { margin: 4px 0; font-size: 13px; }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 10px 0; 
          font-size: 12px;
          page-break-inside: avoid;
        }
        th { 
          background: #0066cc; 
          color: #fff; 
          padding: 8px; 
          text-align: left; 
          font-weight: bold;
        }
        td { 
          border: 1px solid #ddd; 
          padding: 7px; 
        }
        tr:nth-child(even) { background: #f9f9f9; }
        .info-grid { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 10px; 
          margin: 15px 0; 
          page-break-inside: avoid;
        }
        .info-grid > div:nth-child(n+5) {
          grid-column: auto;
        }
        .info-grid > div:nth-child(7) {
          grid-column: 1 / 3;
        }
        .info-box { 
          background: #f5f5f5; 
          padding: 10px; 
          border-left: 3px solid #0066cc;
          font-size: 12px;
        }
        .info-box strong { 
          display: block; 
          font-size: 11px; 
          color: #666; 
          margin-bottom: 3px; 
        }
        .info-box span { 
          display: block; 
          font-size: 16px; 
          font-weight: bold; 
          color: #0066cc; 
        }
        pre { 
          background: #f9f9f9; 
          padding: 10px; 
          border: 1px solid #ddd; 
          overflow-x: auto; 
          margin: 10px 0; 
          max-height: 200px; 
          font-size: 11px;
          page-break-inside: avoid;
        }
        .footer { 
          margin-top: 15px; 
          padding-top: 10px; 
          border-top: 1px solid #ddd; 
          text-align: center; 
          font-size: 11px; 
          color: #666;
          page-break-inside: avoid;
        }
        @media print {
          body { padding: 10px; }
          * { page-break-inside: avoid; }
          table { page-break-inside: avoid; }
          thead { display: table-header-group; }
        }
      </style>
    </head>
    <body>
      <h1>📊 Relatório do Word Office Challenge</h1>

      <div class="info-grid">
        <div class="info-box">
          <strong>Data e Hora</strong>
          <span>${dados.data}</span>
        </div>
        <div class="info-box">
          <strong>Aluno</strong>
          <span>${dados.aluno}</span>
        </div>
        <div class="info-box">
          <strong>Pontuação Final</strong>
          <span>${dados.pontosFinal} pts</span>
        </div>
        <div class="info-box">
          <strong>Tempo Total</strong>
          <span>${dados.tempoTotal}s</span>
        </div>
        <div class="info-box">
          <strong>Progresso</strong>
          <span>${dados.progresso}</span>
        </div>
        <div class="info-box">
          <strong>Conclusão</strong>
          <span>${dados.percentualConclusao}%</span>
        </div>
        <div class="info-box">
          <strong>Desempenho</strong>
          <span>${dados.desempenho}</span>
        </div>
      </div>

      <h2>Histórico de Tentativas</h2>
      <table>
        <thead>
          <tr>
            <th>Tentativa</th>
            <th>Resultado</th>
            <th>Pontos</th>
            <th>Tempo</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          ${historicoLinhas}
        </tbody>
      </table>

      <h2>Achievements Desbloqueados</h2>
      <table>
        <thead>
          <tr>
            <th>Ícone</th>
            <th>Nome</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${achievementsLinhas}
        </tbody>
      </table>

      <h2>Texto Produzido</h2>
      <pre>${dados.texto}</pre>

      <div class="footer">
        <p>Relatório gerado automaticamente pelo Word Office Challenge</p>
        <p>Salve este documento como PDF usando Arquivo > Imprimir > Salvar como PDF</p>
      </div>
    </body>
    </html>
  `;

  // Abrir nova janela e escrever conteúdo
  const novaJanela = window.open("", "relatorio_word", "width=900,height=800");
  
  if (!novaJanela) {
    alert("Abra o bloqueador de pop-ups e tente novamente.");
    return;
  }

  novaJanela.document.write(htmlCompleto);
  novaJanela.document.close();

  // Aguardar renderização da página antes de imprimir
  setTimeout(() => {
    novaJanela.print();
  }, 500);
}


// =====================================================
// EXPORTAR DADOS
// =====================================================

function exportarDados() {
  const localHistorico = JSON.parse(localStorage.getItem("historicoWord")) || [];
  const localAchievements = JSON.parse(localStorage.getItem("achievementsWord")) || {};

  const dados = {
    app: "Word Office Challenge",
    dataExportacao: new Date().toLocaleString("pt-BR"),
    estadoAtual: {
      etapa: etapa,
      score: score,
      tempoTotal: tempoTotal,
      desafioAtual: desafiosAtuais[etapa]?.texto || "N/A",
      progresso: `${etapa}/${desafiosAtuais.length}`
    },
    historico: localHistorico.length ? localHistorico : historico,
    achievements: localAchievements && Object.keys(localAchievements).length ? localAchievements : achievements,
    configuracao: {
      desafiosTotais: desafiosAtuais.length,
      permitirProximoDesafio: permitirProximoDesafio,
      modoEscuro: document.body.classList.contains("dark-mode")
    }
  };

  const json = JSON.stringify(dados, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dados_word_challenge_${new Date().getTime()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function format(cmd) {
  document.execCommand(cmd, false, null);
}

function lista() {
  document.execCommand("insertUnorderedList", false, null);
}

function listaNum() {
  document.execCommand("insertOrderedList", false, null);
}

function alignText(tipo) {
  document.execCommand("justify" + tipo, false, null);
}

function justifyText() {
  document.execCommand("justifyFull", false, null);
  const editor = document.getElementById("editor");
  if (editor) {
    editor.style.textAlign = "justify";
  }
}

// =====================================================
// ATALHOS DE TECLADO
// =====================================================

function handleKeyboardShortcuts(event) {
  if (!event.ctrlKey) return;
  
  switch (event.key.toLowerCase()) {
    case 'b':
      event.preventDefault();
      format('bold');
      break;
    case 'i':
      event.preventDefault();
      format('italic');
      break;
    case 'u':
      event.preventDefault();
      format('underline');
      break;
    case 'j':
      event.preventDefault();
      justifyText();
      break;
    case 'l':
      event.preventDefault();
      alignText('left');
      break;
    case 'e':
      event.preventDefault();
      alignText('center');
      break;
    case 'r':
      event.preventDefault();
      alignText('right');
      break;
  }
}

// =====================================================
// INICIAR APLICAÇÃO
// =====================================================

window.addEventListener("DOMContentLoaded", iniciar);