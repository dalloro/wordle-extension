document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['stats'], (result) => {
        const stats = result.stats || {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
            history: []
        };

        renderSummary(stats);
        renderDistribution(stats);
        renderHistory(stats);
    });
});

function renderSummary(stats) {
    document.getElementById('games-played').textContent = stats.gamesPlayed;
    const winPct = stats.gamesPlayed > 0
        ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
        : 0;
    document.getElementById('win-percentage').textContent = winPct;
    document.getElementById('current-streak').textContent = stats.currentStreak;
    document.getElementById('max-streak').textContent = stats.maxStreak;
}

function renderDistribution(stats) {
    const container = document.getElementById('guess-distribution');
    const maxVal = Math.max(...Object.values(stats.guessDistribution), 1); // Avoid div by zero

    for (let i = 1; i <= 6; i++) {
        const count = stats.guessDistribution[i];
        const width = Math.max(7, Math.round((count / maxVal) * 100)); // Min 7% for visibility

        const row = document.createElement('div');
        row.className = 'dist-row';
        row.innerHTML = `
      <div class="dist-label">${i}</div>
      <div class="dist-bar-container">
        <div class="dist-bar ${count > 0 ? 'highlight' : ''}" style="width: ${width}%">${count}</div>
      </div>
    `;
        container.appendChild(row);
    }
}

function renderHistory(stats) {
    const tbody = document.getElementById('history-body');
    // Show last 50 games, newest first
    const recentHistory = stats.history.slice().reverse().slice(0, 50);

    recentHistory.forEach(game => {
        const tr = document.createElement('tr');
        const date = new Date(game.timestamp).toLocaleDateString();
        tr.innerHTML = `
      <td>${date}</td>
      <td style="font-family: monospace; text-transform: uppercase;">${game.word}</td>
      <td class="result-${game.result}">${game.result.toUpperCase()}</td>
      <td>${game.attempts}</td>
    `;
        tbody.appendChild(tr);
    });
}