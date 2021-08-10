// Prepare database
import Database from "better-sqlite3";
import {readFileSync} from "fs";
import path from "path";

const db = new Database('database.db');
const createTable = readFileSync(path.join(__dirname, '..', '..', '..', 'resources', 'database.sql'), 'utf8');
db.exec(createTable);

export default db;
