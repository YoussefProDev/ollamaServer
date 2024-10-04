import express, { Express, NextFunction, Request, Response } from "express";
import axios, { AxiosRequestConfig } from "axios";
import bodyParser from "body-parser";
import sqlite3 from "sqlite3";
import dotenv from "dotenv";
import cors from 'cors';
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Initialize SQLite database
const db = new sqlite3.Database("tokens.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    process.exit(1);
  }
  console.log("Connected to the SQLite database.");
});

// Middleware to log requests
const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
};

// Authentication Middleware
const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Authorization header missing or malformed" });
  }

  const token = authHeader.split(" ")[1]; // Extract the Bearer token

  // Check the token against the SQLite database
  return db.get(
    "SELECT token FROM tokens WHERE token = ?",
    [token],
    (err, row) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (!row) {
        return res.status(403).json({ error: "Invalid API token" });
      }

      // Token is valid, proceed to the next middleware or route handler
      return next();
    }
  );
};

app.use(cors());  // Permette richieste da domini diversi

// Use body-parsing middleware
app.use(bodyParser.json());
app.use(loggingMiddleware);

// Apply authentication middleware only to protected routes
app.use(authMiddleware);

// Function to forward requests
const forwardRequest = (req: Request, res: Response) => {
  const url = `http://localhost:11434${req.url}`;
  // const url = `https://google.com${req.url}`;
 const config: AxiosRequestConfig = {
  url,
  method: req.method.toLowerCase(),
  headers: { ...req.headers, host: undefined },
  data: JSON.stringify(req.body),
  timeout: 10000, // Timeout di 10 secondi
};


  console.log(`Forwarding request to ${url}: ${JSON.stringify(req.body)}`);

 axios(config)
  .then((response) => {
    console.log("Response from Ollama:", response.data);
    res.status(response.status).send(response.data);
  })
  .catch((error) => {
    console.error("Error forwarding request to Ollama:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Internal server error",
      message: error.message,
      details: error.response?.data || "No further details",
    });
  });

};

// Apply the forwardRequest middleware to all routes
app.use(forwardRequest);

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
