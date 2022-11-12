import path from "path";
import express, {Request, Response} from "express";
import session from "express-session";
import cors from "cors";
import { AuthError } from "@shared"
import Controller from "./controller"
import model from "./db/model"

const port = process.env.PORT || 5000

const isProduction = process.env.NODE_ENV === "production";

const publicDir = isProduction ? "./public" : "../public"

const app = express();

const controller = new Controller(model.db)
const store = model.store(session);

app.enable('trust proxy')
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static(path.resolve(__dirname, publicDir)));
app.use(session({
    secret: process.env.SECRET ?? "",
    store: store,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: isProduction ? true: false,
        httpOnly: true,
        maxAge: 86400000,
        sameSite: isProduction ? "none" : "strict"
    }
}))

app.use((req:Request, res:Response, next) => {

    const passthru = ["/login", "/logout", "/challenge"]

    if(!isProduction) req.session.account = process.env.ACCOUNT;

    if(req.session.account || passthru.includes(req.path) || req.method === "GET"){
        next()
    }else{
        controller.sendErrorResponse(res, new AuthError(""))
    }

})

app.get("/", (_req:Request, res:Response) => {
    res.sendFile(path.resolve(__dirname, publicDir, "index.html"));
});

app.get("/image", async (req:Request, res:Response) => {

    await controller.retrieveMedia(req, res)

})

app.get("/video", async (req:Request, res:Response) => {

    await controller.retrieveMedia(req, res)

})

app.post("/query", async (req:Request, res:Response) => {

    const username = req.body.username;
    const history = req.body.history;
    const reload = req.body.reload;
    const preview = req.body.preview;

    if(reload){
        return await controller.tryReload(req, res, username, history);
    }

    if(!username){
        await controller.tryRestore(req, res);
    }else{
        await controller.tryQuery(req, res, username, history, preview);
    }

});

app.post("/querymore", async (req:Request, res:Response) => {

    const user = req.body.user;
    const next = req.body.next;
    const preview = req.body.preview

    await controller.tryQueryMore(req, res, user, next, preview);

});

app.post("/login", async (req:Request, res:Response) => {

    const account = req.body.account;
    const password = req.body.password;

    await controller.tryLogin(req, res, account, password);

})

app.post("/challenge", async (req:Request, res:Response) => {

    const account = req.body.account;
    const code = req.body.code;
    const endpoint = req.body.endpoint;

    await controller.tryChallenge(req, res, account, code, endpoint);

})

app.post("/logout", async (req:Request, res:Response) => {

    await controller.tryLogout(req, res);

})

app.post("/following", async (req:Request, res:Response) => {

    const next = req.body.next;

    await controller.tryGetFollowings(req, res, next)
})

app.post("/follow", async (req:Request, res:Response) => {

    const user = req.body.user;

    await controller.tryFollow(req, res, user);

})

app.post("/unfollow", async (req:Request, res:Response) => {

    const user = req.body.user;

    await controller.tryUnfollow(req, res, user);

})

app.post("/save", async (req:Request, res:Response) => {

    const account = req.session.account;
    const username = req.body.username;
    const rowIndex = req.body.rowIndex;

    await controller.trySaveRowIndex(req, res, account, username, rowIndex);

});

app.post("/remove", async (req:Request, res:Response) => {

    const account = req.session.account;
    const history = req.body.history;
    const current = req.body.current;
    const target = req.body.target;

    await controller.tryDeleteHistory(req, res, account, current, target, history);

})

app.listen(port, () => {
    console.log(`Start server on port ${port}.`);
});