import {CosmosClient,Database, PartitionKeyKind} from "@azure/cosmos";
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
            PartitionKey: { kind: PartitionKeyKind.Hash, paths: ["/id"] }
        }

        await create(this.client, process.env.AZ_DB_ID ?? "", [containerConfig]);

        this.isReady = true;
    }

    async get (sid: string): Promise<session.SessionData | null> {

        //console.log(`Getting session: ${sid}`)

        await this.init()

        const querySpec = {
            query:  `SELECT * FROM ${CONTAINER_NAME} s WHERE s.id = @sid`,
            parameters: [
              {
                name: "@sid",
                value: sid
              }
            ]
        };
        const { resources: items } = await this.database.container(CONTAINER_NAME).items.query(querySpec).fetchAll();

        if (items.length <= 0) {
            //console.log(`Session NOT found`)
            return null
        }

        //console.log(`Session found: ${sid}`)

        return items[0].data;

    }

    async set (sid: string, session: session.SessionData): Promise<void> {

        await this.init()

        //console.log(`Setting session: ${sid}`)

        const ttl = session.cookie.expires ? Math.round((session.cookie.expires.getTime() - new Date().getTime()) / 1000) : this.ttl

        await this.database.container(CONTAINER_NAME).items.upsert({
            id: sid,
            data: session,
            ttl,
        });

    }

    async destroy (sid: string): Promise<void> {

        await this.init()

        //console.log(`Destroying session: ${sid}`)

        await this.database.container(CONTAINER_NAME).item(sid, sid).delete();

        //console.log(result)

    }

    async touch (sid: string, session: session.SessionData): Promise<void> {
        //console.log(`Refreshing session: ${sid}`)

        await this.init()
        await this.set(sid, session)

        //console.log(`Refresh session complete: ${sid}`)
    }
}