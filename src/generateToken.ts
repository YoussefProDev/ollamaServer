import sqlite3 from "sqlite3";
import { v4 as uuidV4 } from "uuid";
import readline from "readline";

// Funzione per generare il token
function generateToken(): void {
  const token = uuidV4();

  // Creazione di un'interfaccia per ottenere input dall'utente
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    "Enter a description for this token (e.g., user or service name): ",
    (description) => {
      const db = new sqlite3.Database("tokens.db");

      // Creazione della tabella se non esiste
      db.run(`
            CREATE TABLE IF NOT EXISTS tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT NOT NULL UNIQUE,
                description TEXT
            )
        `);

      // Inserimento del token e della descrizione nel database
      db.run(
        "INSERT INTO tokens (token, description) VALUES (?, ?)",
        [token, description],
        function (err) {
          if (err) {
            console.error("Error inserting token:", err.message);
          } else {
            console.log(`Generated API Token: ${token}`);
          }

          // Chiusura della connessione al database
          db.close();
        }
      );

      rl.close();
    }
  );
}

// Esecuzione dello script
generateToken();
