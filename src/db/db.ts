//import sqlite from "./sqlite"
//import azcosmos from "./azcosmos";
//import { IDatabase } from "./IDatabase";

//const db :IDatabase = process.env.NODE_ENV !== 'production' ? new sqlite() : new azcosmos();

import { IDatabaseProvider } from "./IDatabaseProvider";

async function importModule(moduleName: string):Promise<IDatabaseProvider>{
    return await import(moduleName);
}

let moduleName:string = process.env.NODE_ENV === 'production' ? "./azure" : "./sqlite";
let dbprovider = await importModule(moduleName);


export default dbprovider;
