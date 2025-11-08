// server.js

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

// New Imports
const firebase = require('firebase-admin');
const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit'); // For PDF generation

const app = express();
const port = 3001; 

// --- 1. Database & Auth Initialization ---

// MongoDB Setup
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

// Firebase Admin Setup
try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized.");
} catch (e) {
    console.error("Firebase Initialization Error. Check FIREBASE_SERVICE_ACCOUNT in .env", e.message);
}

// Function to connect to MongoDB
async function connectToMongo() {
    try {
        await mongoClient.connect();
        db = mongoClient.db('ai-course-db');
        console.log("MongoDB Connected successfully.");
    } catch (e) {
        console.error("MongoDB Connection Error:", e);
        process.exit(1);
    }
}

// Gemini API Setup
const ai = new GoogleGenAI({}); 

// System Instruction to force a JSON output structure with resources
const systemInstruction = `You are an expert Course Generator. Your task is to take a user's prompt (Topic, Audience, Duration) and generate a detailed, structured course outline. You MUST return the response ONLY as a JSON object, following this exact schema. For each module, provide at least one source link for a video reference or study material.

{
  "title": "<Course Title>",
  "modules": [
    {
      "title": "<Module Title, e.g., Module 1: Introduction>",
      "lessons": [
        "<Lesson 1 Title>",
        "<Lesson 2 Title>"
      ],
      "resources": [ 
        {
          "type": "Video" | "Article" | "Book",
          "title": "<Resource Title/Description>",
          "link": "<Full URL of the source>"
        }
      ]
    }
  ]
}
Do NOT include any extra text or explanations outside the JSON object. The response must be a valid, parseable JSON string.`;

// --- 2. Middleware Setup ---

app.use(cors()); 
app.use(express.json()); 

// -------------------------------------------------------------------
// 💥 Middleware Definition (Moved to fix ReferenceError)
// -------------------------------------------------------------------

// Authentication Middleware to verify Firebase ID Token
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required. Token missing.' });
    }

    const idToken = authHeader.split(' ')[1];

    try {
        const decodedToken = await firebase.auth().verifyIdToken(idToken);
        req.user = decodedToken; // Attach decoded user info (UID)
        next();
    } catch (error) {
        console.error("Token verification failed:", error.message);
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

// --- 3. API Routes ---

// --- Route 1: Generate Course Outline (Unprotected) ---

app.post('/api/generate-course', async (req, res) => {
    const userPrompt = req.body.prompt;

    if (!userPrompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }

    try {
        const contents = [{ role: "user", parts: [{ text: userPrompt }] }];

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json", 
            }
        });

        const jsonResponseText = response.text.trim();
        let courseData;

        try {
            courseData = JSON.parse(jsonResponseText);
        } catch (parseError) {
            console.error("Failed to parse JSON from AI:", jsonResponseText);
            return res.status(500).json({ 
                error: "AI response was not valid JSON.",
                raw_response: jsonResponseText
            });
        }
        
        res.json({
            success: true,
            course: courseData
        });

    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ error: 'Failed to communicate with the AI service.', details: error.message });
    }
});


// --- Route 2: Export Course to PDF (Unprotected/File Stream) ---

// Helper function to generate PDF from JSON structure
function generatePdf(doc, course) {
    doc.fontSize(20).text(course.title || 'Course Outline', { align: 'center' }).moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`).moveDown();
    
    course.modules.forEach((module, modIndex) => {
        // Module Title
        doc.fillColor('#1e40af').fontSize(16).text(`${module.title}`, { underline: true }).moveDown(0.5);
        
        // Lessons
        doc.fillColor('black').fontSize(12);
        module.lessons.forEach((lesson, lessonIndex) => {
            doc.text(`- ${lesson}`);
        });

        // Resources
        if (module.resources && module.resources.length > 0) {
            doc.moveDown(0.5);
            doc.fillColor('#059669').fontSize(10).text('Resources:', { underline: true });
            module.resources.forEach(resource => {
                 doc.fillColor('black').fontSize(10).text(`[${resource.type}]: ${resource.title || 'Link'}`);
                 doc.fillColor('#3b82f6').fontSize(10).text(`Link: ${resource.link}`, { link: resource.link });
            });
        }
        
        doc.moveDown(1);
    });

    doc.end();
}

app.post('/api/export-course', (req, res) => {
    const courseData = req.body.course;

    if (!courseData || !courseData.modules) {
        return res.status(400).send('Invalid course data provided.');
    }

    // Set the response headers for a file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="course_outline.pdf"');

    const doc = new PDFDocument();
    generatePdf(doc, courseData);
    doc.pipe(res); 
});


// --- Route 3: History Storage (Protected) ---

app.post('/api/history/save', verifyToken, async (req, res) => {
    const { sessionId, title, messages } = req.body;
    const userId = req.user.uid;

    if (!sessionId || !title || !messages || !db) {
        return res.status(400).json({ error: 'Missing data or database not connected.' });
    }

    const historyCollection = db.collection('chatHistory');
    const timestamp = new Date();

    try {
        const result = await historyCollection.updateOne(
            { sessionId: sessionId, userId: userId },
            { 
                $set: { 
                    title: title, 
                    messages: messages, 
                    lastUpdated: timestamp,
                    firstPrompt: messages.find(msg => msg.sender === 'user')?.content
                },
                $setOnInsert: { userId: userId, sessionId: sessionId, createdAt: timestamp }
            },
            { upsert: true }
        );

        res.json({ success: true, message: 'History saved successfully.', result });

    } catch (error) {
        console.error('MongoDB Save Error:', error);
        res.status(500).json({ error: 'Failed to save history to database.' });
    }
});

// server.js (Add this new route)

// --- Route 5: Clear All History (Protected) ---

app.delete('/api/history/clear', verifyToken, async (req, res) => {
    const userId = req.user.uid;

    if (!db) {
        return res.status(500).json({ error: 'Database not connected.' });
    }

    const historyCollection = db.collection('chatHistory');

    try {
        const deleteResult = await historyCollection.deleteMany({ userId: userId });

        if (deleteResult.deletedCount > 0) {
            console.log(`Cleared ${deleteResult.deletedCount} history records for user ${userId}`);
        } else {
            console.log(`No history found to clear for user ${userId}`);
        }
        
        res.json({ 
            success: true, 
            message: 'History cleared successfully.', 
            deletedCount: deleteResult.deletedCount 
        });

    } catch (error) {
        console.error('MongoDB Clear History Error:', error);
        res.status(500).json({ error: 'Failed to clear history from database.' });
    }
});
// --- Route 4: History Retrieval (Protected) ---

app.get('/api/history/load', verifyToken, async (req, res) => {
    const userId = req.user.uid;
    
    if (!db) {
        return res.status(500).json({ error: 'Database not connected.' });
    }

    const historyCollection = db.collection('chatHistory');

    try {
        const history = await historyCollection.find({ userId: userId })
            .project({ _id: 0, sessionId: 1, title: 1, lastUpdated: 1, messages: 1 })
            .sort({ lastUpdated: -1 })
            .toArray();

        res.json({ success: true, history: history.map(h => ({
            id: h.sessionId,
            title: h.title,
            timestamp: h.lastUpdated,
            messages: h.messages
        })) });

    } catch (error) {
        console.error('MongoDB Load Error:', error);
        res.status(500).json({ error: 'Failed to load history from database.' });
    }
});


// --- 4. Start Server ---

// Start server only after a successful MongoDB connection
connectToMongo().then(() => {
    app.listen(port, () => {
        console.log(`🚀 Backend server running at http://localhost:${port}`);
    });
});