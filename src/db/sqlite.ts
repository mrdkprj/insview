import { IDatabase } from "../types/IDatabase";
import { IDatabaseProvider } from "../types/IDatabaseProvider";
import sqliteStoreFactory from "express-session-sqlite"
import sqlitedb from "./sqlitedb"
import * as sqlite3 from "sqlite3"

class sqlite implements IDatabaseProvider{

    db:IDatabase;

    constructor(){
        this.db = new sqlitedb();
    }

    store(session:any){

        const SqliteStore = sqliteStoreFactory(session);
        return new SqliteStore({
            driver: sqlite3.Database,
            path: "../media.db",
            ttl: 60000 * 60 * 24 * 365,
        })

    }
}

module.exports = { sqlite: new sqlite() }