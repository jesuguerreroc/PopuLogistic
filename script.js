let scenarios = [];
let chart = null;
const colors = [
    '#2563eb', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

// Inicializar valores
function updateValue(id) {
    const element = document.getElementById(id);
    const valueDisplay = document.getElementById(id + '-value');
    valueDisplay.textContent = element.value;
}

// Función del modelo logístico
function logisticModel(t, P0, r, K) {
    return K / (1 + ((K - P0) / P0) * Math.exp(-r * t));
}

// Cambiar de página
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    // Actualizar enlaces activos
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageId) {
            link.classList.add('active');
        }
    });

    if (pageId === 'simulator' && !chart) {
        initChart();
    }
}

// Inicializar gráfica
function initChart() {
    const ctx = document.getElementById('populationChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Tiempo (años)',
                        font: { size: 14, weight: 'bold' }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Población',
                        font: { size: 14, weight: 'bold' }
                    },
                    beginAtZero: true
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Agregar escenario
function addScenario() {
    const P0 = parseFloat(document.getElementById('p0').value);
    const r = parseFloat(document.getElementById('r').value);
    const K = parseFloat(document.getElementById('k').value);
    const timeMax = parseInt(document.getElementById('time').value);

    const scenario = {
        id: Date.now(),
        P0: P0,
        r: r,
        K: K,
        timeMax: timeMax,
        color: colors[scenarios.length % colors.length]
    };

    scenarios.push(scenario);
    updateChart();
    updateScenariosList();
    updateInterpretation();
}

// Actualizar gráfica
function updateChart() {
    if (!chart) return;

    if (scenarios.length === 0) {
        chart.data.labels = [];
        chart.data.datasets = [];
        chart.update();
        return;
    }

    const maxTime = Math.max(...scenarios.map(s => s.timeMax));
    const labels = Array.from({length: maxTime + 1}, (_, i) => i);

    const datasets = scenarios.map((scenario, index) => {
        const data = labels.map(t => {
            if (t <= scenario.timeMax) {
                return logisticModel(t, scenario.P0, scenario.r, scenario.K);
            }
            return null;
        });

        return {
            label: `Escenario ${index + 1} (P₀=${scenario.P0}, r=${scenario.r}, K=${scenario.K})`,
            data: data,
            borderColor: scenario.color,
            backgroundColor: scenario.color + '20',
            borderWidth: 3,
            tension: 0.4,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 5
        };
    });

    chart.data.labels = labels;
    chart.data.datasets = datasets;
    chart.update('active');
}

// Actualizar lista de escenarios
function updateScenariosList() {
    const list = document.getElementById('scenariosList');

    if (scenarios.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <p>No hay escenarios agregados</p>
                <small>Ajusta los parámetros y haz clic en "Agregar Escenario"</small>
            </div>
        `;
        return;
    }

    list.innerHTML = scenarios.map((scenario, index) => `
        <div class="scenario-item">
            <div style="display: flex; align-items: center;">
                <div class="scenario-color" style="background: ${scenario.color}"></div>
                <div class="scenario-info">
                    <strong>Escenario ${index + 1}</strong><br>
                    <small>P₀: ${scenario.P0} | r: ${scenario.r} | K: ${scenario.K}</small>
                </div>
            </div>
            <button class="btn btn-danger" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="removeScenario(${scenario.id})">
                ✕
            </button>
        </div>
    `).join('');
}

// Eliminar escenario
function removeScenario(id) {
    scenarios = scenarios.filter(s => s.id !== id);
    updateChart();
    updateScenariosList();
    updateInterpretation();
}

// Limpiar todos los escenarios
function clearScenarios() {
    scenarios = [];
    updateChart();
    updateScenariosList();
    updateInterpretation();
}

// Actualizar interpretación
function updateInterpretation() {
    const panel = document.getElementById('interpretation');

    if (scenarios.length === 0) {
        panel.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📈</div>
                <p>Sin datos para analizar</p>
                <small>Agrega un escenario para ver el análisis detallado</small>
            </div>
        `;
        return;
    }

    let html = '';

    scenarios.forEach((scenario, index) => {
        const halfK = scenario.K / 2;
        const timeToHalfK = Math.log((scenario.K - scenario.P0) / scenario.P0) / scenario.r;
        const time95K = Math.log(19 * (scenario.K - scenario.P0) / scenario.P0) / scenario.r;

        html += `
            <div class="stat-card" style="background: ${scenario.color}">
                <h4>📊 Escenario ${index + 1}</h4>
                <p><strong>Población Inicial:</strong> ${scenario.P0.toFixed(0)} individuos</p>
                <p><strong>Capacidad de Carga:</strong> ${scenario.K.toFixed(0)} individuos</p>
                <p><strong>Tasa de Crecimiento:</strong> ${(scenario.r * 100).toFixed(1)}% por año</p>
                <hr>
                <p><strong>⏱️ Tiempo para alcanzar 50% de K:</strong> ${timeToHalfK > 0 ? timeToHalfK.toFixed(1) + ' años' : 'Ya superó este punto'}</p>
                <p><strong>⏱️ Tiempo para alcanzar 95% de K:</strong> ${time95K > 0 ? time95K.toFixed(1) + ' años' : 'Ya superó este punto'}</p>
                <p><strong>📈 Comportamiento:</strong> ${scenario.P0 < scenario.K ? 'Crecimiento hacia K' : 'Población inicial excede K'}</p>
            </div>
        `;
    });

    if (scenarios.length > 1) {
        html += `
            <div class="stat-card" style="background: var(--accent)">
                <h4>🔄 Comparación entre Escenarios</h4>
                <p><strong>Escenarios más rápidos:</strong> Aquellos con mayor valor de 'r' alcanzan K más rápidamente</p>
                <p><strong>Capacidad óptima:</strong> Un K más alto permite poblaciones más grandes a largo plazo</p>
                <p><strong>Punto de partida:</strong> P₀ bajo genera curvas más pronunciadas en la fase inicial</p>
            </div>
        `;
    }

    panel.innerHTML = html;
}

// Efecto de scroll en navbar
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    updateValue('p0');
    updateValue('r');
    updateValue('k');
    updateValue('time');
});