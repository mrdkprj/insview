import sqliteStoreFactory from "express-session-sqlite"
import azureStoreFactory from "./azureStore"
import * as sqlite3 from "sqlite3"
import {Store} from "express-session"

export const StoreType = {
    sqlite: 0,
    azure:1,
}

export async function sessionStoreFactory(session:any, storeType:number){


        if(process.env.NODE_ENV === "production"){
            const AzureStore = azureStoreFactory(session.Store);
            return new AzureStore({ttl: 60 * 60 * 24})
        }else{
            const SqliteStore = sqliteStoreFactory(session);
            return new SqliteStore({
                driver: sqlite3.Database,
                path: "../media.db",
                ttl: 60000 * 60 * 24,
            })
        }

}