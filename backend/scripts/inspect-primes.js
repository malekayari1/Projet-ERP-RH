const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');

// I don't have the model for Primes, so I'll access the collection directly
const inspectPrimes = async () => {
    await connectDB();
    console.log("DB Connected");

    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections found:", collections.map(c => c.name));

        const primesCollection = mongoose.connection.db.collection('primes');
        const count = await primesCollection.countDocuments();
        console.log(`Primes count: ${count}`);

        if (count > 0) {
            const sample = await primesCollection.findOne();
            console.log("Sample Prime Document:", sample);
        } else {
            console.log("Primes collection is empty.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

inspectPrimes();
