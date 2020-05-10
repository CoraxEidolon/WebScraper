class ExtractDataBasic {

    #extractData = [];
    #waitTime = 5000;
    #showBrowser = false;
    #siteMap = [];

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

    //#region siteMap
    set siteMap(inputArr) {
        if (Array.isArray(inputArr)) {
            this.#siteMap = inputArr;
        }
    }

    get siteMap() {
        return this.#siteMap;
    }
    //#endregion siteMap

    //#region extractData
    set extractData(inputVal) {
        return false;
    }

    get extractData() {
        return this.#extractData;
    }

    ExtractDataAdd(inputObj) {
        if (typeof inputObj === "object") {
            this.#extractData.push(inputObj);
        }
    }
    //#endregion extractData

    SaveExtractData(fileSavePath) {
        const workWithFiles = require('../workWithFiles/workWithFiles');
        workWithFiles.JSONSaveFromFile(fileSavePath, this.#extractData);
    }
}

module.exports = ExtractDataBasic;