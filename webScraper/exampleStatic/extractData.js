const ExtractDataBasic = require("../basic/extractDataBasic");

class ExtractData extends ExtractDataBasic {

    StartExtractData(){
        const _this = this;
        const request = require("request");
        const cheerio = require("cheerio");
        const ResultDataModel = require("./model/resultDataModel");
        let currentPage = null;


    
        function SaveExtractData() {
            const path = require('path');
            const filePath = path.join(__dirname, "./result/extractData.json");
            _this.SaveExtractData(filePath);
        }

        function ExtractData(err, res, body) {
            if (err) throw err;
            if (res.statusCode !== 200) {
                console.log("Статус страницы: " + res.statusCode);
                return;
            }

            // парсим DOM
            const $ = cheerio.load(body);
            const titlePage = $('#PageTitle').text(); // Заголовок и дата одной строкой
            const textPage = $('#Content').text()//Текст
      
            const extractExampleData = ResultDataModel();
            extractExampleData.title = titlePage.trim();
            extractExampleData.text = textPage.trim();

            _this.ExtractDataAdd(extractExampleData);

            //Помечаем текущую страницу как посещенную
            currentPage.visited = true;
            //Находим непосещенные страницы
            const notVisited = _this.siteMap.filter(l => l.visited === false);
            if (notVisited.length === 0) {
                SaveExtractData();
                return;
            }
            
            setTimeout((function () {
                ExtractDataFromPage(notVisited[0]);
            }), _this.waitTime);
        }

        function ExtractDataFromPage(inputPageObj) {
            currentPage = inputPageObj;
            console.log("Получение данных с страницы: "+ inputPageObj.url);
            //Делаем запрос на стартовую страницу
            request(inputPageObj.url, ExtractData);
        }

        // Начинаем получать данные с первой страницы
        ExtractDataFromPage(_this.siteMap[0]);
    }
    
}

module.exports = ExtractData;