import { IDatabase } from "./IDatabase";
import {Store} from "express-session"

export interface IDatabaseProvider{
    db:IDatabase;
    store: (session:any) => Store;
}