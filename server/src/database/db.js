const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const DB_PATH = path.resolve(__dirname, '..', '..', process.env.DB_PATH || './gymtracker.db');

let db;
let saveTimer;

/**
 * Wrapper around sql.js to provide a similar API to better-sqlite3.
 * sql.js works in-memory and we persist to disk manually.
 */
class DbWrapper {
    constructor(sqlDb) {
        this.sqlDb = sqlDb;
    }

    _scheduleSave() {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            this.saveToDisk();
        }, 500);
    }

    prepare(sql) {
        const self = this;
        return {
            run(...params) {
                self.sqlDb.run(sql, params);
                self._scheduleSave();
                const lastId = self.sqlDb.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0];
                return { lastInsertRowid: lastId, changes: self.sqlDb.getRowsModified() };
            },
            get(...params) {
                const stmt = self.sqlDb.prepare(sql);
                stmt.bind(params);
                let result = null;
                if (stmt.step()) {
                    const cols = stmt.getColumnNames();
                    const vals = stmt.get();
                    result = {};
                    cols.forEach((col, i) => { result[col] = vals[i]; });
                }
                stmt.free();
                return result;
            },
            all(...params) {
                const stmt = self.sqlDb.prepare(sql);
                stmt.bind(params);
                const results = [];
                const cols = stmt.getColumnNames();
                while (stmt.step()) {
                    const vals = stmt.get();
                    const row = {};
                    cols.forEach((col, i) => { row[col] = vals[i]; });
                    results.push(row);
                }
                stmt.free();
                return results;
            }
        };
    }

    exec(sql) {
        this.sqlDb.exec(sql);
        this.saveToDisk();
    }

    pragma(pragma) {
        try {
            this.sqlDb.exec(`PRAGMA ${pragma}`);
        } catch(e) {
            // Some pragmas not supported in sql.js, ignore
        }
    }

    transaction(fn) {
        return (...args) => {
            this.sqlDb.exec('BEGIN TRANSACTION');
            try {
                fn(...args);
                this.sqlDb.exec('COMMIT');
                this.saveToDisk();
            } catch (e) {
                this.sqlDb.exec('ROLLBACK');
                throw e;
            }
        };
    }

    saveToDisk() {
        try {
            const data = this.sqlDb.export();
            const buffer = Buffer.from(data);
            fs.writeFileSync(DB_PATH, buffer);
        } catch (e) {
            console.error('Error saving database:', e.message);
        }
    }

    close() {
        if (saveTimer) clearTimeout(saveTimer);
        this.saveToDisk();
        this.sqlDb.close();
    }
}

async function initDb() {
    const SQL = await initSqlJs();
    
    let sqlDb;
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        sqlDb = new SQL.Database(fileBuffer);
        console.log('📂 Loaded existing database from', DB_PATH);
    } else {
        sqlDb = new SQL.Database();
        console.log('🆕 Created new database');
    }

    db = new DbWrapper(sqlDb);
    db.pragma('foreign_keys = ON');

    // Initialize schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
    console.log('✅ Database schema initialized');

    return db;
}

function getDb() {
    if (!db) {
        throw new Error('Database not initialized. Call initDb() first.');
    }
    return db;
}

function closeDb() {
    if (db) {
        db.close();
        db = null;
        console.log('🔒 Database connection closed');
    }
}

module.exports = { initDb, getDb, closeDb };
