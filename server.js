/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

;// CONCATENATED MODULE: external "path"
const external_path_namespaceObject = require("path");
var external_path_default = /*#__PURE__*/__webpack_require__.n(external_path_namespaceObject);
;// CONCATENATED MODULE: external "express"
const external_express_namespaceObject = require("express");
var external_express_default = /*#__PURE__*/__webpack_require__.n(external_express_namespaceObject);
;// CONCATENATED MODULE: external "express-session"
const external_express_session_namespaceObject = require("express-session");
var external_express_session_default = /*#__PURE__*/__webpack_require__.n(external_express_session_namespaceObject);
;// CONCATENATED MODULE: external "cors"
const external_cors_namespaceObject = require("cors");
var external_cors_default = /*#__PURE__*/__webpack_require__.n(external_cors_namespaceObject);
;// CONCATENATED MODULE: ./src/entity.ts
class AuthError extends Error {
    constructor(detail) {
        super(detail.message);
        this.name = "AuthError";
        this.detail = detail;
        Object.setPrototypeOf(this, AuthError.prototype);
    }
}
class RequestError extends Error {
    constructor(message, requireLogin) {
        super(message);
        this.name = "RequestError";
        this.requireLogin = requireLogin;
        Object.setPrototypeOf(this, RequestError.prototype);
    }
}
const emptyMedia = {
    id: "",
    media_url: "",
    taggedUsers: [],
    thumbnail_url: "",
    isVideo: false,
    permalink: "",
};
const emptyUser = {
    id: "",
    igId: "",
    isPro: false,
    username: "",
    name: "",
    profileImage: "",
    biography: "",
    following: false,
};
const emptyResponse = {
    username: "",
    media: [],
    user: emptyUser,
    rowIndex: 0,
    next: "",
    history: {},
    isAuthenticated: false
};

;// CONCATENATED MODULE: external "tough-cookie"
const external_tough_cookie_namespaceObject = require("tough-cookie");
var external_tough_cookie_default = /*#__PURE__*/__webpack_require__.n(external_tough_cookie_namespaceObject);
;// CONCATENATED MODULE: ./src/api/util.ts

