import "dotenv/config";;
import app from "./app.js";
import connectDB from "./db/index.js";
import dns from "dns";
import { validateEnv } from "./utils/validateEnv.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
validateEnv();




const PORT = process.env.PORT || 8000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB Connection Failed:", error);
    });