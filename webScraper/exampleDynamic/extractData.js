const ExtractDataBasic = require("../basic/extractDataBasic");

class ExtractExampleDynamicData extends ExtractDataBasic  {

    StartExtractData() {
        const _this = this;
        const ResultDataModel = require("./model/resultDataModel");
        let currentPage = null;

        function SaveExtractData() {
            const path = require('path');
            const filePath = path.join(__dirname, "./result/extractData.json");
            _this.SaveExtractData(filePath);
        }


        const Nightmare = require('nightmare');
        let nightmare = Nightmare({ show: _this.showBrowser }); //Открываем копию браузера

        async function ExtractDataFromPage(inputPageObj) {
            currentPage = inputPageObj;
            await nightmare.goto(currentPage.url).wait("body"); //Переходим на страницу и ждем загрузку body

            //#region Скрипты выполняются в браузере             
            const siteData = await nightmare.evaluate(function () {
                const result = {
                    text: document.getElementById("Content").innerText,
                    title: document.getElementById("PageTitle").innerText
                };

                return result;
            });
            //#endregion Скрипты выполняются в браузере

            //Обработка данных с сайта
            if (!siteData) {
                return;
            }

            _this.ExtractDataAdd(siteData);//! ! ! ! ! ! ! ! ! !
            console.log("Получены данные со страницы: " + currentPage.url);

            //Помечаем текущую страницу как посещенную
            currentPage.visited = true;

            //Находим непосещенные страницы       


            const notVisited = _this.siteMap.filter(l => l.visited === false);
            if (notVisited.length === 0) {
                await nightmare.end();
                SaveExtractData();
                return;
            }
   
            await nightmare.wait(_this.waitTime);//Ждем указанное время
            ExtractDataFromPage(notVisited[0]);//Переходим на следующую страницу

        }

        ExtractDataFromPage(_this.siteMap[0]);

    }
}

module.exports = ExtractExampleDynamicData;