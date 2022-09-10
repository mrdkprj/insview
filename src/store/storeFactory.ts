import sqliteStoreFactory from "express-session-sqlite"
import azureStoreFactory from "./azureStore"
import * as sqlite3 from "sqlite3"
import {Store} from "express-session"

export const StoreType = {
    sqlite: 0,
    azure:1,
}

export function sessionStoreFactory(session:any, storeType:number){

        let store:Store = session.Store;

        if(storeType === StoreType.sqlite){
            const SqliteStore = sqliteStoreFactory(session);
            store = new SqliteStore({
                driver: sqlite3.Database,
                path: "../media.db",
                ttl: 60000 * 60 * 24,
            })
        }

        if(storeType === StoreType.azure){
            const AzureStore = azureStoreFactory(session.Store);
            store = new AzureStore({ttl: 60 * 60 * 24})
        }

        return store;
}