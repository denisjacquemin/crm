const mongoose = require('mongoose');

class MongooseHelper {
    constructor() {
        if (!MongooseHelper.instance) {
            MongooseHelper.instance = this;
        }

        return MongooseHelper.instance;
    }

    async connect() {
        const MONGO_URI = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOSTS}/${process.env.MONGO_DATABASE}`;
        
        const options = {
            ssl: false,
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            // serverSelectionTimeoutMS: 40000, // 5 seconds
        };

        let retries = 3;

        while (retries) {
            try {
                await mongoose.connect(MONGO_URI, options);
                console.log('😀 MongoDB connected successfully');
                break;
            } catch (error) {
                console.error(`😭 MongoDB connection error: ${error}`);

                retries--;

                if (retries === 0) {
                    console.error('😳 Max retries reached. Exiting...');
                    process.exit(1);
                }

                console.log(`⏳ Retrying in 5 seconds... (${retries} retries left)`);
                await new Promise((resolve) => setTimeout(resolve, 5000));
            }
        }
    }

    async disconnect() {
        await mongoose.disconnect();
        console.log('👋 MongoDB (mongoose) disconnected');
    }
}

module.exports = new MongooseHelper();
