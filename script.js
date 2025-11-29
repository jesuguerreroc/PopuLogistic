let scenarios = [];
let expScenarios = [];
let chart = null;
let expChart = null;
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

// Función del modelo exponencial
function exponentialModel(t, P0, r) {
    return P0 * Math.exp(r * t);
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
    
    if (pageId === 'exponential' && !expChart) {
        initExpChart();
    }
}

// Inicializar gráfica logística
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

// Agregar escenario logístico
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

// Actualizar gráfica logística
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

// Actualizar lista de escenarios logísticos
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

// Eliminar escenario logístico
function removeScenario(id) {
    scenarios = scenarios.filter(s => s.id !== id);
    updateChart();
    updateScenariosList();
    updateInterpretation();
}

// Limpiar todos los escenarios logísticos
function clearScenarios() {
    scenarios = [];
    updateChart();
    updateScenariosList();
    updateInterpretation();
}

// Actualizar interpretación logística
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

// ========== FUNCIONES PARA SIMULADOR EXPONENCIAL ==========

// Actualizar valores exponenciales
function updateExpValue(id) {
    const element = document.getElementById(id);
    const valueDisplay = document.getElementById(id + '-value');
    valueDisplay.textContent = element.value;
}

// Inicializar gráfica exponencial
function initExpChart() {
    const ctx = document.getElementById('exponentialChart').getContext('2d');
    expChart = new Chart(ctx, {
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
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += Math.round(context.parsed.y).toLocaleString() + ' células';
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Tiempo (horas)',
                        font: { size: 14, weight: 'bold' }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Población Bacteriana (células)',
                        font: { size: 14, weight: 'bold' }
                    },
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
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

// Agregar escenario exponencial
function addExpScenario() {
    const P0 = parseFloat(document.getElementById('exp-p0').value);
    const r = parseFloat(document.getElementById('exp-r').value);
    const timeMax = parseInt(document.getElementById('exp-time').value);

    const scenario = {
        id: Date.now(),
        P0: P0,
        r: r,
        timeMax: timeMax,
        color: colors[expScenarios.length % colors.length]
    };

    expScenarios.push(scenario);
    updateExpChart();
    updateExpScenariosList();
    updateExpInterpretation();
}

// Actualizar gráfica exponencial
function updateExpChart() {
    if (!expChart) return;

    if (expScenarios.length === 0) {
        expChart.data.labels = [];
        expChart.data.datasets = [];
        expChart.update();
        return;
    }

    const maxTime = Math.max(...expScenarios.map(s => s.timeMax));
    const labels = [];
    for (let i = 0; i <= maxTime * 10; i++) {
        labels.push((i / 10).toFixed(1));
    }

    const datasets = expScenarios.map((scenario, index) => {
        const data = labels.map(t => {
            const time = parseFloat(t);
            if (time <= scenario.timeMax) {
                return exponentialModel(time, scenario.P0, scenario.r);
            }
            return null;
        });

        return {
            label: `Cultivo ${index + 1} (P₀=${scenario.P0}, r=${scenario.r})`,
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

    expChart.data.labels = labels;
    expChart.data.datasets = datasets;
    expChart.update('active');
}

// Actualizar lista de escenarios exponenciales
function updateExpScenariosList() {
    const list = document.getElementById('expScenariosList');

    if (expScenarios.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🦠</div>
                <p>No hay cultivos agregados</p>
                <small>Ajusta los parámetros y haz clic en "Agregar Cultivo"</small>
            </div>
        `;
         return;
}

list.innerHTML = expScenarios.map((scenario, index) => `
    <div class="scenario-item">
        <div style="display: flex; align-items: center;">
            <div class="scenario-color" style="background: ${scenario.color}"></div>
            <div class="scenario-info">
                <strong>Cultivo ${index + 1}</strong><br>
                <small>P₀: ${scenario.P0} células | r: ${scenario.r}/h | t: ${scenario.timeMax}h</small>
            </div>
        </div>
        <button class="btn btn-danger" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="removeExpScenario(${scenario.id})">
            ✕
        </button>
    </div>
`).join('');
}
// Eliminar escenario exponencial
function removeExpScenario(id) {
expScenarios = expScenarios.filter(s => s.id !== id);
updateExpChart();
updateExpScenariosList();
updateExpInterpretation();
}
// Limpiar todos los escenarios exponenciales
function clearExpScenarios() {
expScenarios = [];
updateExpChart();
updateExpScenariosList();
updateExpInterpretation();
}
// Actualizar interpretación exponencial
function updateExpInterpretation() {
const panel = document.getElementById('expInterpretation');
if (expScenarios.length === 0) {
    panel.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📈</div>
            <p>Sin datos para analizar</p>
            <small>Agrega un cultivo para ver el análisis detallado</small>
        </div>
    `;
    return;
}

let html = '';

expScenarios.forEach((scenario, index) => {
    const finalPop = exponentialModel(scenario.timeMax, scenario.P0, scenario.r);
    const doublingTime = Math.log(2) / scenario.r;
    const growthFactor = finalPop / scenario.P0;
    const time50 = Math.log(50 / scenario.P0) / scenario.r;
    const time1000 = Math.log(1000 / scenario.P0) / scenario.r;

    html += `
        <div class="stat-card" style="background: ${scenario.color}">
            <h4>🧪 Cultivo ${index + 1}</h4>
            <p><strong>Población Inicial:</strong> ${scenario.P0.toFixed(0)} células</p>
            <p><strong>Tasa de Crecimiento:</strong> ${scenario.r} por hora</p>
            <p><strong>Población Final (${scenario.timeMax}h):</strong> ${finalPop.toLocaleString('es-ES', {maximumFractionDigits: 0})} células</p>
            <hr>
            <p><strong>⏱️ Tiempo de Duplicación:</strong> ${doublingTime.toFixed(2)} horas</p>
            <p><strong>📊 Factor de Crecimiento:</strong> ${growthFactor.toFixed(2)}x</p>
            ${time50 <= scenario.timeMax ? `<p><strong>🎯 Alcanza 50 células en:</strong> ${time50.toFixed(2)} horas</p>` : ''}
            ${time1000 <= scenario.timeMax ? `<p><strong>🎯 Alcanza 1000 células en:</strong> ${time1000.toFixed(2)} horas</p>` : ''}
            <p><strong>🦠 Comportamiento:</strong> Crecimiento exponencial ilimitado</p>
        </div>
    `;
});

if (expScenarios.length > 1) {
    const fastest = expScenarios.reduce((max, s) => s.r > max.r ? s : max);
    const slowest = expScenarios.reduce((min, s) => s.r < min.r ? s : min);
    const fastestIndex = expScenarios.indexOf(fastest) + 1;
    const slowestIndex = expScenarios.indexOf(slowest) + 1;

    html += `
        <div class="stat-card" style="background: var(--accent)">
            <h4>🔄 Comparación entre Cultivos</h4>
            <p><strong>Cultivo más rápido:</strong> Cultivo ${fastestIndex} (r=${fastest.r}/h)</p>
            <p><strong>Cultivo más lento:</strong> Cultivo ${slowestIndex} (r=${slowest.r}/h)</p>
            <p><strong>Diferencia de velocidad:</strong> ${(fastest.r / slowest.r).toFixed(2)}x más rápido</p>
            <hr>
            <p style="font-size: 0.9rem; opacity: 0.95;">
                💡 <strong>Nota:</strong> En condiciones reales, las bacterias eventualmente agotan los nutrientes y el crecimiento se desacelera. El modelo exponencial es más preciso en las primeras horas del cultivo.
            </p>
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
updateExpValue('exp-p0');
updateExpValue('exp-r');
updateExpValue('exp-time');
});