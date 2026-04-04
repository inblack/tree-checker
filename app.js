/**
 * app.js - Controller for the Tree Checker Dashboard
 * Optimized for local-first privacy and simple UI.
 */

document.addEventListener('DOMContentLoaded', () => {
    const parser = new GEDCOMParser();
    const listElement = document.getElementById('ancestor-list');
    const scoreElement = document.getElementById('health-score');
    const labelElement = document.getElementById('health-label');
    const uploadInput = document.getElementById('upload-input');
    const uploadBtn = document.getElementById('upload-btn');
    const emptyState = document.getElementById('empty-state');
    const resultsSection = document.getElementById('results-section');
    
    // Details Modal
    const overlay = document.getElementById('details-overlay');
    const detailName = document.getElementById('detail-name');
    const errorDetails = document.getElementById('error-details');
    const modalClose = document.getElementById('modal-close');
    
    // Info Modal
    const infoModal = document.getElementById('info-modal');
    const infoClose = document.getElementById('info-close');

    // Counts
    const countHigh = document.getElementById('count-high');
    const countMed = document.getElementById('count-med');
    const countLow = document.getElementById('count-low');

    // Event Listeners
    uploadBtn?.addEventListener('click', () => uploadInput.click());
    uploadInput?.addEventListener('change', handleFileUpload);
    
    modalClose?.addEventListener('click', () => overlay.style.display = 'none');
    infoClose?.addEventListener('click', () => infoModal.style.display = 'none');

    // Wire all info icons
    document.querySelectorAll('.info-icon').forEach(icon => {
        icon.onclick = (e) => {
            e.stopPropagation();
            infoModal.style.display = 'flex';
        };
    });

    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            parser.reset();
            parser.parse(event.target.result);
            renderDashboard();
        };
        reader.readAsText(file);
    }

    function renderDashboard() {
        const { diagnostics, stats } = parser.analyze();
        const score = parser.calculateScore();

        // Update UI state
        emptyState.style.display = 'none';
        resultsSection.style.display = 'block';

        // Update Score Card
        scoreElement.textContent = score;
        labelElement.textContent = getScoreLabel(score);
        
        countHigh.textContent = stats.high;
        countMed.textContent = stats.med;
        countLow.textContent = stats.low;

        updateScoreColor(score);

        // Render List
        listElement.innerHTML = '';
        
        const sortedDiagnostics = [...diagnostics].sort((a, b) => {
            const aMax = Math.max(...a.errors.map(e => e.severity));
            const bMax = Math.max(...b.errors.map(e => e.severity));
            return bMax - aMax || b.errors.length - a.errors.length;
        });

        if (sortedDiagnostics.length === 0) {
            listElement.innerHTML = '<li class="ancestor-item" style="padding: 2rem; text-align: center; color: var(--success);">Perfect Tree! No diagnostics found.</li>';
            return;
        }

        sortedDiagnostics.forEach(item => {
            const li = document.createElement('li');
            li.className = 'ancestor-item';
            const birthInfo = item.birthYear ? `${item.birthYear} - ` : '';
            
            li.innerHTML = `
                <div class="avatar">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="#777">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                </div>
                <div class="ancestor-info">
                    <h3>${item.name}</h3>
                    <div class="years">${birthInfo}</div>
                    <div class="tags">
                        ${item.errors.slice(0, 2).map(e => `
                            <span class="error-tag" style="${e.severity === 3 ? 'background:#ffebee;color:#c62828' : (e.severity === 2 ? 'background:#fff3e0;color:#ef6c00' : '')}">${e.msg.split(':')[0]}</span>
                        `).join('')}
                        ${item.errors.length > 2 ? `<span class="error-tag">+${item.errors.length - 2} more</span>` : ''}
                    </div>
                </div>
            `;
            li.onclick = () => showDetails(item);
            listElement.appendChild(li);
        });
    }

    function getScoreLabel(score) {
        if (score >= 9) return 'Excellent';
        if (score >= 7) return 'Good';
        if (score >= 5) return 'Fair';
        return 'Poor';
    }

    function updateScoreColor(score) {
        const bg = document.querySelector('.score-main');
        if (!bg) return;
        if (score >= 9) bg.style.background = '#2e7d32';
        else if (score >= 7) bg.style.background = '#1565c0';
        else if (score >= 5) bg.style.background = '#8d2e2e';
        else bg.style.background = '#d32f2f';
    }

    function showDetails(item) {
        detailName.textContent = item.name;
        errorDetails.innerHTML = item.errors.map(e => `
            <li style="${e.severity === 3 ? 'color:#c62828; font-weight:700' : (e.severity === 2 ? 'color:#ef6c00;' : '')}">${e.msg}</li>
        `).join('');
        overlay.style.display = 'flex';
    }
});
