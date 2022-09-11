import { IDatabase } from "./IDatabase";
import { IDatabaseProvider } from "./IDatabaseProvider";
import azcosmos from "./azcosmosdb";
import azureStoreFactory from "../store/azureStore";

export class azure implements IDatabaseProvider{

    db:IDatabase;

    constructor(){
        this.db = new azcosmos();
    }

    store(session:any){
        const AzureStore = azureStoreFactory(session.Store);
        return new AzureStore({ttl: 60 * 60 * 24})
    }
}