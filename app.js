/**
 * app.js - Controller for the Tree Checker Dashboard
 * Optimized for local-first privacy and professional Record Browser.
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
    
    modalClose?.addEventListener('click', () => {
        overlay.style.display = 'none';
        overlay.classList.remove('modal-large');
    });
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

        emptyState.style.display = 'none';
        resultsSection.style.display = 'block';

        scoreElement.textContent = score;
        labelElement.textContent = getScoreLabel(score);
        
        countHigh.textContent = stats.high;
        countMed.textContent = stats.med;
        countLow.textContent = stats.low;

        updateScoreColor(score);

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
        const currentRecord = parser.getFullRecord(item.id);
        const dupError = item.errors.find(e => e.type === 'duplicate');

        if (dupError) {
            overlay.classList.add('modal-large');
            const originalRecord = parser.getFullRecord(dupError.originalId);
            renderComparison(originalRecord, currentRecord);
        } else {
            overlay.classList.remove('modal-large');
            renderRecordDetail(item.errors, currentRecord);
        }
        overlay.style.display = 'flex';
    }

    function renderRecordDetail(errors, record) {
        errorDetails.innerHTML = `
            <div class="detail-section">
                <h4 style="color:#c62828; margin-bottom:0.5rem">❗ Flags:</h4>
                <ul class="error-list">
                    ${errors.map(e => `<li style="${e.severity === 3 ? 'color:#c62828; font-weight:700' : (e.severity === 2 ? 'color:#ef6c00;' : '')}">${e.msg}</li>`).join('')}
                </ul>
            </div>
            ${renderRecordBody(record)}
        `;
    }

    function renderComparison(original, duplicate) {
        errorDetails.innerHTML = `
            <div class="comparison-grid">
                <div class="comp-col">
                    <h4 class="comp-header">Original Record</h4>
                    ${renderRecordBody(original)}
                </div>
                <div class="comp-col">
                    <h4 class="comp-header" style="color:#c62828">Duplicate Record</h4>
                    ${renderRecordBody(duplicate)}
                </div>
            </div>
        `;
    }

    function renderRecordBody(record) {
        return `
            <div class="detail-section">
                <h4>🗂 Biography</h4>
                <table class="data-table">
                    ${record.events.map(ev => `
                        <tr>
                            <td class="label">${ev.type}</td>
                            <td>${ev.date}<br><small>${ev.place}</small></td>
                        </tr>
                    `).join('')}
                </table>
            </div>
            <div class="detail-section">
                <h4>👪 Family</h4>
                <table class="data-table">
                    ${record.family.parents.map(p => `<tr><td class="label">${p.role}</td><td>${p.name}</td></tr>`).join('')}
                    ${record.family.spouses.map(s => `
                        <tr><td class="label">Spouse</td><td>${s.name}</td></tr>
                        <tr><td class="label">Children</td><td>${s.children.join(', ') || 'None'}</td></tr>
                    `).join('')}
                </table>
            </div>
            ${record.sources.length ? `
                <div class="detail-section">
                    <h4>📚 Sources</h4>
                    <ul class="source-list">${record.sources.map(s => `<li>${s}</li>`).join('')}</ul>
                </div>
            ` : ''}
        `;
    }
});