const baseUrl = "https://www.instagram.com";
const IgHeaderNames = {
    appId: "x_app_id",
    ajax: "x_ajax"
};
const Cookie = (external_tough_cookie_default()).Cookie;
const baseRequestHeaders = {
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate",
    "Accept-Language": "en-US",
    "Authority": "www.instagram.com",
};
const getSession = (headers) => {
    var _a;
    try {
        const session = {
            isAuthenticated: false,
            csrfToken: "",
            userId: "",
            expires: null,
            xHeaders: { appId: "", ajax: "" },
            userAgent: headers["user-agent"]
        };
        if (!headers.cookie) {
            return session;
        }
        const cookies = headers.cookie.split(";");
        cookies.forEach((cookieString) => {
            const cookie = Cookie.parse(cookieString);
            if (!cookie) {
                return;
            }
            const key = cookie.key.toLowerCase();
            if (key === "sessionid" && cookie.value) {
                session.isAuthenticated = true;
                if (cookie.expires !== "Infinity") {
                    session.expires = cookie.expires;
                }
            }
            if (key === "csrftoken") {
                session.csrfToken = cookie.value;
            }
            if (key === "ds_user_id") {
                session.userId = cookie.value;
            }
            if (key === IgHeaderNames.appId.toLowerCase()) {
                session.xHeaders.appId = cookie.value;
            }
            if (key === IgHeaderNames.ajax.toLowerCase()) {
                session.xHeaders.ajax = cookie.value;
            }
        });
        if (!session.userId) {
            session.userId = (_a = process.env.IG_USER_ID) !== null && _a !== void 0 ? _a : "";
        }
        return session;
    }
    catch (ex) {
        console.log(ex.message);
        throw new Error("cookie error");
    }
};
const updateSession = (currentSession, cookies, xHeaders) => {
    const session = {
        isAuthenticated: currentSession.isAuthenticated,
        csrfToken: currentSession.csrfToken,
        userId: currentSession.userId,
        expires: currentSession.expires,
        xHeaders: xHeaders !== null && xHeaders !== void 0 ? xHeaders : currentSession.xHeaders,
    };
    cookies.forEach((cookie) => {
        if (cookie.key.toLowerCase() === "sessionid" && cookie.value) {
            session.isAuthenticated = true;
            if (cookie.expires !== "Infinity") {
                session.expires = cookie.expires;
            }
        }
        if (cookie.key.toLowerCase() === "csrftoken") {
            session.csrfToken = cookie.value;
        }
        if (cookie.key.toLowerCase() === "ds_user_id") {
            session.userId = cookie.value;
        }
    });
    return session;
};
const createHeaders = (referer, session) => {
    const headers = baseRequestHeaders;
    headers["origin"] = "https://www.instagram.com";
    headers["referer"] = referer;
    headers["x-requested-with"] = "XMLHttpRequest";
    headers["X-Csrftoken"] = session.csrfToken;
    headers["X-Asbd-Id"] = 129477;
    if (session.userAgent) {
        headers["user-agent"] = session.userAgent; //"Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
    }
    if (session.xHeaders.ajax) {
        headers["X-Instagram-Ajax"] = session.xHeaders.ajax;
    }
    if (session.xHeaders.appId) {
        headers["X-Ig-App-Id"] = session.xHeaders.appId;
    }
    return headers;
};
const getAppId = (data) => {
    const appIds = data.match(/"customHeaders":{"X-IG-App-ID":"(.*)","X-IG-D"/);
    return appIds[1];
};
const getClientVersion = (data) => {
    const version = data.match(/"client_revision":(.*),"tier"/);
    return version[1];
};
const extractUserId = (data) => {
    const userId = data.match(/{"query":{"query_hash":".*","user_id":"(.*)","include_chaining"/);
    return userId[1];
};
const extractCsrfToken = (data) => {
    const token = data.match(/{"raw":"{\\"config\\":{\\"csrf_token\\":\\"(.*)\\",\\"viewer\\":/);
    return token[1];
};
const extractToken = (headers) => {
    const setCookieHeader = headers["set-cookie"] || [];
    const cookies = setCookieHeader.map(c => Cookie.parse(c) || new tough.Cookie());
    const { value: csrftoken } = cookies.find(({ key }) => key === "csrftoken") || {};
    if (!csrftoken) {
        return "";
    }
    return csrftoken;
};
const getCookieString = (cookies) => {
    let setCookieString = "";
    cookies.forEach((cookieString) => {
        const cookie = Cookie.parse(cookieString);
        if (!cookie || cookie.value === "" || cookie.value === undefined || cookie.value === null) {
            return;
        }
        setCookieString += `${cookie.key}=${cookie.value};`;
    });
    return setCookieString;
};
class CookieStore {
    constructor(url) {
        this.jar = new external_tough_cookie_namespaceObject.CookieJar();
        this.responseJar = new external_tough_cookie_namespaceObject.CookieJar();
        this.url = url ? url : baseUrl;
    }
    async storeCookie(setCookie) {
        if (!setCookie) {
            return await this.getAllCookies();
        }
        for (const cookieString of setCookie) {
            await this.jar.setCookie(cookieString, this.url, { ignoreError: true });
            await this.responseJar.setCookie(cookieString, this.url, { ignoreError: true });
        }
        return await this.getAllCookies();
    }
    async storeRequestCookie(cookieHeader) {
        if (!cookieHeader) {
            return await this.getCookies();
        }
        const excludeKeys = [
            "connect.sid",
            "ARRAffinity",
            "ARRAffinitySameSite"
        ];
        if (this.url == baseUrl) {
            excludeKeys.push(IgHeaderNames.ajax);
            excludeKeys.push(IgHeaderNames.appId);
        }
        const validCookies = cookieHeader.split(";").map(item => item.trim()).filter(cookieString => !excludeKeys.some(key => cookieString.includes(key)));
        for (const cookieString of validCookies) {
            await this.jar.setCookie(cookieString, this.url, { ignoreError: true });
        }
        return await this.getAllCookies();
    }
    async storeXHeaderCookie(xHeaders) {
        const today = new Date();
        const expires = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
        const xAjaxCookie = new (external_tough_cookie_default()).Cookie();
        xAjaxCookie.key = IgHeaderNames.ajax;
        xAjaxCookie.value = xHeaders.ajax;
        xAjaxCookie.expires = expires;
        xAjaxCookie.path = "/";
        xAjaxCookie.secure = true;
        xAjaxCookie.domain = this.url;
        await this.responseJar.setCookie(xAjaxCookie, this.url, { ignoreError: true });
        const xAppIdCookie = new (external_tough_cookie_default()).Cookie();
        xAppIdCookie.key = IgHeaderNames.appId;
        xAppIdCookie.value = xHeaders.appId;
        xAppIdCookie.expires = expires;
        xAppIdCookie.path = "/";
        xAppIdCookie.secure = true;
        xAppIdCookie.domain = this.url;
        await this.responseJar.setCookie(xAppIdCookie, this.url, { ignoreError: true });
    }
    async getCookieStrings() {
        return await this.jar.getCookieString(this.url);
    }
    async getCookies() {
        return await this.responseJar.getCookies(this.url);
    }
    async getAllCookies() {
        return await this.jar.getCookies(this.url);
    }
}
const logError = (ex) => {
    const hasResponse = !!ex.response;
    const message = hasResponse ? ex.response.data.message : ex.message;
    let data = hasResponse ? ex.response.data : "No response data";
    if (hasResponse && ex.response.headers["content-type"].includes("html")) {
        data = "Response is HTML";
    }
    console.log("----------- Error Logging ----------");
    console.log(`message: ${message}`);
    console.log(`data: ${JSON.stringify(data)}`);
    console.log("------------------------------------");
    return {
        message,
        data,
        requireLogin: hasResponse ? ex.response.data.require_login : false
    };
};


;// CONCATENATED MODULE: external "axios"
const external_axios_namespaceObject = require("axios");
var external_axios_default = /*#__PURE__*/__webpack_require__.n(external_axios_namespaceObject);
;// CONCATENATED MODULE: ./src/api/login.ts



const useRemote = process.env.LOGIN_POINT === "Local";
const login = async (req) => {
    if (req.data.account == process.env.ACCOUNT && req.data.password == process.env.PASS) {
        const session = getSession({});
        const data = { account: req.data.account, success: true, challenge: false, endpoint: "" };
        return {
            data,
            session,
            cookies: []
        };
    }
    if (useRemote)
        return await remoteLogin(req);
    return await localLogin(req);
};
const remoteLogin = async (req) => {
    console.log("---------- login start ----------");
    const account = req.data.account;
    let session = getSession({});
    session.userAgent = req.headers["user-agent"];
    const headers = createHeaders(baseUrl, session);
    let cookies = [];
    const jar = new CookieStore(process.env.API_URL);
    try {
        const options = {};
        options.url = process.env.API_URL + "/login";
        options.method = "POST";
        options.headers = headers;
        options.data = {
            account,
            password: req.data.password
        };
        const response = await external_axios_default().request(options);
        console.log("----------auth response-------");
        console.log(response.data);
        cookies = await jar.storeCookie(response.headers["set-cookie"]);
        session = updateSession(session, cookies);
        if (response.data.authenticated == false) {
            throw new AuthError({ message: "Account or password wrong", data: response.data, requireLogin: true });
        }
        return {
            data: response.data,
            session,
            cookies
        };
    }
    catch (ex) {
        const error = logError(ex);
        throw new AuthError(error);
    }
};
const localLogin = async (req) => {
    console.log("---------- login start ----------");
    const account = req.data.account;
    let session = getSession({});
    session.userAgent = req.headers["user-agent"];
    const headers = createHeaders(baseUrl, session);
    let cookies = [];
    const jar = new CookieStore();
    try {
        const options = {};
        headers.Cookie = "ig_cb=1";
        headers["X-Instagram-Ajax"] = 1;
        options.url = baseUrl;
        options.method = "GET";
        options.headers = headers;
        let response = await external_axios_default().request(options);
        const xHeaders = {
            appId: getAppId(response.data),
            ajax: getClientVersion(response.data)
        };
        await jar.storeXHeaderCookie(xHeaders);
        session.csrfToken = extractCsrfToken(response.data);
        cookies = await jar.storeCookie(response.headers["set-cookie"]);
        headers["X-Ig-App-Id"] = xHeaders.appId;
        headers.Cookie = await jar.getCookieStrings();
        session = updateSession(session, cookies, xHeaders);
        headers["X-Asbd-Id"] = 129477;
        headers["X-Ig-Www-Claim"] = 0;
        headers["X-Instagram-Ajax"] = xHeaders.ajax;
        headers["X-Csrftoken"] = session.csrfToken;
        options.url = "https://www.instagram.com/api/v1/public/landing_info/";
        options.method = "GET";
        options.headers = headers;
        response = await external_axios_default().request(options);
        cookies = await jar.storeCookie(response.headers["set-cookie"]);
        session = updateSession(session, cookies, xHeaders);
        headers.Cookie = await jar.getCookieStrings();
        headers["X-Asbd-Id"] = 129477;
        headers["X-Ig-Www-Claim"] = 0;
        headers["X-Instagram-Ajax"] = xHeaders.ajax;
        headers["X-Csrftoken"] = session.csrfToken;
        headers["content-type"] = "application/x-www-form-urlencoded";
        const createEncPassword = (pwd) => {
            return `#PWD_INSTAGRAM_BROWSER:0:${Math.floor(Date.now() / 1000)}:${pwd}`;
        };
        const params = new URLSearchParams();
        params.append("enc_password", createEncPassword(req.data.password));
        params.append("username", account);
        params.append("queryParams", "{}");
        params.append("optIntoOneTap", "false");
        params.append("trustedDeviceRecords", "{}");
        options.url = "https://www.instagram.com/api/v1/web/accounts/login/ajax/";
        options.method = "POST";
        options.data = params;
        options.headers = headers;
        console.log(headers);
        response = await external_axios_default().request(options);
        console.log("----------auth response-------");
        console.log(response.data);
        cookies = await jar.storeCookie(response.headers["set-cookie"]);
        session = updateSession(session, cookies);
        const data = { account, success: session.isAuthenticated, challenge: false, endpoint: "" };
        cookies = await jar.getCookies();
        return {
            data,
            session,
            cookies
        };
    }
    catch (ex) {
        if (ex.response && ex.response.data.message && ex.response.data.message === "checkpoint_required") {
            console.log("------------- checkpoint required ------------");
            console.log(ex.response.data);
            cookies = await jar.storeCookie(ex.response.headers["set-cookie"]);
            session = updateSession(session, cookies);
            headers["X-Csrftoken"] = session.csrfToken;
            headers.Cookie = await jar.getCookieStrings();
            return await requestChallenge(account, ex.response.data.checkpoint_url, headers, session, jar);
        }
        const error = logError(ex);
        throw new AuthError(error);
    }
};
const requestChallenge = async (account, checkpoint, headers, session, jar) => {
    console.log("---------- checkpoint start -------");
    try {
        const options = {};
        const url = "https://www.instagram.com" + checkpoint;
        options.url = checkpoint;
        options.method = "GET";
        options.headers = headers;
        let response = await external_axios_default().request(options);
        let cookies = await jar.storeCookie(response.headers["set-cookie"]);
        session = updateSession(session, cookies);
        headers["referer"] = url;
        headers["X-Csrftoken"] = session.csrfToken;
        headers.Cookie = await jar.getCookieStrings();
        const params = new URLSearchParams();
        params.append("choice", "1");
        options.data = params;
        options.method = "POST";
        options.headers = headers;
        console.log(url);
        console.log(headers);
        response = await external_axios_default().request(options);
        console.log("---------- challenge response -------");
        console.log(response.data);
        console.log(response.headers);
        cookies = await jar.storeCookie(response.headers["set-cookie"]);
        session = updateSession(session, cookies);
        if (response.data.type && response.data.type === "CHALLENGE") {
            return {
                data: { account: account, success: false, challenge: true, endpoint: url },
                session,
                cookies
            };
        }
        console.log("Challange response not found");
        return {
            data: { account: account, success: true, challenge: false, endpoint: url },
            session,
            cookies
        };
    }
    catch (ex) {
        const error = logError(ex);
        throw new AuthError(error);
    }
};
const challenge = async (req) => {
    if (useRemote)
        return await remoteChallenge(req);
    return await localChallenge(req);
};
const remoteChallenge = async (req) => {
    console.log("-------------- code verification start ---------");
    const url = req.data.endpoint;
    const jar = new CookieStore(process.env.API_URL);
    const options = {};
    let session = getSession(req.headers);
    const headers = createHeaders(url, session);
    await jar.storeRequestCookie(req.headers.cookie);
    headers.Cookie = await jar.getCookieStrings();
    try {
        options.url = process.env.API_URL + "/challenge";
        options.data = {
            endpoint: req.data.endpoint,
            account: req.data.account,
            code: req.data.code,
        };
        options.method = "POST";
        options.headers = headers;
        const response = await external_axios_default().request(options);
        let cookies = await jar.storeCookie(response.headers["set-cookie"]);
        session = updateSession(session, cookies);
        cookies = await jar.getCookies();
        console.log(response.data);
        return {
            data: response.data,
            session,
            cookies
        };
    }
    catch (ex) {
        const error = logError(ex);
        error.data = { account: req.data.account, success: false, challenge: true, endpoint: req.data.endpoint };
        throw new AuthError(error);
    }
};
const localChallenge = async (req) => {
    console.log("-------------- code verification start ---------");
    const url = req.data.endpoint;
    const jar = new CookieStore();
    const options = {};
    let session = getSession(req.headers);
    const headers = createHeaders(url, session);
    try {
        headers["X-Ig-App-Id"] = session.xHeaders.appId;
        headers["X-Ig-Www-Claim"] = 0;
        headers["X-Instagram-Ajax"] = session.xHeaders.ajax;
        headers["content-type"] = "application/x-www-form-urlencoded";
        await jar.storeRequestCookie(req.headers.cookie);
        headers.Cookie = await jar.getCookieStrings();
        console.log(headers);
        const params = new URLSearchParams();
        params.append("security_code", req.data.code);
        options.url = url;
        options.data = params;
        options.method = "POST";
        options.headers = headers;
        const response = await external_axios_default().request(options);
        let cookies = await jar.storeCookie(response.headers["set-cookie"]);
        session = updateSession(session, cookies);
        const data = { account: req.data.account, success: session.isAuthenticated, challenge: !session.isAuthenticated, endpoint: "" };
        cookies = await jar.getCookies();
        if (!response.headers["content-type"].includes("html")) {
            console.log(response.data);
        }
        return {
            data,
            session,
            cookies
        };
    }
    catch (ex) {
        const error = logError(ex);
        console.log(error.data);
        throw new AuthError({ message: "Code verification failed", data: { account: req.data.account, success: false, challenge: true, endpoint: req.data.endpoint }, requireLogin: true });
    }
};
const logout = async (req) => {
    if (useRemote)
        return await remoteLogout(req);
    return await localLogout(req);
};
const remoteLogout = async (req) => {
    const jar = new CookieStore(process.env.API_URL);
    let session = getSession(req.headers);
    if (!session.isAuthenticated)
        throw new RequestError("Already logged out", false);
    const options = {};
    const headers = createHeaders(baseUrl, session);
    await jar.storeRequestCookie(req.headers.cookie);
    headers.Cookie = await jar.getCookieStrings();
    try {
        options.url = process.env.API_URL + "/logout";
        options.data = {
            endpoint: req.data.endpoint,
            account: req.data.account,
            code: req.data.code,
        };
        options.method = "POST";
        options.headers = headers;
        const response = await external_axios_default().request(options);
        console.log(response.data);
        let cookies = await jar.storeCookie(response.headers["set-cookie"]);
        session = updateSession(session, cookies);
        const data = { account: "", success: true, challenge: false, endpoint: "" };
        cookies = await jar.getCookies();
        return {
            data,
            session,
            cookies
        };
    }
    catch (ex) {
        return {
            data: { account: "", success: true, challenge: false, endpoint: "" },
            session,
            cookies: []
        };
    }
};
const localLogout = async (req) => {
    const jar = new CookieStore();
    let session = getSession(req.headers);
    if (!session.isAuthenticated)
        throw new Error("Already logged out");
    try {
        const url = "https://www.instagram.com/api/v1/web/accounts/logout/ajax/";
        const headers = createHeaders(baseUrl, session);
        headers["X-Ig-App-Id"] = session.xHeaders.appId;
        headers["X-Ig-Www-Claim"] = 0;
        headers["X-Instagram-Ajax"] = session.xHeaders.ajax;
        headers["content-type"] = "application/x-www-form-urlencoded";
        await jar.storeRequestCookie(req.headers.cookie);
        headers.Cookie = await jar.getCookieStrings();
        const options = {
            url,
            method: "POST",
            headers,
        };
        const response = await external_axios_default().request(options);
        console.log(response.data);
        let cookies = await jar.storeCookie(response.headers["set-cookie"]);
        session = updateSession(session, cookies);
        const data = { account: "", success: true, challenge: false, endpoint: "" };
        cookies = await jar.getCookies();
        return {
            data,
            session,
            cookies
        };
    }
    catch (ex) {
        return {
            data: { account: "", success: true, challenge: false, endpoint: "" },
            session,
            cookies: []
        };
    }
};


;// CONCATENATED MODULE: ./src/api/media.ts



const GRAPH_QL = "#GRAPH_QL";
const IMAGE_URL = "/image?url=";
const VIDEO_URL = "/video?url=";
const IMAGE_PERMALINK_URL = "https://www.instagram.com/p/";
const VIDEO_PERMALINK_URL = "https://www.instagram.com/reel/";
const requestMedia = async (req) => {
    const session = getSession(req.headers);
    const access_token = process.env.TOKEN;
    const userId = process.env.USER_ID;
    const version = process.env.VERSION;
    const username = req.data.username;
    const url = `https://graph.facebook.com/v${version}/${userId}?fields=business_discovery.username(${username}){id,username,name,biography,profile_picture_url,ig_id,media{id,media_url,media_type,permalink,children{id,media_url,media_type,permalink}}}&access_token=${access_token}`;
    try {
        const response = await external_axios_default().get(url);
        const data = _formatGraph(response.data);
        return {
            data,
            session,
            cookies: []
        };
    }
    catch (ex) {
        return await _tryRequestPrivate(req, session);
    }
};
const requestMore = async (req) => {
    const session = getSession(req.headers);
    if (req.data.next.startsWith(GRAPH_QL)) {
        return _tryRequestMorePrivate(req, session);
    }
    const access_token = process.env.TOKEN;
    const userId = process.env.USER_ID;
    const version = process.env.VERSION;
    const url = `https://graph.facebook.com/v${version}/${userId}?fields=business_discovery.username(${req.data.user.username}){id,username,name,profile_picture_url,ig_id,media.after(${req.data.next}){id,media_url,media_type,permalink,children{id,media_url,media_type,permalink}}}&access_token=${access_token}`;
    const response = await external_axios_default().get(url);
    const data = _formatGraph(response.data);
    return {
        data,
        session,
        cookies: []
    };
};
const _getVideoUrl = (url) => {
    return `${VIDEO_URL}${encodeURIComponent(url)}`;
};
const _getImageUrl = (url) => {
    return `${IMAGE_URL}${encodeURIComponent(url)}`;
};
const _formatGraph = (data) => {
    const media = [];
    const root = data.business_discovery;
    root.media.data.forEach((data) => {
        if (data.children) {
            data.children.data.forEach((child) => {
                const isVideo = child.media_type === "VIDEO";
                const thumbnailUrl = isVideo ? `${IMAGE_URL}${child.permalink}media?size=t` : child.media_url;
                media.push({
                    id: child.id,
                    media_url: child.media_url,
                    taggedUsers: [],
                    thumbnail_url: thumbnailUrl,
                    isVideo,
                    permalink: child.permalink
                });
            });
        }
        else {
            const isVideo = data.media_type === "VIDEO";
            const permalink = isVideo ? data.permalink.replace(/\/reel\//, "/p/") : data.permalink;
            const thumbnailUrl = isVideo ? `${IMAGE_URL}${permalink}media?size=t` : data.media_url;
            media.push({
                id: data.id,
                media_url: data.media_url,
                taggedUsers: [],
                thumbnail_url: thumbnailUrl,
                isVideo,
                permalink
            });
        }
    });
    const rowIndex = 0;
    const next = root.media.paging ? root.media.paging.cursors.after : "";
    const username = root.username;
    const user = {
        id: root.ig_id,
        igId: root.ig_id,
        username,
        name: root.name,
        profileImage: root.profile_picture_url,
        biography: root.biography,
        following: false,
        isPro: true,
    };
    const history = { [username]: user };
    return { username, media, user, rowIndex, next, history, isAuthenticated: true };
};
const _tryRequestPrivate = async (req, session) => {
    if (!session.isAuthenticated) {
        throw new AuthError({ message: "", data: {}, requireLogin: true });
    }
    const jar = new CookieStore();
    const username = req.data.username;
    const headers = createHeaders(baseUrl + "/" + username + "/", session);
    try {
        let cookies = await jar.storeRequestCookie(req.headers.cookie);
        session = updateSession(session, cookies);
        headers["X-IG-App-Id"] = session.xHeaders.appId;
        headers.Cookie = await jar.getCookieStrings();
        const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
        // use when web_profile no longer works
        //const url = baseUrl + "/" + username + "/"
        headers["X-Asbd-Id"] = "129477";
        const options = {
            url,
            method: "GET",
            headers,
        };
        let response = await external_axios_default().request(options);
        const userData = response.data.data.user;
        /*
        // use when web_profile no longer works
        const userData = {
            id:extractUserId(response.data),
            full_name:username,
            profile_pic_url:"",
            biography:"",
            followed_by_viewer:false,
        }
*/
        const user = {
            id: userData.id,
            igId: userData.id,
            username,
            name: userData.full_name,
            profileImage: IMAGE_URL + encodeURIComponent(userData.profile_pic_url),
            biography: userData.biography,
            following: userData.followed_by_viewer,
            isPro: false,
        };
        cookies = await jar.storeCookie(response.headers["set-cookie"]);
        session = updateSession(session, cookies);
        response = await _requestPrivate(req, session, user, jar);
        cookies = await jar.getCookies();
        session = updateSession(session, cookies);
        const data = _formatMedia(response.data, session, user);
        return {
            data,
            session,
            cookies
        };
    }
    catch (ex) {
        console.log("Private media request failed");
        const error = logError(ex);
        throw new RequestError(error.message, error.requireLogin);
    }
};
const _tryRequestMorePrivate = async (req, session) => {
    if (!session.isAuthenticated) {
        throw new AuthError({ message: "", data: {}, requireLogin: true });
    }
    const jar = new CookieStore();
    try {
        const response = await _requestMorePrivate(req, session, jar);
        const cookies = await jar.getCookies();
        session = updateSession(session, cookies);
        const formatResult = _formatMedia(response.data, session, req.data.user);
        const data = formatResult;
        return {
            data,
            session,
            cookies
        };
    }
    catch (ex) {
        console.log("Private querymore failed");
        const error = logError(ex);
        throw new RequestError(error.message, error.requireLogin);
    }
};
const _requestPrivate = async (req, session, user, jar) => {
    const headers = createHeaders(baseUrl + "/" + user.username + "/", session);
    headers.Cookie = await jar.getCookieStrings();
    const params = JSON.stringify({
        id: user.id,
        first: 12,
    });
    const url = `https://www.instagram.com/graphql/query/?query_hash=${process.env.QUERY_HASH}&variables=${encodeURIComponent(params)}`;
    // use when query hash no longer works
    //const url = `https://www.instagram.com/api/v1/feed/user/${user.username}/username/?count=12`
    const options = {
        url,
        method: "GET",
        headers,
    };
    const response = await external_axios_default().request(options);
    if (response.headers["content-type"].includes("html")) {
        throw new AuthError({ message: "Request private failed", data: {}, requireLogin: false });
    }
    /*
    // use when query hash no longer works
        if(!response.data.items){
    
        }
    */
    await jar.storeCookie(response.headers["set-cookie"]);
    return response;
};
const _requestMorePrivate = async (req, session, jar) => {
    const params = JSON.stringify({
        id: req.data.user.id,
        first: 12,
        after: req.data.next.replace(GRAPH_QL, "")
    });
    const url = `https://www.instagram.com/graphql/query/?query_hash=${process.env.QUERY_HASH}&variables=${encodeURIComponent(params)}`;
    // use when query hash no longer works
    //const url = `https://www.instagram.com/api/v1/feed/user/${req.data.user.id}/?count=12&max_id=${req.data.next.replace(GRAPH_QL, "")}`
    await jar.storeRequestCookie(req.headers.cookie);
    const headers = createHeaders(baseUrl + "/" + req.data.user.username + "/", session);
    headers.Cookie = await jar.getCookieStrings();
    const options = {
        url,
        method: "GET",
        headers,
    };
    const response = await external_axios_default().request(options);
    if (response.headers["content-type"].includes("html")) {
        throw new AuthError({ message: "Request more private failed.", data: {}, requireLogin: false });
    }
    /*
    // use when query hash no longer works
        if(!response.data.items){
    
        }
    */
    await jar.storeCookie(response.headers["set-cookie"]);
    return response;
};
/*
// use when query hash no longer works
const _formatMedia = (data:any, session:ISession, user:IUser) : IMediaResponse => {

    const media :IMedia[] = [];

    const mediaNode = data.items

    mediaNode.forEach( (data:any) => {

        if(data.carousel_media){

            data.carousel_media.forEach((child:any) =>{


                const isVideo = child.media_type == 2
                const mediaUrl = isVideo ? _getVideoUrl(child.video_versions[0].url) : _getImageUrl(child.image_versions2.candidates[0].url)
                const thumbnailUrl = _getImageUrl(child.image_versions2.candidates[0].url)
                const permalink = isVideo ? `${VIDEO_PERMALINK_URL}${child.code}` : `${IMAGE_PERMALINK_URL}${child.code}`

                media.push({
                    id:child.pk,
                    media_url: mediaUrl,
                    taggedUsers: child.usertags ? child.usertags.in.map((edge:any) => {
                        return {
                            id:edge.user.pk,
                            igId:edge.user.pk,
                            username:edge.user.username,
                            name:edge.user.full_name,
                            profileImage: _getImageUrl(edge.user.profile_pic_url),
                            biography:"",
                        }
                    }) : [],
                    thumbnail_url: thumbnailUrl,
                    isVideo,
                    permalink
                })

            })

        }else{

            const isVideo = data.media_type == 2
            const mediaUrl = isVideo ? _getVideoUrl(data.video_versions[0].url) : _getImageUrl(data.image_versions2.candidates[0].url)
            const thumbnailUrl = _getImageUrl(data.image_versions2.candidates[0].url)
            const permalink = isVideo ? `${VIDEO_PERMALINK_URL}${data.code}` : `${IMAGE_PERMALINK_URL}${data.code}`

            media.push({
                id:data.pk,
                media_url: mediaUrl,
                taggedUsers: data.usertags ? data.usertags.in.map((edge:any) => {
                    return {
                        id:edge.user.pk,
                        igId:edge.user.pk,
                        username:edge.user.username,
                        name:edge.user.full_name,
                        profileImage: _getImageUrl(edge.user.profile_pic_url),
                        biography:"",
                    }
                }) : [],
                thumbnail_url: thumbnailUrl,
                isVideo,
                permalink
            })

        }
    })

    const rowIndex = 0;

    const next = data.next_max_id ? GRAPH_QL + data.next_max_id : "";

    const username = user.username;

    const history = {[username]: user}

    return {username, media, user, rowIndex, next, history, isAuthenticated: session.isAuthenticated};

}

*/
const _formatMedia = (data, session, user) => {
    const media = [];
    const mediaNode = data.data.user.edge_owner_to_timeline_media;
    mediaNode.edges.forEach((data) => {
        if (data.node.edge_sidecar_to_children) {
            data.node.edge_sidecar_to_children.edges.forEach((child) => {
                const isVideo = child.node.is_video;
                const mediaUrl = isVideo ? _getVideoUrl(child.node.video_url) : _getImageUrl(child.node.display_url);
                const thumbnail_url = _getImageUrl(child.node.display_url);
                const permalink = isVideo ? `${VIDEO_PERMALINK_URL}${child.node.shortcode}` : `${IMAGE_PERMALINK_URL}${child.node.shortcode}`;
                media.push({
                    id: child.node.id,
                    media_url: mediaUrl,
                    taggedUsers: child.node.edge_media_to_tagged_user.edges.map((edge) => {
                        return {
                            id: edge.node.user.id,
                            igId: edge.node.user.id,
                            username: edge.node.user.username,
                            name: edge.node.user.full_name,
                            profileImage: _getImageUrl(edge.node.user.profile_pic_url),
                            biography: "",
                        };
                    }),
                    thumbnail_url,
                    isVideo,
                    permalink
                });
            });
        }
        else {
            const isVideo = data.node.is_video;
            const mediaUrl = isVideo ? _getVideoUrl(data.node.video_url) : _getImageUrl(data.node.display_url);
            const thumbnailUrl = isVideo ? _getImageUrl(data.node.thumbnail_src) : mediaUrl;
            const permalink = isVideo ? `${VIDEO_PERMALINK_URL}${data.node.shortcode}` : `${IMAGE_PERMALINK_URL}${data.node.shortcode}`;
            media.push({
                id: data.node.id,
                media_url: mediaUrl,
                taggedUsers: data.node.edge_media_to_tagged_user.edges.map((edge) => {
                    return {
                        id: edge.node.user.id,
                        igId: edge.node.user.id,
                        username: edge.node.user.username,
                        name: edge.node.user.full_name,
                        profileImage: _getImageUrl(edge.node.user.profile_pic_url),
                        biography: "",
                    };
                }),
                thumbnail_url: thumbnailUrl,
                isVideo,
                permalink
            });
        }
    });
    const rowIndex = 0;
    const next = mediaNode.page_info.has_next_page ? GRAPH_QL + mediaNode.page_info.end_cursor : "";
    const username = user.username;
    const history = { [username]: user };
    return { username, media, user, rowIndex, next, history, isAuthenticated: session.isAuthenticated };
};
const downloadMedia = async (url) => {
    const options = {
        url,
        method: "GET",
        headers: baseRequestHeaders,
        responseType: "stream",
    };
    return await external_axios_default().request(options);
};


;// CONCATENATED MODULE: ./src/api/follow.ts



const requestFollowings = async (req) => {
    const jar = new CookieStore();
    const currentSession = getSession(req.headers);
    /*
        const params = req.data.next ? {
            id: currentSession.userId,
            first:20,
            after: req.data.next
        } : {
            id: currentSession.userId,
            first:20
        }
    */
    const params = req.data.next ? `&max_id=${req.data.next}` : "";
    try {
        //https://i.instagram.com/api/v1/friendships/${userid}/following/?count=12&max_id=1
        //https://www.instagram.com/api/v1/friendships/52714401302/following/?count=12
        //const url = `https://www.instagram.com/graphql/query/?query_hash=58712303d941c6855d4e888c5f0cd22f&variables=${encodeURIComponent(JSON.stringify(params))}`
        const url = `https://www.instagram.com/api/v1/friendships/${currentSession.userId}/following/?count=12${params}`;
        const headers = createHeaders(baseUrl, currentSession);
        await jar.storeRequestCookie(req.headers.cookie);
        headers.Cookie = await jar.getCookieStrings();
        const options = {
            url,
            method: "GET",
            headers,
        };
        const response = await external_axios_default().request(options);
        if (response.headers["content-type"].includes("html")) {
            throw new AuthError({ message: "Failed to get followings", data: {}, requireLogin: true });
        }
        let cookies = await jar.storeCookie(response.headers["set-cookie"]);
        const data = _formatFollowings(response.data);
        const session = updateSession(currentSession, cookies);
        cookies = await jar.getCookies();
        return {
            data,
            session,
            cookies
        };
    }
    catch (ex) {
        const error = logError(ex);
        throw new RequestError(error.message, error.requireLogin);
    }
};
const _formatFollowings = (data) => {
    /*
        const dataNode = data.data.user.edge_follow;
    
        const users :IUser[] = dataNode.edges.map((user:any) :IUser => {
    
            return {
                id:user.node.id,
                igId:user.node.id,
                username:user.node.username,
                name:user.node.full_name,
                biography:"",
                profileImage: "/image?url=" + encodeURIComponent(user.node.profile_pic_url),
                following: true,
                isPro:false,
            }
        })
    */
    const users = data.users.map((user) => {
        return {
            id: user.pk_id,
            igId: user.pk_id,
            username: user.username,
            name: user.full_name,
            biography: "",
            profileImage: "/image?url=" + encodeURIComponent(user.profile_pic_url),
            following: true,
            isPro: false,
        };
    });
    const hasNext = data.next_max_id ? true : false; //dataNode.page_info.has_next_page;
    //const next = hasNext ? dataNode.page_info.end_cursor : "";
    const next = hasNext ? data.next_max_id : "";
    return { users, hasNext, next };
};
const follow = async (req) => {
    const jar = new CookieStore();
    const currentSession = getSession(req.headers);
    if (!currentSession.isAuthenticated) {
        throw new AuthError({ message: "", data: {}, requireLogin: true });
    }
    try {
        const url = `${baseUrl}/web/friendships/${req.data.user.id}/follow/`;
        const headers = createHeaders(baseUrl, currentSession);
        await jar.storeRequestCookie(req.headers.cookie);
        headers.Cookie = await jar.getCookieStrings();
        const options = {
            url,
            method: "POST",
            headers,
            withCredentials: true
        };
        const response = await external_axios_default().request(options);
        let cookies = await jar.storeCookie(response.headers["set-cookie"]);
        const data = response.data;
        const session = updateSession(currentSession, cookies);
        cookies = await jar.getCookies();
        return {
            data,
            session,
            cookies
        };
    }
    catch (ex) {
        const error = logError(ex);
        throw new RequestError(error.message, error.requireLogin);
    }
};
const unfollow = async (req) => {
    const jar = new CookieStore();
    const currentSession = getSession(req.headers);
    if (!currentSession.isAuthenticated) {
        throw new AuthError({ message: "", data: {}, requireLogin: true });
    }
    try {
        const url = `${baseUrl}/web/friendships/${req.data.user.id}/unfollow/`;
        const headers = createHeaders(baseUrl, currentSession);
        await jar.storeRequestCookie(req.headers.cookie);
        headers.Cookie = await jar.getCookieStrings();
        const options = {
            url,
            method: "POST",
            headers,
            withCredentials: true
        };
        const response = await external_axios_default().request(options);
        let cookies = await jar.storeCookie(response.headers["set-cookie"]);
        const data = response.data;
        const session = updateSession(currentSession, cookies);
        cookies = await jar.getCookies();
        return {
            data,
            session,
            cookies
        };
    }
    catch (ex) {
        const error = logError(ex);
        throw new RequestError(error.message, error.requireLogin);
    }
};


;// CONCATENATED MODULE: ./src/api/instagram.ts






;// CONCATENATED MODULE: ./src/controller.ts


class Controller {
    constructor(db) {
        this.db = db;
        this.db.create();
    }
    convertSameSite(_sameSite) {
        if (!_sameSite)
            return "none";
        if (_sameSite.toLowerCase() === "lax")
            return "lax";
        if (_sameSite.toLowerCase() === "strict")
            return "strict";
        if (_sameSite.toLowerCase() === "none")
            return "none";
        return false;
    }
    async sendResponse(req, res, data) {
        const domain =  true ? req.hostname : 0;
        data.cookies.forEach((cookie) => {
            var _a;
            if (typeof cookie.maxAge === "number" && cookie.maxAge <= 0)
                return;
            const sameSite = this.convertSameSite(cookie.sameSite);
            let secure = cookie.secure;
            if (!secure && sameSite == "none") {
                secure = true;
            }
            console.log(`key:${cookie.key}, expires:${cookie.expires}\n`);
            res.cookie(cookie.key, cookie.value, {
                domain: domain,
                expires: cookie.expires === "Infinity" ? undefined : cookie.expires,
                httpOnly: cookie.httpOnly,
                path: (_a = cookie.path) !== null && _a !== void 0 ? _a : undefined,
                secure,
                sameSite: sameSite,
                encode: String
            });
        });
        res.set({ "ig-auth": data.session.isAuthenticated });
        res.status(200).send(data.data);
    }
    sendErrorResponse(res, ex) {
        const data = ex instanceof AuthError ? ex.detail : { message: ex.message };
        if (ex instanceof AuthError) {
            res.set({ "ig-auth": !ex.detail.requireLogin });
        }
        if (ex instanceof RequestError) {
            res.set({ "ig-auth": !ex.requireLogin });
        }
        res.status(400).send(data);
    }
    async tryRestore(req, res) {
        try {
            const session = getSession(req.headers);
            const result = await this.db.restore(req.session.account);
            if (req.session.account == process.env.ACCOUNT) {
                result.isAuthenticated = true;
                result.account = req.session.account;
            }
            else {
                session.isAuthenticated = false;
            }
            await this.sendResponse(req, res, { data: result, session, cookies: [] });
        }
        catch (ex) {
            this.sendErrorResponse(res, new Error("Restore failed"));
        }
    }
    async restoreBySession(req) {
        if (!req.session.account) {
            return emptyResponse;
        }
        try {
            req.session.cookie.maxAge = 31536000;
            return await this.db.restore(req.session.account);
        }
        catch (ex) {
            return emptyResponse;
        }
    }
    async saveSession(req, account, session) {
        req.session.account = account;
        if (session.expires) {
            req.session.cookie.maxAge = 31536000;
        }
    }
    async tryLogin(req, res, account, password) {
        if (!account || !password) {
            return this.sendErrorResponse(res, new Error("Username/password required"));
        }
        if (account !== process.env.ACCOUNT) {
            return this.sendErrorResponse(res, new Error("Unauthorized account"));
        }
        try {
            const result = await login({ data: { account, password }, headers: req.headers });
            if (result.data.success) {
                this.saveSession(req, account, result.session);
            }
            const media = await this.restoreBySession(req);
            const authResponse = {
                status: result.data,
                media
            };
            const response = {
                data: authResponse,
                session: result.session,
                cookies: result.cookies
            };
            await this.sendResponse(req, res, response);
        }
        catch (ex) {
            this.sendErrorResponse(res, ex);
        }
    }
    async tryChallenge(req, res, account, code, endpoint) {
        try {
            const result = await challenge({ data: { account, code, endpoint }, headers: req.headers });
            if (result.data.success) {
                this.saveSession(req, account, result.session);
            }
            const media = await this.restoreBySession(req);
            const authResponse = {
                status: result.data,
                media
            };
            const response = {
                data: authResponse,
                session: result.session,
                cookies: result.cookies
            };
            await this.sendResponse(req, res, response);
        }
        catch (ex) {
            this.sendErrorResponse(res, ex);
        }
    }
    async tryLogout(req, res) {
        try {
            const result = await logout({ data: {}, headers: req.headers });
            req.session.destroy(_e => { console.log(_e); });
            const authResponse = {
                status: result.data,
                media: emptyResponse,
            };
            const response = {
                data: authResponse,
                session: result.session,
                cookies: result.cookies
            };
            await this.sendResponse(req, res, response);
        }
        catch (ex) {
            this.sendErrorResponse(res, ex);
        }
    }
    async tryQuery(req, res, username, history, preview) {
        const newHistory = history;
        try {
            const exisitingData = await this.db.queryMedia(req.session.account, username);
            let mediaResponse;
            if (exisitingData.username) {
                const session = getSession(req.headers);
                mediaResponse = {
                    session,
                    data: {
                        username: exisitingData.username,
                        media: exisitingData.media,
                        user: exisitingData.user,
                        rowIndex: exisitingData.rowIndex,
                        next: exisitingData.next,
                        history: newHistory,
                        isAuthenticated: session.isAuthenticated
                    },
                    cookies: []
                };
            }
            else {
                mediaResponse = await requestMedia({ data: { username }, headers: req.headers });
            }
            if (!preview) {
                newHistory[mediaResponse.data.username] = mediaResponse.data.user;
                mediaResponse.data.history = newHistory;
                await this.db.saveHistory(req.session.account, username, newHistory);
                await this.db.saveMedia(req.session.account, mediaResponse.data);
            }
            await this.sendResponse(req, res, mediaResponse);
        }
        catch (ex) {
            console.log("try query error");
            return this.sendErrorResponse(res, ex);
        }
    }
    async tryQueryMore(req, res, user, next, preview) {
        try {
            const historyData = await this.db.queryHistory(req.session.account);
            const mediaResponse = await requestMore({ data: { user, next }, headers: req.headers });
            if (!preview) {
                mediaResponse.data.history = historyData.history;
                await this.db.appendMedia(req.session.account, mediaResponse.data);
            }
            await this.sendResponse(req, res, mediaResponse);
        }
        catch (ex) {
            console.log("try query more error");
            return this.sendErrorResponse(res, ex);
        }
    }
    async tryReload(req, res, username, history) {
        try {
            const mediaResponse = await requestMedia({ data: { username }, headers: req.headers });
            history[username] = mediaResponse.data.history[username];
            mediaResponse.data.history = history;
            await this.db.saveMedia(req.session.account, mediaResponse.data);
            await this.sendResponse(req, res, mediaResponse);
        }
        catch (ex) {
            console.log("tryReload error");
            return this.sendErrorResponse(res, ex);
        }
    }
    async tryGetFollowings(req, res, next) {
        try {
            const result = await requestFollowings({ data: { next }, headers: req.headers });
            await this.sendResponse(req, res, result);
        }
        catch (ex) {
            return this.sendErrorResponse(res, ex);
        }
    }
    async tryFollow(req, res, user) {
        try {
            const result = await follow({ data: { user }, headers: req.headers });
            await this.sendResponse(req, res, result);
        }
        catch (ex) {
            return this.sendErrorResponse(res, ex);
        }
    }
    async tryUnfollow(req, res, user) {
        try {
            const result = await unfollow({ data: { user }, headers: req.headers });
            await this.sendResponse(req, res, result);
        }
        catch (ex) {
            return this.sendErrorResponse(res, ex);
        }
    }
    async trySaveRowIndex(req, res, account, username, rowIndex) {
        try {
            await this.db.saveRowIndex(account, username, rowIndex);
            res.status(200).send({ status: "done" });
        }
        catch (ex) {
            this.sendErrorResponse(res, new Error("Update failed"));
        }
    }
    async tryDeleteHistory(_req, res, account, currentUsername, deleteUsername, history) {
        try {
            await this.db.deleteMedia(account, deleteUsername);
            await this.db.saveHistory(account, currentUsername, history);
            res.status(200).send({ status: "done" });
        }
        catch (ex) {
            this.sendErrorResponse(res, new Error("Delete failed"));
        }
    }
    async retrieveMedia(req, res) {
        try {
            if (!req.query.url || typeof req.query.url !== "string") {
                return this.sendErrorResponse(res, new Error("no url specified"));
            }
            const result = await downloadMedia(req.query.url);
            Object.entries(result.headers).forEach(([key, value]) => res.setHeader(key, value));
            if (req.query.id) {
                res.attachment(`${req.query.id}.mp4`);
            }
            result.data.pipe(res);
        }
        catch (ex) {
            this.sendErrorResponse(res, new Error("Media not found"));
        }
    }
}
/* harmony default export */ const controller = (Controller);

;// CONCATENATED MODULE: external "@azure/cosmos"
const cosmos_namespaceObject = require("@azure/cosmos");
;// CONCATENATED MODULE: external "node-abort-controller"
const external_node_abort_controller_namespaceObject = require("node-abort-controller");
;// CONCATENATED MODULE: ./src/db/azureContext.ts
var __asyncValues = (undefined && undefined.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};

async function create(client, databaseId, containerConfigs) {
    var e_1, _a;
    const controller = new external_node_abort_controller_namespaceObject.AbortController();
    console.log("befoer cxraeta");
    const { database } = await client.databases.createIfNotExists({ id: databaseId }, { abortSignal: controller.signal });
    console.log(`Created database:\n${database.id}\n`);
    try {
        for (var containerConfigs_1 = __asyncValues(containerConfigs), containerConfigs_1_1; containerConfigs_1_1 = await containerConfigs_1.next(), !containerConfigs_1_1.done;) {
            const config = containerConfigs_1_1.value;
            const response = await client.database(databaseId).containers.createIfNotExists({ id: config.ContainerId, partitionKey: config.PartitionKey, defaultTtl: -1 }, { offerThroughput: 400, abortSignal: controller.signal });
            console.log(`Created container:\n${response.container.id}\n`);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (containerConfigs_1_1 && !containerConfigs_1_1.done && (_a = containerConfigs_1.return)) await _a.call(containerConfigs_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
}

;// CONCATENATED MODULE: ./src/db/azcosmosdb.ts




const MEDIA_CONTAINER = "Media";
class azcosmosdb {
    constructor() {
        var _a, _b, _c;
        this.controller = new external_node_abort_controller_namespaceObject.AbortController();
        this.client = new cosmos_namespaceObject.CosmosClient({ endpoint: (_a = process.env.AZ_ENDPOINT) !== null && _a !== void 0 ? _a : "", key: (_b = process.env.AZ_KEY) !== null && _b !== void 0 ? _b : "" });
        this.database = this.client.database((_c = process.env.AZ_DB_ID) !== null && _c !== void 0 ? _c : "");
    }
    async create() {
        var _a;
        const containerConfigs = [
            {
                ContainerId: MEDIA_CONTAINER,
                PartitionKey: { kind: cosmos_namespaceObject.PartitionKeyKind.Hash, paths: ["/username"] }
            }
        ];
        await create(this.client, (_a = process.env.AZ_DB_ID) !== null && _a !== void 0 ? _a : "", containerConfigs);
    }
    async restore(account) {
        try {
            const history = await this.queryHistory(account);
            if (!history.username) {
                return emptyResponse;
            }
            const media = await this.queryMedia(account, history.username);
            return {
                username: media.username,
                media: media.media,
                user: media.user,
                rowIndex: media.rowIndex,
                next: media.next,
                history: history.history,
                isAuthenticated: false,
            };
        }
        catch (ex) {
            console.log("restore failed");
            return emptyResponse;
        }
    }
    async queryHistory(account) {
        try {
            const querySpec = {
                query: `SELECT h.history FROM ${MEDIA_CONTAINER} h WHERE h.id = @account and h.username = @account`,
                parameters: [
                    {
                        name: "@account",
                        value: account
                    }
                ]
            };
            const { resources: items } = await this.database.container(MEDIA_CONTAINER).items.query(querySpec, { abortSignal: this.controller.signal }).fetchAll();
            if (items.length <= 0) {
                throw new Error("No history found");
            }
            const row = items[0].history;
            return {
                username: row.username,
                history: row.history
            };
        }
        catch (ex) {
            console.log("query failed");
            console.log(ex);
            return {
                username: "",
                history: {}
            };
        }
    }
    async queryMedia(account, username) {
        try {
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
            const { resources: items } = await this.database.container(MEDIA_CONTAINER).items.query(querySpec, { abortSignal: this.controller.signal }).fetchAll();
            if (items.length <= 0) {
                throw new Error("No media found");
            }
            const row = items[0];
            return {
                username: row.username,
                media: row.media,
                user: row.user,
                rowIndex: row.rowIndex,
                next: row.next
            };
        }
        catch (ex) {
            console.log("query failed");
            console.log(ex);
            return emptyResponse;
        }
    }
    async query(_queryString, _params) {
    }
    async saveHistory(account, username, history) {
        try {
            await this.database.container(MEDIA_CONTAINER).items.upsert({
                id: account,
                username: account,
                history: {
                    username,
                    history
                }
            });
            return true;
        }
        catch (ex) {
            console.log("insert history failed");
            console.log(ex);
            return false;
        }
    }
    async saveMedia(account, result) {
        try {
            await this.database.container(MEDIA_CONTAINER).items.upsert({
                id: account,
                username: result.username,
                media: result.media,
                user: result.user,
                rowIndex: 0,
                next: result.next,
                history: {},
            });
            return true;
        }
        catch (ex) {
            console.log("insert media failed");
            console.log(ex);
            return false;
        }
    }
    async saveRowIndex(account, username, rowIndex) {
        try {
            const media = await this.queryMedia(account, username);
            media.rowIndex = rowIndex;
            const newMedia = Object.assign({ id: account }, media);
            await this.database.container(MEDIA_CONTAINER).items.upsert(newMedia);
            return true;
        }
        catch (ex) {
            console.log("update rowindex failed");
            console.log(ex);
            return false;
        }
    }
    async appendMedia(account, result) {
        try {
            const data = await this.queryMedia(account, result.username);
            const arr = data.media;
            const newArr = arr.concat(result.media);
            const newMedia = {
                id: account,
                username: result.username,
                media: newArr,
                user: data.user,
                rowIndex: data.rowIndex,
                next: result.next,
                history: {},
            };
            await this.database.container(MEDIA_CONTAINER).items.upsert(newMedia);
            return true;
        }
        catch (ex) {
            console.log("append failed");
            console.log(ex);
            return false;
        }
    }
    async deleteMedia(account, username) {
        try {
            await this.database.container(MEDIA_CONTAINER).item(account, username).delete();
        }
        catch (ex) {
            console.log("delete failed");
            console.log(ex);
            throw new Error("delete failed");
        }
    }
}
/* harmony default export */ const db_azcosmosdb = (azcosmosdb);

;// CONCATENATED MODULE: ./src/store/azureStoreBase.ts


const CONTAINER_NAME = "Sessions";
class AzureStoreBase {
    constructor(options) {
        var _a, _b, _c;
        this.client = new cosmos_namespaceObject.CosmosClient({ endpoint: (_a = process.env.AZ_ENDPOINT) !== null && _a !== void 0 ? _a : "", key: (_b = process.env.AZ_KEY) !== null && _b !== void 0 ? _b : "" });
        this.database = this.client.database((_c = process.env.AZ_DB_ID) !== null && _c !== void 0 ? _c : "");
        this.ttl = options.ttl;
        this.isReady = false;
    }
    async init() {
        var _a;
        if (this.isReady)
            return;
        const containerConfig = {
            ContainerId: CONTAINER_NAME,
            PartitionKey: { kind: cosmos_namespaceObject.PartitionKeyKind.Hash, paths: ["/id"] }
        };
        await create(this.client, (_a = process.env.AZ_DB_ID) !== null && _a !== void 0 ? _a : "", [containerConfig]);
        this.isReady = true;
    }
    async get(sid) {
        //console.log(`Getting session: ${sid}`)
        await this.init();
        const querySpec = {
            query: `SELECT * FROM ${CONTAINER_NAME} s WHERE s.id = @sid`,
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
            return null;
        }
        //console.log(`Session found: ${sid}`)
        return items[0].data;
    }
    async set(sid, session) {
        await this.init();
        //console.log(`Setting session: ${sid}`)
        const ttl = session.cookie.expires ? Math.round((session.cookie.expires.getTime() - new Date().getTime()) / 1000) : this.ttl;
        await this.database.container(CONTAINER_NAME).items.upsert({
            id: sid,
            data: session,
            ttl,
        });
    }
    async destroy(sid) {
        await this.init();
        //console.log(`Destroying session: ${sid}`)
        await this.database.container(CONTAINER_NAME).item(sid, sid).delete();
        //console.log(result)
    }
    async touch(sid, session) {
        //console.log(`Refreshing session: ${sid}`)
        await this.init();
        await this.set(sid, session);
        //console.log(`Refresh session complete: ${sid}`)
    }
}

;// CONCATENATED MODULE: ./src/store/azureStore.ts

function azureStoreFactory(Store) {
    class AzureStore extends Store {
        constructor(options) {
            super(options);
            this.azureStoreBase = new AzureStoreBase(options);
        }
        get(sid, callback) {
            this.azureStoreBase.get(sid)
                .then((data) => {
                callback(null, data);
            })
                .catch(callback);
        }
        set(sid, session, callback) {
            this.azureStoreBase
                .set(sid, session)
                .then(callback)
                .catch(callback);
        }
        destroy(sid, callback) {
            this.azureStoreBase
                .destroy(sid)
                .then(callback)
                .catch(callback);
        }
        touch(sid, session, callback) {
            this.azureStoreBase
                .touch(sid, session)
                .then(callback)
                .catch(callback);
        }
    }
    return AzureStore;
}

;// CONCATENATED MODULE: ./src/db/azure.ts


class azure {
    constructor() {
        this.db = new db_azcosmosdb();
    }
    store(session) {
        const AzureStore = azureStoreFactory(session.Store);
        return new AzureStore({ ttl: 60 * 60 * 24 });
    }
}
/* harmony default export */ const db_azure = (azure);

;// CONCATENATED MODULE: ./src/db/model.ts

const dbprovider =  false ? 0 : new db_azure();
/* harmony default export */ const model = (dbprovider);

;// CONCATENATED MODULE: ./src/server.ts
var _a;







const port = process.env.PORT || 5000;
const isProduction = "production" === "production";
const publicDir = isProduction ? "./public" : "../public";
const app = external_express_default()();
const server_controller = new controller(model.db);
const store = model.store((external_express_session_default()));
app.enable('trust proxy');
app.use(external_express_default().json());
app.use(external_express_default().urlencoded({ extended: true }));
app.use(external_cors_default()());
app.use(external_express_default()["static"](external_path_default().resolve(__dirname, publicDir)));
app.use(external_express_session_default()({
    secret: (_a = process.env.SECRET) !== null && _a !== void 0 ? _a : "",
    store: store,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: isProduction ? true : false,
        httpOnly: true,
        maxAge: 31449600,
        sameSite: isProduction ? "none" : "strict"
    }
}));
app.use((req, res, next) => {
    const passthru = ["/login", "/logout", "/challenge"];
    if (req.session.account || passthru.includes(req.path) || req.method === "GET") {
        next();
    }
    else {
        server_controller.sendErrorResponse(res, new AuthError({ message: "", data: {}, requireLogin: true }));
    }
});
app.get("/", (_req, res) => {
    res.sendFile(external_path_default().resolve(__dirname, publicDir, "index.html"));
});
app.get("/image", async (req, res) => {
    await server_controller.retrieveMedia(req, res);
});
app.get("/video", async (req, res) => {
    await server_controller.retrieveMedia(req, res);
});
app.post("/query", async (req, res) => {
    const username = req.body.username;
    const history = req.body.history;
    const reload = req.body.reload;
    const preview = req.body.preview;
    if (reload) {
        return await server_controller.tryReload(req, res, username, history);
    }
    if (!username) {
        await server_controller.tryRestore(req, res);
    }
    else {
        await server_controller.tryQuery(req, res, username, history, preview);
    }
});
app.post("/querymore", async (req, res) => {
    const user = req.body.user;
    const next = req.body.next;
    const preview = req.body.preview;
    await server_controller.tryQueryMore(req, res, user, next, preview);
});
app.post("/login", async (req, res) => {
    const account = req.body.account;
    const password = req.body.password;
    await server_controller.tryLogin(req, res, account, password);
});
app.post("/challenge", async (req, res) => {
    const account = req.body.account;
    const code = req.body.code;
    const endpoint = req.body.endpoint;
    await server_controller.tryChallenge(req, res, account, code, endpoint);
});
app.post("/logout", async (req, res) => {
    await server_controller.tryLogout(req, res);
});
app.post("/following", async (req, res) => {
    const next = req.body.next;
    await server_controller.tryGetFollowings(req, res, next);
});
app.post("/follow", async (req, res) => {
    const user = req.body.user;
    await server_controller.tryFollow(req, res, user);
});
app.post("/unfollow", async (req, res) => {
    const user = req.body.user;
    await server_controller.tryUnfollow(req, res, user);
});
app.post("/save", async (req, res) => {
    const account = req.session.account;
    const username = req.body.username;
    const rowIndex = req.body.rowIndex;
    await server_controller.trySaveRowIndex(req, res, account, username, rowIndex);
});
app.post("/remove", async (req, res) => {
    const account = req.session.account;
    const history = req.body.history;
    const current = req.body.current;
    const target = req.body.target;
    await server_controller.tryDeleteHistory(req, res, account, current, target, history);
});
app.listen(port, () => {
    console.log(`Start server on port ${port}.`);
});

/******/ })()
;