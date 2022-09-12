import azure from "./db/azure";
import { IDatabaseProvider } from "./db/IDatabaseProvider";

const dbprovider :IDatabaseProvider = process.env.NODE_ENV !== 'production' ? require("./db/sqlite").sqlite : new azure();

export default dbprovider;
