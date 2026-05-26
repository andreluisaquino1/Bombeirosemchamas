// Manipulação de interface e DOM

const GameUI = {
    typewriterSpeed: 50, // Padrão
    isTyping: false,

    showScreen: function(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },

    updateHeader: function() {
        document.getElementById('ui-day').innerText = GameEngine.state.day;
        document.getElementById('ui-rep').innerText = GameEngine.state.reputation;
        document.getElementById('ui-moral').innerText = GameEngine.state.moral;
        document.getElementById('ui-money').innerText = GameEngine.state.money.toFixed(2);
        document.getElementById('ui-level').innerText = GameEngine.state.level;
        const repTitle = document.getElementById('ui-rep-title');
        if (repTitle) repTitle.innerText = GameEngine.getReputationTitle();
    },

    toggleHeader: function(show) {
        const header = document.getElementById('game-header');
        if (show) header.classList.remove('hidden');
        else header.classList.add('hidden');
    },

    typeText: function(containerId, lines, callback) {
        const container = document.getElementById(containerId);
        container.innerHTML = "";
        this.isTyping = false;

        for (let i = 0; i < lines.length; i++) {
            const p = document.createElement("p");
            p.innerHTML = lines[i];
            container.appendChild(p);
        }
        
        if (callback) callback();
    },

    renderHistory: function() {
        const historyContainer = document.getElementById('history-content');
        historyContainer.innerHTML = "";

        if (GameEngine.state.history.length === 0) {
            historyContainer.innerHTML = "Nenhum registro encontrado.";
            return;
        }

        GameEngine.state.history.forEach(log => {
            const p = document.createElement("div");
            p.className = `log-entry ${log.type}`;
            p.innerText = log.text;
            historyContainer.appendChild(p);
        });
    }
};
