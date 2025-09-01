// Calculadora de Turnos de Enfermagem com resumo
class ShiftCalculator {
    constructor() {
        // Turnos exemplo com formato decimal para meias horas (8.5 = 8:30)
        this.shifts = [
            {id: 1, inicio: 8.0, fim: 14.0, numero: 4},
            {id: 2, inicio: 14.0, fim: 20.0, numero: 3},
            {id: 3, inicio: 20.0, fim: 8.0, numero: 2}
        ];
        this.nextId = 4;
        
        // Array de blocos de meia hora (48 blocos por dia)
        this.timeBlocks = [];
        for (let hour = 0; hour < 24; hour++) {
            this.timeBlocks.push(hour + 0.0); // :00
            this.timeBlocks.push(hour + 0.5); // :30
        }
        
        this.init();
    }

    init() {
        this.renderShifts();
        this.calculateTotals();
        this.renderSummary();
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'addShift') {
                e.preventDefault();
                this.addShift();
            } else if (e.target && e.target.classList.contains('btn-remove')) {
                e.preventDefault();
                const id = parseInt(e.target.dataset.id, 10);
                this.removeShift(id);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target && e.target.classList.contains('shift-input')) {
                const id = parseInt(e.target.dataset.id, 10);
                const field = e.target.dataset.field;
                const value = e.target.value;
                
                if (!this.updateShift(id, field, value)) {
                    const shift = this.shifts.find(s => s.id === id);
                    if (shift) {
                        e.target.value = this.formatTimeForInput(shift[field]);
                    }
                }
            }
        });
    }

    addShift() {
        const newShift = {
            id: this.nextId++,
            inicio: 8.0,
            fim: 16.0,
            numero: 1
        };
        this.shifts.push(newShift);
        this.renderShifts();
        this.calculateTotals();
        this.renderSummary();
    }

    removeShift(id) {
        this.shifts = this.shifts.filter(shift => shift.id !== id);
        this.renderShifts();
        this.calculateTotals();
        this.renderSummary();
    }

    updateShift(id, field, value) {
        const shift = this.shifts.find(s => s.id === id);
        if (shift) {
            if (field === 'inicio' || field === 'fim') {
                const timeValue = this.parseTimeInput(value);
                if (timeValue === null) {
                    return false;
                }
                shift[field] = timeValue;
            } else if (field === 'numero') {
                const numValue = parseInt(value, 10);
                if (isNaN(numValue) || numValue < 0) {
                    return false;
                }
                shift[field] = numValue;
            }
            this.renderShifts();
            this.calculateTotals();
            this.renderSummary();
            return true;
        }
        return false;
    }

    parseTimeInput(value) {
        // Aceita formatos como "8", "8:30", "8.5"
        const cleanValue = value.toString().trim();
        
        if (cleanValue.includes(':')) {
            const [hours, minutes] = cleanValue.split(':');
            const h = parseInt(hours, 10);
            const m = parseInt(minutes, 10);
            
            if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || (m !== 0 && m !== 30)) {
                return null;
            }
            
            return h + (m === 30 ? 0.5 : 0);
        } else {
            const numValue = parseFloat(cleanValue);
            if (isNaN(numValue) || numValue < 0 || numValue >= 24) {
                return null;
            }
            
            // Arredondar para blocos de 0.5
            const rounded = Math.round(numValue * 2) / 2;
            return rounded;
        }
    }

    formatTimeForInput(timeValue) {
        const hours = Math.floor(timeValue);
        const minutes = (timeValue % 1) === 0.5 ? 30 : 0;
        return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }

    formatTimeForDisplay(timeValue) {
        const hours = Math.floor(timeValue);
        const minutes = (timeValue % 1) === 0.5 ? ':30' : ':00';
        return `${hours}${minutes}`;
    }

    getBlocksInShift(inicio, fim) {
        const blocks = [];
        
        if (inicio <= fim) {
            // Turno normal no mesmo dia
            for (let i = 0; i < this.timeBlocks.length; i++) {
                const block = this.timeBlocks[i];
                if (block >= inicio && block < fim) {
                    blocks.push(i);
                }
            }
        } else {
            // Turno noturno (atravessa meia-noite)
            for (let i = 0; i < this.timeBlocks.length; i++) {
                const block = this.timeBlocks[i];
                if (block >= inicio || block < fim) {
                    blocks.push(i);
                }
            }
        }
        
        return blocks;
    }

    calculateShiftDuration(inicio, fim) {
        if (inicio <= fim) {
            return fim - inicio;
        } else {
            return (24 - inicio) + fim;
        }
    }

    renderSummary() {
        const summaryGrid = document.getElementById('summaryGrid');
        let totalDayHours = 0;
        
        let summaryHtml = '';
        
        this.shifts.forEach((shift, index) => {
            const shiftDuration = this.calculateShiftDuration(shift.inicio, shift.fim);
            const shiftTotalHours = shiftDuration * shift.numero;
            totalDayHours += shiftTotalHours;
            
            const turnoName = `${this.formatTimeForInput(shift.inicio)}/${this.formatTimeForInput(shift.fim)}`;
            
            summaryHtml += `
                <div class="summary-card">
                    <div class="summary-turno">Turno ${index + 1}: ${turnoName}</div>
                    <div class="summary-enfermeiros">${shift.numero} enfermeiros</div>
                    <div class="summary-horas">${shiftDuration.toFixed(1)}h por turno</div>
                    <div class="summary-total">${shiftTotalHours.toFixed(1)}h total</div>
                </div>
            `;
        });
        
        // Card do total do dia
        summaryHtml += `
            <div class="summary-card summary-card--total">
                <div class="summary-turno">Total do Dia</div>
                <div class="summary-total-day">${totalDayHours.toFixed(1)} horas</div>
            </div>
        `;
        
        summaryGrid.innerHTML = summaryHtml;
    }

    renderShifts() {
        const tbody = document.getElementById('shiftsTableBody');
        tbody.innerHTML = '';

        this.shifts.forEach(shift => {
            const row = document.createElement('tr');
            row.className = 'shift-row';
            
            const activeBlocks = this.getBlocksInShift(shift.inicio, shift.fim);
            const totalHours = this.calculateShiftDuration(shift.inicio, shift.fim) * shift.numero;
            
            let html = `
                <td><input type="text" class="shift-input" data-id="${shift.id}" data-field="inicio" value="${this.formatTimeForInput(shift.inicio)}"></td>
                <td><input type="text" class="shift-input" data-id="${shift.id}" data-field="fim" value="${this.formatTimeForInput(shift.fim)}"></td>
                <td><input type="number" class="shift-input" data-id="${shift.id}" data-field="numero" value="${shift.numero}" min="0"></td>
            `;
            
            // Renderizar os 48 blocos de meia hora
            for (let i = 0; i < this.timeBlocks.length; i++) {
                const isActive = activeBlocks.includes(i);
                const cellClass = isActive ? 'active-cell' : '';
                const cellValue = isActive ? shift.numero : '';
                html += `<td class="${cellClass}">${cellValue}</td>`;
            }
            
            html += `
                <td class="total-hours-cell">${totalHours.toFixed(1)}</td>
                <td><button class="btn btn--danger btn-remove" data-id="${shift.id}">×</button></td>
            `;
            
            row.innerHTML = html;
            tbody.appendChild(row);
        });
    }

    calculateTotals() {
        const totalsRow = document.getElementById('totalsRow');
        const totals = new Array(this.timeBlocks.length).fill(0);
        let grandTotal = 0;
        
        // Calcular totais por bloco
        this.shifts.forEach(shift => {
            const activeBlocks = this.getBlocksInShift(shift.inicio, shift.fim);
            const shiftTotal = this.calculateShiftDuration(shift.inicio, shift.fim) * shift.numero;
            grandTotal += shiftTotal;
            
            activeBlocks.forEach(blockIndex => {
                totals[blockIndex] += shift.numero;
            });
        });
        
        // Renderizar linha de totais
        let html = '<td colspan="3" class="totals-label">Totais</td>';
        totals.forEach(total => {
            html += `<td>${total || ''}</td>`;
        });
        html += `<td class="grand-total">${grandTotal.toFixed(1)}</td>`; // TOTAL GERAL
        html += '<td></td>'; // Coluna de ações vazia
        
        totalsRow.innerHTML = html;
    }
}

// Inicializar aplicação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new ShiftCalculator();
});