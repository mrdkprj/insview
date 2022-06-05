import { Pool } from "pg";
import {emptyResponse, IHistory, IMediaResponse} from "../src/response";
import {IDatabase, IMediaTable} from "./IDatabase";

class postgre implements IDatabase{

    pool: Pool;

    constructor(){
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
              rejectUnauthorized: false
            }
        });
    }

    async create(){

        const client = await this.pool.connect();

        try{
            let command = "CREATE TABLE IF NOT EXISTS media ( " +
            "username text, " +
            "account text," +
            "media jsonb, " +
            "userinfo jsonb, " +
            "row_index integer, " +
            "next text, " +
            "PRIMARY KEY (username, account)" +
            ")";

            await client.query(command);

            command = "CREATE TABLE IF NOT EXISTS history ( " +
            "account text primary key," +
            "username text, " +
            "history jsonb" +
            ")";

            await client.query(command);

        }catch(ex){
            console.log("create table failed");
            console.log(ex);
        }finally{
            client.release();
        }

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

        const client = await this.pool.connect();

        try{

            const command = "select username, history from history where account = $1";

            const result = await client.query(command, [account]);

            const row = result.rows[0];

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

        }finally{
            client.release();
        }

    }

    async queryMedia(account:string, username:string){

        const client = await this.pool.connect();

        try{

            const command = "SELECT username, media, userinfo, row_index, next FROM media where username = $1 and account = $2";

            const result = await client.query(command, [username, account]);

            const row = result.rows[0];

            return {
                username: row.username,
                media:row.media,
                user:row.userinfo,
                rowIndex:row.row_index,
                next:row.next
            }

        }catch(ex){
            console.log("query failed");
            console.log(ex);
            return emptyResponse;

        }finally{
            client.release();
        }

    }

    async query(queryString:string, params:any[]){

        const client = await this.pool.connect();

        try{

            const result = await client.query(queryString, params);

            return result.rows[0];

        }catch(ex){
            console.log("query failed");
            console.log(ex);
            return null;

        }finally{
            client.release();
        }

    }

    async saveHistory(account:string, username:string, history:IHistory){

        const client = await this.pool.connect();

        try{

            const command = "insert into history(account, username, history) values($1, $2, $3) " +
            "ON CONFLICT (account) DO UPDATE SET username = $2, history = $3";

            await client.query("BEGIN")

            await client.query(command, [account, username, history]);

            await client.query("COMMIT")

            return true;

        }catch(ex){
            console.log("insert history failed");
            console.log(ex);
            return false;

        }finally{
            client.release();
        }

    }

    async saveMedia(account:string, result:IMediaResponse){

        const client = await this.pool.connect();

        try{
            const command = "insert into media(username, account, media, userinfo, row_index, next) values($1, $2, $3, $4, $5, $6) " +
            "ON CONFLICT (username, account) DO UPDATE SET media = $3, userinfo = $4, row_index = $5, next = $6";

            await client.query("BEGIN")

            await client.query(command, [result.username, account, JSON.stringify(result.media), result.user, 0, result.next]);

            await client.query("COMMIT")

            return true;

        }catch(ex){
            console.log("insert media failed");
            console.log(ex);
            return false;

        }finally{
            client.release();
        }

    }

    async saveRowIndex(account:string,username:string, rowIndex:number){

        const client = await this.pool.connect();

        try{
            const command = "update media set row_index = $1 where username = $2 and account = $3";

            await client.query("BEGIN")

            await client.query(command, [rowIndex, username, account]);

            await client.query("COMMIT")

            return true;

        }catch(ex){
            console.log("update rowindex failed");
            console.log(ex);
            return false;

        }finally{
            client.release();
        }

    }

    async appendMedia(account:string, result:IMediaResponse){

        const client = await this.pool.connect();

        try{

            const queryString = "select media from media where username = $1 and account = $2";

            const data = await this.query(queryString, [result.username, account]);

            const arr = data.media

            const newArr = arr.concat(result.media);

            const command = "update media set media = $1, next = $2 where username = $3 and account = $4";

            await client.query("BEGIN")

            await client.query(command, [JSON.stringify(newArr), result.next, result.username, account]);

            await client.query("COMMIT")

            return true;

        }catch(ex){
            console.log("append failed");
            console.log(ex);
            return false;

        }finally{
            client.release();
        }
    }

    async deleteMedia(account:string, username: string){

        const client = await this.pool.connect();

        try{

            const command = "delete from media where username = $1 and account = $2"

            await client.query("BEGIN")

            await client.query(command, [username, account]);

            await client.query("COMMIT")

        }catch(ex){
            console.log("delete failed");
            console.log(ex);
            throw new Error("delete failed")

        }finally{
            client.release();
        }
    }

}

export default postgre;