import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import api from "./api/api";
import socketRoutes from "./api/socket";
import JSONbig from "json-bigint";

const app = express();
const server = http.createServer(app);
const JSONbigInstance = JSONbig({ storeAsString: true });

app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.is("application/json")) {
        let data = "";
        req.on("data", chunk => (data += chunk));

        req.on("end", () => {
            try {
                req.body = JSONbigInstance.parse(data || "{}");
                next();
            } catch (error) {
                return res.status(400).json({ error: "Invalid JSON" });
            }
        });

        req.on("error", () => res.status(400).json({ error: "Error parsing JSON" }));
    } else {
        next();
    }
});


app.use(cors());
app.use(express.static(path.resolve(__dirname, "api")));
app.use(express.urlencoded({ extended: true }));

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 10 * 1024 * 1024 
});

socketRoutes(io);
app.use("/api", api);

app.get("/chat", (req: Request, res: Response) => {
    return res.sendFile(path.join(__dirname, "chat", "chat.html"));
});

app.get("/chat2", (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, "chat/chatSimulator.html"))
});

app.get("/", (req: Request, res: Response) => {
    return res.send("<h1>Server is running 🚀</h1>");
});

server.listen(8000, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:8000`);
});