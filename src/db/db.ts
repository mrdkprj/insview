import sqlite from "./sqlite"
import azcosmos from "./azcosmos";
import { IDatabase } from "./IDatabase";

const db :IDatabase = process.env.NODE_ENV !== 'production' ? new sqlite() : new azcosmos();

export default db;
