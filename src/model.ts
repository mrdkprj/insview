import sqlite from "./db/sqlite"
import azure from "./db/azure";
import { IDatabaseProvider } from "./db/IDatabaseProvider";

const dbprovider :IDatabaseProvider = process.env.NODE_ENV !== 'production' ? new sqlite() : new azure();

export default dbprovider;
