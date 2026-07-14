import express from "express";
import router from "./routes/index.js";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";
import helmet from "helmet";
import cors from "cors";
import { apiLimiter } from "./middlewares/rateLimiter.middleware.js";

const app = express();


app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(helmet());
app.use(apiLimiter);

app.use(express.json());
app.use(cookieParser());

app.use(express.urlencoded({
    extended: true
}));

app.use(express.static("public"));
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Enterprise Authentication API is running 🚀",
        version: "1.0.0"
    });
});


app.use("/api/v1", router);

app.use(errorHandler);

export default app;