import {IMediaResponse, IHistory, IMedia, IUser} from "../types"

export interface IDatabase{

    create: () => void;
    restore: (account:string) => Promise<IMediaResponse>;
    queryHistory: (account:string) => Promise<IHistoryTable>;
    queryMedia: (account:string, username:string) => Promise<IMediaTable>;
    query: (queryString:string, params:any) => Promise<any>;
    saveHistory: (account:string, username:string, history:IHistory) => Promise<boolean>;
    saveMedia: (account:string, result:IMediaResponse) => Promise<boolean>;
    saveRowIndex: (account:string, username:string, rowIndex:number) => Promise<boolean>;
    appendMedia: (account:string, result:IMediaResponse) => Promise<boolean>;
    deleteMedia: (account:string, username:string) => Promise<void>;
}

export interface IHistoryTable{
    username:string,
    history:IHistory
}

export interface IMediaTable{
    username: string,
    media: IMedia[],
    user: IUser,
    rowIndex: number,
    next: string,
}