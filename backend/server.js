require("dotenv").config();

const http = require("http");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./src/config/db");
const therapistRoutes = require("./src/routes/therapistRoutes");
const schedulingRoutes = require("./src/routes/schedulingRoutes");
const clientRoutes = require("./src/routes/clientRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const noteRoutes = require("./src/routes/noteRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");

const errorHandler = require("./src/middleware/errorHandler");
const { seedDefaultTiersIfEmpty } = require("./src/services/entitlementService");
const initChatSocket = require("./src/sockets/chatSocket");

const app = express();
const server = http.createServer(app);

// Socket.io initialization with CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

initChatSocket(io);

app.use(cors());
app.use(express.json());

// Serve static invoice PDFs
app.use("/invoices", express.static(path.join(__dirname, "public/invoices")));

// Connect DB and seed tier configs
connectDB().then(() => {
  seedDefaultTiersIfEmpty();
});

app.get("/", (req, res) => {
  res.json({
    name: "UNFAZED Platform API",
    status: "online",
    version: "1.0.0",
  });
});

// Mount modular routes
app.use("/api/therapists", therapistRoutes);
app.use("/api/scheduling", schedulingRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/analytics", analyticsRoutes);

// Central error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`UNFAZED Server running on port ${PORT}`);
});