import azure from "./azure";

const dbprovider :IDatabaseProvider = process.env.NODE_ENV !== 'production' ? require("./sqlite").sqlite : new azure();

export default dbprovider;
