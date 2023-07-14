import { IncomingHttpHeaders } from "http";
import { Cookie } from "tough-cookie";
import {Store} from "express-session"

declare global {

    interface IResponse<T> {
        status: boolean;
        data: T;
    }

    interface IMedia {
        id: string;
        media_url: string;
        taggedUsers: IUser[];
        thumbnail_url?:string;
        isVideo:boolean;
        permalink:string;
    }

    interface IUser{
        id:string;
        igId:string;
        isPro:boolean;
        username:string;
        name:string;
        profileImage:string;
        biography:string;
        following:boolean;
    }

    interface IHistory{
        [key: string]:IUser;
    }

    interface IFollowing{
        users: IUser[];
        hasNext:boolean;
        next:string;
    }

    interface IMediaResponse {
        username: string;
        media: IMedia[];
        user: IUser;
        rowIndex: number;
        next: string;
        history:IHistory;
        isAuthenticated:boolean;
        account?:string;
    }

    interface ILoginResponse {
        account:string;
        success:boolean;
        challenge:boolean;
        endpoint:string;
    }

    interface IgHeaders {
        appId:string;
        ajax:string;
    }

    interface IAuthResponse {
        status:ILoginResponse;
        media:IMediaResponse;
    }

    interface IgRequest{
        data:any;
        headers:IncomingHttpHeaders;
    }

    interface IgResponse<T>{
        data:T;
        session: ISession;
    }

    interface ISession {
        isAuthenticated:boolean;
        csrfToken:string;
        userId:string;
        cookies: Cookie[];
        expires: Date | null;
        xHeaders:IgHeaders;
        userAgent?:string;
    }

    type ErrorDetail = {
        message:string;
        data:any;
        requireLogin:boolean;
    }

    interface IDatabase{
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

    interface IHistoryTable{
        username:string;
        history:IHistory;
    }

    interface IMediaTable{
        username: string;
        media: IMedia[];
        user: IUser;
        rowIndex: number;
        next: string;
    }

    interface IDatabaseProvider{
        db:IDatabase;
        store: (session:any) => Store;
    }
}