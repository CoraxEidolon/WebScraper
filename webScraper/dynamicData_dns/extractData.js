class ExtractDynamicData {

    constructor() {
    }

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
    //#endregion extractData

    #SaveExtractData = function () {
        const path = require('path');
        const filePath = path.join(__dirname, './result/extractData.json');
        const workWithFiles = require('../workWithFiles/workWithFiles');
        workWithFiles.JSONSaveFromFile(filePath, this.#extractData);
    }

    StartExtractData = async function () {

        if (this.#siteMap.length === 0) {
            return;
        }

        const Nightmare = require('nightmare');
        let nightmare;
        try {
            nightmare = Nightmare({ show: this.#showBrowser });

            for (let i = 0; i < this.#siteMap.length; ++i) {
                console.log("Получение данных, страница: " + this.#siteMap[i].url);
                await nightmare.goto(this.#siteMap[i].url);
                await nightmare.wait("body");
                //получаем данные с страницы
                const siteData = await nightmare.evaluate(function () {
                    //#region js на сайте
                    const result = {};
                    result.title = document.getElementsByClassName("page-title price-item-title")[0].innerText.trim();
                    result.description = document.getElementsByClassName("price-item-description")[1].innerText.trim();
                    result.price = document.getElementsByClassName("current-price-value")[0].innerText.trim();
                    return result;
                    //#endregion js на сайте
                });
                //Обработка данных с сайта
                if (!siteData) {
                    break;
                }

                this.#extractData.push(siteData);
                console.log("    Данные успешно получены");
                await nightmare.wait(this.#waitTime);
            }//for i
            this.#SaveExtractData();
        } catch (error) {
            console.error(error);
            this.#SaveExtractData();
            throw error;
        } finally {
            await nightmare.end();
            this.#SaveExtractData();
        }
    }
}

module.exports = ExtractDynamicData;