import azure from "./azure";
import { IDatabaseProvider } from "./IDatabaseProvider";

const dbprovider :IDatabaseProvider = process.env.NODE_ENV !== 'production' ? require("./sqlite").sqlite : new azure();

export default dbprovider;
