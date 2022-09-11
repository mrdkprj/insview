import sqlite3 from "sqlite3";
import {emptyResponse, IHistory, IMediaResponse} from "../types";
import {IDatabase, IMediaTable} from "./IDatabase";

class sqlitedb implements IDatabase{

    client: sqlite3.Database;

    constructor(){

        this.client = new sqlite3.Database("./media.db", (err) => {
            if (err) {
                console.error("database error: " + err.message);
            }
        });
    }

    async create(){

        const createMediaTable = () => {
            return new Promise((resolve, reject) => {
                this.client.serialize(() => {
                    //this.client.run("drop table Sessions", (e) => {console.log("e")});
                    //this.client.run("drop table media");
                    this.client.run("create table if not exists media(" +
                            "username text," +
                            "account text," +
                            "media text," +
                            "user text," +
                            "row_index INTEGER," +
                            "next text," +
                            "PRIMARY KEY (username, account)" +
                            ")"
                        , (err) => {
                            if (err) {
                                console.error("create media table error: " + err.message);
                                reject(err);
                            } else{
                                resolve(null);
                            }
                        });
                });
            });
        }

        const createHistoryTable = () => {
            return new Promise((resolve, reject) => {
                this.client.serialize(() => {
                    //this.client.run("drop table history");
                    this.client.run("create table if not exists history(account text primary key, username text, history text)", (err:any) => {
                        if (err) {
                            console.error("create history table error: " + err.message);
                            reject(err);
                        } else{
                            resolve(null);
                        }
                    });
                })
            });
        }

        try{
            await createMediaTable();
            await createHistoryTable();
        }catch(ex){
            console.log("db create error");
            console.log(ex);
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
                isAuthenticated:false
            }

        }catch(ex){
            console.log("restore failed");
            return emptyResponse;
        }
    }

    async queryHistory(account:string){

        const stm = "select username, history from history where account = ?";

        try{
            const row :any = await this.query(stm, [account]);
            return {
                username: row.username,
                history: JSON.parse(row.history)
            }

        }catch(ex){
            console.log("history query error")
            console.log(ex);
            return {
                username: "",
                history: {}
            }
        }

    }

    async queryMedia(account:string, username:string) {

        const stm = "SELECT username, media, user, row_index, next FROM media where username = ? and account = ?";

        try{
            const row :any = await this.query(stm, [username, account]);
            return {
                username:row.username,
                media:JSON.parse(row.media),
                user:JSON.parse(row.user),
                rowIndex: row.row_index,
                next: row.next
            }

        }catch(ex){
            console.log("media query error")
            console.log(ex);
            return emptyResponse;
        }

    }

    async query(queryString:string, params:any[]){

        const call = () => {
            return new Promise((resolve, reject) => {
                this.client.get(queryString, params, function(err:Error, row:any) {
                    if (err || !row) {
                        reject(err)
                    }else{
                        resolve(row);
                    }
                });
            })
        }

        return await call();
    }

    async saveHistory(account:string, username:string, history:IHistory){

        const call = () => {

            const stmt = this.client.prepare("replace into history(account, username, history) values(?,?,?)");
            const params = [account, username, JSON.stringify(history)]

            return new Promise((resolve, reject) => {
                stmt.run(params, (err:Error, result:sqlite3.RunResult) => {
                    if (err) {
                        reject(err);
                    }else{
                        resolve(result);
                    }
                });
            })
        }

        try{
            await call();
            return true;
        }catch(ex){
            console.log("db save error")
            console.log(ex);
            return false;
        }
    }

    async saveMedia(account:string, result:IMediaResponse){

        const call = () => {

            const stmt = this.client.prepare("replace into media(username, account, media, user, row_index, next) values(?,?,?,?,?,?)");

            const params = [result.username, account, JSON.stringify(result.media), JSON.stringify(result.user), 0, result.next];

            return new Promise((resolve, reject) => {
                stmt.run(params, (err:Error, result:sqlite3.RunResult) => {
                    if (err) {
                        reject(err);
                    }else{
                        resolve(result);
                    }
                });
            })
        }

        try{
            await call();
            return true;
        }catch(ex){
            console.log("db save error")
            console.log(ex);
            return false;
        }
    }

    async saveRowIndex(account:string, username:string, rowIndex:number){

        const stmt = this.client.prepare("update media set row_index = ? where username = ? and account = ?");
        const params = [rowIndex, username, account]

        const call = () => {
            return new Promise((resolve, reject) => {
                stmt.run(params, (err:Error, result:sqlite3.RunResult) => {
                    if (err) {
                        reject(err);
                    }else{
                        resolve(result);
                    }
                });
            })
        }

        try{
            await call();
            return true;
        }catch(ex){
            console.log("save row index error")
            console.log(ex);
            return false;
        }
    }

    async appendMedia(account:string, result:IMediaResponse){

        const queryString = "select media from media where username = ? and account = ?";

        const data :any = await this.query(queryString, [result.username, account]);

        const arr = JSON.parse(data.media);

        const newArr = arr.concat(result.media);

        const stmt = this.client.prepare("update media set media = json_patch(media.media, JSON(?)), next = ? where username = ? and account = ?");
        const params = [JSON.stringify(newArr), result.next, result.username, account]

        const call = () => {

            return new Promise((resolve, reject) => {
                stmt.run(params, (result:sqlite3.RunResult, err:Error) => {
                    if (err) {
                        reject(err);
                    }else{
                        resolve(result);
                    }
                });
            })
        }

        try{
            await call();
            return true;
        }catch(ex){
            console.log(ex);
            return false;
        }
    }

    async deleteMedia(account:string, username: string){

        const call = () => {
            const stmt = this.client.prepare("delete from media where username = ? and account = ?");
            const params = [username, account]

            return new Promise((resolve, reject) => {
                stmt.run(params, (err:Error, result:sqlite3.RunResult) => {
                    if (err) {
                        reject(err);
                    }else{
                        resolve(result);
                    }
                });
            })
        }

        try{
            await call();
        }catch(ex:any){
            console.log("delete error")
            throw new Error("delete failed")
        }
    };

}

export default sqlitedb;