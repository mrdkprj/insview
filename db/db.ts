import sqlite from "./sqlite"
import postgre from "./postgre";
import { IDatabase } from "./IDatabase";

const db :IDatabase = process.env.NODE_ENV !== 'production' ? new sqlite() : new postgre();

export default db;
