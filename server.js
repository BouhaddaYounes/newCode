const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

dotenv.config();
const dbService = require('./dbService');

// Configure CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Debug middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    console.log('Authenticating token...');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        console.log('No token found');
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Token verification failed:', err);
            return res.status(403).json({ success: false, message: 'Invalid token' });
        }
        console.log('Token verified, user:', user);
        req.user = user;
        next();
    });
};

// API Routes
const apiRouter = express.Router();

// Dashboard data endpoint
apiRouter.get('/dashboard', authenticateToken, async (req, res) => {
    console.log('Dashboard API route hit');
    try {
        const db = dbService.getDbServiceInstance();
        const dashboardData = await db.getDashboardData(req.user.id);
        console.log('Dashboard data:', dashboardData);
        res.json({ success: true, data: dashboardData });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ success: false, message: 'Error fetching dashboard data', error: error.message });
    }
});

// Login endpoint
apiRouter.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const db = dbService.getDbServiceInstance();
    
    try {
        const user = await db.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET);
        res.json({ success: true, token, username: user.username });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Other API routes
apiRouter.post('/insert', authenticateToken, async (request, response) => {
    const { name, priority } = request.body;
    const db = dbService.getDbServiceInstance();
    
    try {
        const data = await db.insertNewName(name, priority, request.user.id);
        response.json({ success: true, data });
    } catch (err) {
        console.error('Insert error:', err);
        response.status(500).json({ success: false, message: 'Error inserting data', error: err.message });
    }
});

apiRouter.get('/getAll', authenticateToken, async (request, response) => {
    const db = dbService.getDbServiceInstance();
    
    try {
        const data = await db.getAllData(request.user.id);
        response.json({ success: true, data });
    } catch (err) {
        console.error('Get all data error:', err);
        response.status(500).json({ success: false, message: 'Error retrieving data', error: err.message });
    }
});

apiRouter.patch('/update', authenticateToken, async (request, response) => {
    const { id, name, priority } = request.body;
    const db = dbService.getDbServiceInstance();
    
    try {
        const data = await db.updateNameById(id, name, priority, request.user.id);
        response.json({ success: true, data });
    } catch (err) {
        console.error('Update error:', err);
        response.status(500).json({ success: false, message: 'Error updating data', error: err.message });
    }
});

apiRouter.delete('/delete/:id', authenticateToken, async (request, response) => {
    const { id } = request.params;
    const db = dbService.getDbServiceInstance();
    
    try {
        const data = await db.deleteRowById(id, request.user.id);
        response.json({ success: true, data });
    } catch (err) {
        console.error('Delete error:', err);
        response.status(500).json({ success: false, message: 'Error deleting data', error: err.message });
    }
});

apiRouter.get('/search/:name', authenticateToken, async (request, response) => {
    const { name } = request.params;
    const db = dbService.getDbServiceInstance();
    
    try {
        const data = await db.searchByName(name, request.user.id);
        response.json({ success: true, data });
    } catch (err) {
        console.error('Search error:', err);
        response.status(500).json({ success: false, message: 'Error searching data', error: err.message });
    }
});

// Mount API routes under /api prefix
app.use('/api', apiRouter);

// Page Routes - Always serve index.html and let client-side routing handle it
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(5501, () => {
    console.log('Server is running on port 5501');
    console.log('API endpoints are available under /api');
});