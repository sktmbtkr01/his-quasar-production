const mongoose = require('mongoose');

// The URI you are using in Hugging Face
const uri = "mongodb+srv://shravanibaraskar_db_user:R12COy0mdrk1I1l4@cluster2.fs2fnzl.mongodb.net/hospital_his?retryWrites=true&w=majority&appName=Cluster2";

async function checkData() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(uri);
        console.log("Connected! Checking collections...");

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log(`Found ${collections.length} collections.`);

        for (let col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} documents`);
        }

        if (collections.length === 0) {
            console.log("\n⚠️  WARNING: Database is empty! You need to run the seed script.");
        } else {
            console.log("\n✅  Database has data!");
        }

    } catch (err) {
        console.error("❌ Connection Failed:", err.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkData();
