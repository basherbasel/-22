import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerAI } from "@google/genai";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

// --- Database Setup ---
let db: any;
async function initDb() {
  db = await open({
    filename: "./repair_box.db",
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS firmware (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT,
      model TEXT,
      version TEXT,
      path TEXT,
      checksum TEXT,
      date_added DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS repair_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT,
      operation TEXT,
      status TEXT,
      log_output TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// --- Gemini Setup ---
const genAI = new GoogleGenerAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function startServer() {
  await initDb();
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // --- API Routes ---

  // Hardware Detection (Mocked for Workstation Environment)
  app.get("/api/hardware/status", (req, res) => {
    res.json({
      connected: true,
      device: {
        brand: "Samsung",
        model: "Galaxy S23 Ultra",
        mode: "Download Mode (Odin)",
        port: "COM3",
        sn: "R5CR123456X"
      },
      ports: ["COM1", "COM3 (Active)", "USB-C Path 1"]
    });
  });

  // ApexAgent Diagnostic Analysis
  app.post("/api/diagnostics/analyze", async (req, res) => {
    const { logs, deviceInfo } = req.body;
    
    try {
      const prompt = `Act as ApexAgent, an elite hardware repair specialist. Analyze these device logs and hardware info:
      Device: ${JSON.stringify(deviceInfo)}
      Logs: ${logs}
      
      Identify the root cause (bootloop, partition corruption, etc.), recommend the exact flashing protocol (EDL, Odin, DFU), and list the safety backup steps required (NVRAM, EFS).`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json({ analysis: response.text() });
    } catch (error) {
      res.status(500).json({ error: "ApexAgent Analysis Failed" });
    }
  });

  // Safety Engine: Backup & Flash
  app.post("/api/repair/execute", async (req, res) => {
    const { operation, deviceInfo } = req.body;
    
    // Safety Logic Simulation
    const logs = [
      "[SAFETY] Initializing Safety Engine...",
      `[BACKUP] Backing up NVRAM partition for ${deviceInfo.model}... Done.`,
      `[BACKUP] Backing up EFS/IMEI partition... Done.`,
      `[VERIFY] Partition table match confirmed.`,
      `[EXECUTE] Starting ${operation}...`,
      `[SUCCESS] ${operation} completed successfully.`
    ];

    await db.run(
      "INSERT INTO repair_logs (device_id, operation, status, log_output) VALUES (?, ?, ?, ?)",
      [deviceInfo.sn, operation, "SUCCESS", logs.join("\n")]
    );

    res.json({ success: true, logs });
  });

  // Firmware Repository
  app.get("/api/firmware", async (req, res) => {
    const files = await db.all("SELECT * FROM firmware ORDER BY date_added DESC");
    res.json(files);
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Apex Local Repair Box running on http://localhost:${PORT}`);
  });
}

startServer();
