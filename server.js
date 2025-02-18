const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.static('public'));

// Wikipedia API Handler
app.get('/api/wiki', async (req, res) => {
    try {
        const query = req.query.query;
        const searchUrl = 'https://en.wikipedia.org/w/api.php';

        // Search for page
        const searchRes = await axios.get(searchUrl, {
            params: {
                action: 'query',
                format: 'json',
                list: 'search',
                srsearch: query,
                srlimit: 1
            }
        });

        const results = searchRes.data.query.search;
        if (!results?.length) {
            return res.json({
                title: 'No results found',
                briefAnswer: 'Try a different search term',
                detailedAnswer: '',
                relatedQuestions: []
            });
        }

        // Get page content
        const contentRes = await axios.get(searchUrl, {
            params: {
                action: 'query',
                format: 'json',
                prop: 'extracts',
                exintro: true,
                explaintext: true,
                titles: results[0].title
            }
        });

        const page = Object.values(contentRes.data.query.pages)[0];
        const content = page.extract?.split('\n\n') || [];
        
        res.json({
            title: page.title,
            briefAnswer: content[0] || 'Summary unavailable',
            detailedAnswer: content.slice(1).join('\n\n') || '',
            relatedQuestions: [
                `What is ${query}?`,
                `History of ${query}`,
                `Why is ${query} important?`
            ]
        });

    } catch (error) {
        console.error('Wiki API Error:', error);
        res.status(500).json({
            title: 'Error',
            briefAnswer: 'Failed to load content',
            detailedAnswer: '',
            relatedQuestions: []
        });
    }
});

// YouTube API Handler
app.get('/api/youtube', async (req, res) => {
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: req.query.query,
                type: 'video',
                maxResults: 6,
                key: process.env.YOUTUBE_API_KEY
            }
        });

        const videos = response.data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title
        }));

        res.json({ videos });

    } catch (error) {
        console.error('YouTube API Error:', error);
        res.status(500).json({ videos: [] });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));