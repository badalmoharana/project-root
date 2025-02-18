document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('search-button').addEventListener('click', performSearch);
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
});

async function performSearch() {
    const input = document.getElementById('search-input');
    const query = input.value.trim();
    
    if (!query) {
        alert('Please enter a search term');
        return;
    }

    input.disabled = true;
    showLoading(true);

    try {
        const [wikiRes, ytRes] = await Promise.all([
            fetch(`/api/wiki?query=${encodeURIComponent(query)}`),
            fetch(`/api/youtube?query=${encodeURIComponent(query)}`)
        ]);

        const wikiData = await wikiRes.json();
        const ytData = await ytRes.json();

        displayResults(wikiData, ytData.videos);

    } catch (error) {
        console.error('Search Error:', error);
        displayError();
    } finally {
        input.disabled = false;
        showLoading(false);
    }
}

function displayResults(wiki, videos) {
    const mainContent = document.getElementById('main-content');
    
    // Clear previous results
    mainContent.innerHTML = `
        <div class="left-column">
            <div id="wiki-results"></div>
        </div>
        <div class="right-column">
            <h3 class="video-title">Related Videos</h3>
            <div id="youtube-results"></div>
        </div>
    `;

    const wikiDiv = document.getElementById('wiki-results');
    const ytDiv = document.getElementById('youtube-results');

    // Wikipedia Results
    wikiDiv.innerHTML = `
        <div class="wiki-card">
            <h2>${wiki.title}</h2>
            <div class="answer-section">
                <div class="short-answer">
                    <p>${wiki.briefAnswer}</p>
                    <button class="toggle-btn" onclick="toggleDetails(this)">
                        ▼ Show Detailed Explanation
                    </button>
                </div>
                <div class="detailed-answer" style="display:none">
                    ${wiki.detailedAnswer.split('\n').map(p => `<p>${p}</p>`).join('')}
                </div>
            </div>
            ${wiki.relatedQuestions.length ? `
            <div class="related">
                <h3>Related Questions</h3>
                <ul>
                    ${wiki.relatedQuestions.map(q => `
                        <li><a href="#" onclick="setSearch('${q}')">${q}</a></li>
                    `).join('')}
                </ul>
            </div>` : ''}
        </div>
    `;

    // YouTube Results
    ytDiv.innerHTML = videos.length ? `
        <div class="video-grid">
            ${videos.map(video => `
                <div class="video-item">
                    <iframe src="https://www.youtube.com/embed/${video.id}" 
                            title="${video.title}"
                            allowfullscreen></iframe>
                    <p class="video-desc">${video.title}</p>
                </div>
            `).join('')}
        </div>
    ` : '<p class="no-videos">No related videos found</p>';
}

window.toggleDetails = (btn) => {
    const container = btn.closest('.answer-section');
    const short = container.querySelector('.short-answer');
    const detailed = container.querySelector('.detailed-answer');
    
    if (detailed.style.display === 'none') {
        detailed.style.display = 'block';
        short.style.display = 'none';
        btn.textContent = '▲ Hide Details';
    } else {
        detailed.style.display = 'none';
        short.style.display = 'block';
        btn.textContent = '▼ Show Detailed Explanation';
    }
};

window.setSearch = (query) => {
    const input = document.getElementById('search-input');
    input.value = query;
    performSearch();
};

function showLoading(show) {
    document.getElementById('search-button').textContent = 
        show ? 'Searching...' : 'Search';
}

function displayError() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="error">
            <p>⚠️ Failed to load results. Please try again.</p>
        </div>
    `;
}