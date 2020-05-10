class SiteMapBasic {
    #siteMapFilePath = "";
    #siteMap = [];
    #maxDepth = 10;
    #showBrowser = false;
    #startUrl = "";
    #waitTime = 5000;
    #callbackCreateSiteMap = null;

    /**
     * возвращает true если ссылка уникальна
     * @param {string} newPageLinkStr - ссылка
     */
    #CheckUniqueValue = function (newPageLinkStr) {

        if (!newPageLinkStr) {
            return false;
        }

        if (typeof newPageLinkStr !== "string") {
            return false
        }

        if (this.#siteMap.length === 0) {
            return true;
        }

        const findNewVal = this.#siteMap.find(l => l.url === newPageLinkStr);
        if (findNewVal) {
            return false;
        } else {
            return true;
        }
    }

    SaveSiteMap(fileSavePath) {
        const workWithFiles = require('../workWithFiles/workWithFiles');
        workWithFiles.JSONSaveFromFile(fileSavePath, this.#siteMap);
    }

    ReadSiteMap = function () {
        const path = require('path');
        const filePath = path.join(__dirname, this.#siteMapFilePath);
        const workWithFiles = require('../workWithFiles/workWithFiles');
        const readSiteMap = workWithFiles.JSONReadFromFile(filePath);
        if (!Array.isArray(readSiteMap)) {
            return;
        }
        this.#siteMap = readSiteMap;
    }

    //#region maxDepth
    set maxDepth(inputNum) {
        if (typeof inputNum === "number") {
            this.#maxDepth = inputNum;
        }
    }

    get maxDepth() {
        return this.#maxDepth;
    }
    //#endregion maxDepth

    //#region waitTime
    set waitTime(inputNum) {
        if (typeof inputNum === "number") {
            this.#waitTime = inputNum;
        }
    }

    get waitTime() {
        return this.#waitTime;
    }
    //#endregion waitTime

    //#region showBrowser
    set showBrowser(inputBool) {
        if (typeof inputBool === "boolean") {
            this.#showBrowser = inputBool;
        }
    }

    get showBrowser() {
        return this.#showBrowser;
    }
    //#endregion showBrowser

    //#region startUrl
    set startUrl(inputStr) {
        if (typeof inputStr === "string") {
            this.#startUrl = inputStr;
        }
    }

    get startUrl() {
        return this.#startUrl;
    }
    //#endregion startUrl

    //#region siteMapFilePath
    set siteMapFilePath(inputStr) {
        if (typeof inputStr === "string") {
            this.#siteMapFilePath = inputStr;
        }
    }

    get siteMapFilePath() {
        return this.#siteMapFilePath;
    }
    //#endregion siteMapFilePath

    //#region siteMap
    set siteMap(inputArr) {
        if (Array.isArray(inputArr)) {
            this.#siteMap = inputArr;
        }
    }

    get siteMap() {
        return this.#siteMap;
    }

    SiteMapAddUrl(inputObj) {
        if (typeof inputObj === "object") {
            if (this.#CheckUniqueValue(inputObj.url)) {
                this.#siteMap.push(inputObj);
                return true;
            } else {
                return false;
            }
        }
    }
    //#endregion siteMap

    //#region callbackCreateSiteMap
    set callbackCreateSiteMap(inputFun) {
        if (typeof inputFun === "function") {
            this.#callbackCreateSiteMap = inputFun;
        }
    }

    get callbackCreateSiteMap() {
        return this.#callbackCreateSiteMap;
    }
    //#endregion callbackCreateSiteMap

}

module.exports = SiteMapBasic;