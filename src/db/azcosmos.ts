import {emptyResponse, IHistory, IMediaResponse} from "../types";
import {IDatabase, IMediaTable} from "./IDatabase";
import {CosmosClient, Database} from "@azure/cosmos";
import {create, IContainerConfig} from "../db/azureContext"

const MEDIA_CONTAINER = "Media"

class azcosmos implements IDatabase{

    database:Database;
    client:CosmosClient;

    constructor(){

        this.client = new CosmosClient({ endpoint:process.env.AZ_ENDPOINT ?? "", key: process.env.AZ_KEY ?? "" });
        this.database = this.client.database(process.env.AZ_DB_ID ?? "");

    }

    async create(){

        const containerConfigs:IContainerConfig[] = [
            {
                ContainerId: MEDIA_CONTAINER,
                PartitionKey: { kind: "Hash", paths: ["/username"] }
            }
        ]

        await create(this.client, process.env.AZ_DB_ID ?? "", containerConfigs);

    }

    async restore(account:string){

        try{
            const history = await this.queryHistory(account);

            if(!history.username){
                return emptyResponse;
            }

            const media :IMediaTable = await this.queryMedia(account, history.username);

            return {
                username:media.username,
                media:media.media,
                user:media.user,
                rowIndex: media.rowIndex,
                next: media.next,
                history: history.history,
                isAuthenticated:false,
            }

        }catch(ex){
            console.log("restore failed");
            return emptyResponse;
        }
    }

    async queryHistory(account:string){

        try{

            const querySpec = {
                query: `SELECT h.history FROM ${MEDIA_CONTAINER} h WHERE h.id = @account and h.username = @account`,
                parameters: [
                  {
                    name: "@account",
                    value: account
                  }
                ]
            };

            const { resources: items } = await this.database.container(MEDIA_CONTAINER).items.query(querySpec).fetchAll();

            if(items.length <= 0){
                throw new Error("No history found")
            }

            const row = items[0];

            return {
                username: row.username,
                history: row.history
            }

        }catch(ex){
            console.log("query failed");
            console.log(ex);
            return {
                username: "",
                history: {}
            }

        }

    }

    async queryMedia(account:string, username:string){

        try{

            const querySpec = {
                query: `SELECT * FROM ${MEDIA_CONTAINER} m WHERE m.id = @account and m.username = @username`,
                parameters: [
                  {
                    name: "@account",
                    value: account
                  },
                  {
                    name: "@username",
                    value: username
                  }
                ]
            };

            const { resources: items } = await this.database.container(MEDIA_CONTAINER).items.query(querySpec).fetchAll();

            if(items.length <= 0){
                throw new Error("No media found")
            }

            const row = items[0];

            return {
                username: row.username,
                media:row.media,
                user:row.userinfo,
                rowIndex:row.rowIndex,
                next:row.next
            }

        }catch(ex){
            console.log("query failed");
            console.log(ex);
            return emptyResponse;

        }

    }

    async query(queryString:string, params:any[]){

    }

    async saveHistory(account:string, username:string, history:IHistory){

        try{

            await this.database.container(MEDIA_CONTAINER).items.upsert({
                id: account,
                username: account,
                history: {
                    username,
                    history
                }
            });

            return true;

        }catch(ex){
            console.log("insert history failed");
            console.log(ex);
            return false;

        }

    }

    async saveMedia(account:string, result:IMediaResponse){

        try{

            await this.database.container(MEDIA_CONTAINER).items.upsert({
                id: account,
                username: result.username,
                media: result.media,
                userinfo: result.user,
                rowIndex: 0,
                next: result.next,
                history: "",
            });

            return true;

        }catch(ex){
            console.log("insert media failed");
            console.log(ex);
            return false;

        }

    }

    async saveRowIndex(account:string,username:string, rowIndex:number){

        try{

            await this.database.container(MEDIA_CONTAINER).items.upsert({
                id: account,
                username: username,
                rowIndex: rowIndex,
            });

            return true;

        }catch(ex){
            console.log("update rowindex failed");
            console.log(ex);
            return false;

        }

    }

    async appendMedia(account:string, result:IMediaResponse){

        try{

            const data = await this.queryMedia(account, result.username)

            const arr = data.media

            const newArr = arr.concat(result.media);

            await this.database.container(MEDIA_CONTAINER).items.upsert({
                id: account,
                username: result.username,
                media: newArr,
            });

            return true;

        }catch(ex){
            console.log("append failed");
            console.log(ex);
            return false;

        }
    }

    async deleteMedia(account:string, username: string){

        try{

            await this.database.container(MEDIA_CONTAINER).item(account, username).delete();

        }catch(ex){
            console.log("delete failed");
            console.log(ex);
            throw new Error("delete failed")

        }
    }

}

export default azcosmos;