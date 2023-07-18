// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { randomBytes } = require('crypto');
const axios = require('axios');

// Create express app
const app = express();

// Use body parser to parse json
app.use(bodyParser.json());

// Use cors to allow cross-origin resource sharing
app.use(cors());

// Create comments object
const commentsByPostId = {};

// Create get route to return comments based on postId
app.get('/posts/:id/comments', (req, res) => {
    res.send(commentsByPostId[req.params.id] || []);
});

// Create post route to create a comment based on postId
app.post('/posts/:id/comments', async (req, res) => {
    // Generate a random id
    const commentId = randomBytes(4).toString('hex');

    // Get the content from request body
    const { content } = req.body;

    // Get the comments for the post id
    const comments = commentsByPostId[req.params.id] || [];

    // Add a new comment to the comments array
    comments.push({ id: commentId, content, status: 'pending' });

    // Update comments object
    commentsByPostId[req.params.id] = comments;

    // Send the comment back with a 201 status code
    await axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id,
            status: 'pending'
        }
    });

    // Send the comment back with a 201 status code
    res.status(201).send(comments);
});

// Create post route to receive events
app.post('/events', async (req, res) => {
    console.log('Received event:', req.body.type);

    // Get the event type from request body
    const { type, data } = req.body;

    // Check if event type is CommentModerated
    if (type === 'CommentModerated') {
        // Get the comments for the post id
        const comments = commentsByPostId[data.postId];

        // Get the comment with the matching id
        const comment = comments.find(comment => {
            return comment.id === data.id;
        });

        // Update the status of the comment
        comment.status = data.status;