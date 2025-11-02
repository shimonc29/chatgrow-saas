const mongoose = require('mongoose');
const { logInfo, logError, logWarning } = require('../utils/logger');

let isMongoConnected = false;

const connectMongoDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatgrow';
        
        if (!mongoURI || mongoURI === 'mongodb://localhost:27017/chatgrow') {
            logWarning('MongoDB URI not configured, using local MongoDB (may not be available)');
        }

        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(mongoURI, options);

        isMongoConnected = true;

        mongoose.connection.on('connected', () => {
            logInfo('MongoDB connected successfully', {
                host: mongoose.connection.host,
                db: mongoose.connection.name
            });
        });

        mongoose.connection.on('error', (err) => {
            logError('MongoDB connection error', err);
            isMongoConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            logWarning('MongoDB disconnected');
            isMongoConnected = false;
        });

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            logInfo('MongoDB connection closed due to application termination');
            process.exit(0);
        });

        logInfo('MongoDB initialized successfully', {
            uri: mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')
        });

        return mongoose.connection;
    } catch (error) {
        logError('Failed to connect to MongoDB', error);
        logWarning('Running without MongoDB - some features will be unavailable');
        isMongoConnected = false;
        return null;
    }
};

const isMongoDBConnected = () => {
    return isMongoConnected && mongoose.connection.readyState === 1;
};

const getMongoConnection = () => {
    return mongoose.connection;
};

module.exports = {
    connectMongoDB,
    isMongoDBConnected,
    getMongoConnection
};
