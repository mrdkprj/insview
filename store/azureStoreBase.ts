import {CosmosClient,Database} from "@azure/cosmos";
import {create, IContainerConfig} from "../db/azureContext"
import session from "express-session"

const CONTAINER_NAME = "Sessions";

export default class AzureStoreBase{

    ttl:number;
    isReady:boolean;
    database:Database;
    client:CosmosClient;

    constructor(options:any){

        this.client = new CosmosClient({ endpoint:process.env.AZ_ENDPOINT ?? "", key: process.env.AZ_KEY ?? "" });
        this.database = this.client.database(process.env.AZ_DB_ID ?? "");
        this.ttl = options.ttl;

        this.isReady = false;

    }

    async init(){

        if(this.isReady) return;

        const containerConfig:IContainerConfig = {
            ContainerId: CONTAINER_NAME,
            PartitionKey: { kind: "Hash", paths: ["/id"] }
        }

        await create(this.client, process.env.AZ_DB_ID ?? "", [containerConfig]);

        this.isReady = true;
    }

    async get (sid: string): Promise<session.SessionData | null> {

        console.log(`Getting session: ${sid}`)

        await this.init()
        const querySpec = `SELECT * FROM ${CONTAINER_NAME} s WHERE s.id = ${sid}`
        const { resources: items } = await this.database.container(CONTAINER_NAME).items.query(querySpec).fetchAll();

        if (!items || items.length > 1) {
            return null
        }

        console.log(`Session found: ${sid}`)

        return JSON.parse(items[0]);

    }

    async set (sid: string, session: session.SessionData): Promise<void> {

        await this.init()

        const msTtl = new Date().getTime() + this.ttl

        console.log(`Setting session: ${sid}`)

        await this.database.container(CONTAINER_NAME).items.upsert({
            id: sid,
            data: session,
            ttl:msTtl,
        });

    }

    async destroy (sid: string): Promise<void> {
        await this.init()

        console.log(`Destroying session: ${sid}`)

        const { resource: result } = await this.database.container(CONTAINER_NAME).item(sid, sid).delete();

        console.log(result)

    }
}