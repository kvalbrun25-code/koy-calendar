import { SB, SK } from "./config";
function dispatchAuthEvt(name){if(typeof window!=="undefined"&&typeof window.dispatchEvent==="function"&&typeof CustomEvent!=="undefined")window.dispatchEvent(new CustomEvent(name))}
var __sessExpired=false;
function sessionMarkExpired(){if(__sessExpired)return;__sessExpired=true;clearAuth();dispatchAuthEvt("koyAuthExpired")}
function sessionMarkActive(){__sessExpired=false}
function refreshSession(rt){if(!rt)return Promise.resolve(null);return fetch(SB+"/auth/v1/token?grant_type=refresh_token",{method:"POST",headers:{"Content-Type":"application/json","apikey":SK},body:JSON.stringify({refresh_token:rt})}).then(function(r){if(!r.ok)return null;return r.json().catch(function(){return null})}).catch(function(){return null})}
function loadAuth(){if(typeof window==="undefined")return null;try{return JSON.parse(localStorage.getItem("koyAuth")||"null")}catch(e){return null}}
function saveAuth(a){__session=a||null;if(typeof window==="undefined")return;try{localStorage.setItem("koyAuth",JSON.stringify(a))}catch(e){}}
function clearAuth(){__session=null;if(typeof window==="undefined")return;try{localStorage.removeItem("koyAuth")}catch(e){}}
var __session=loadAuth()||null;
function getToken(){return __session&&__session.token}
function getRefreshToken(){return __session&&__session.refresh_token}
function getSessionUser(){return __session&&__session.user}
export { loadAuth, saveAuth, clearAuth, getToken, getRefreshToken, getSessionUser, sessionMarkExpired, sessionMarkActive, refreshSession, dispatchAuthEvt };
