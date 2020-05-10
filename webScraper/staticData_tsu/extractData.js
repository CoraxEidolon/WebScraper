const ExtractDataBasic = require("../basic/extractDataBasic");

class ExtractData extends ExtractDataBasic {

    ExtractDataNews(){
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
            const titleAndDate = $('.artheader').text(); // Заголовок и дата одной строкой
            const titleAndDateArr = titleAndDate.split("/");// Заголовок(0) и дата(1)
            const dateArr = titleAndDateArr[1].split(".");//День[0], месяц[1], год[2]
            dateArr[0] = Number(dateArr[0]);//День
            dateArr[1] = Number(dateArr[1]) - 1;//Месяц -1 т.к. начинается с 0
            dateArr[2] = Number(dateArr[2]);
            titleAndDateArr[1] = +new Date(dateArr[2], dateArr[1], dateArr[0]);
            const artauthor = $('.artauthor').text();//автор
            const text = $('.arttext').text()//Текст
      
            const extractNewsData = ResultDataModel();

            extractNewsData.title = titleAndDateArr[0].trim();
            extractNewsData.date = titleAndDateArr[1];
            extractNewsData.author = artauthor.trim();
            extractNewsData.text = text.trim();

            _this.ExtractDataAdd(extractNewsData);

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

        //Добавляем стартовую страницу к списку пагинации


        ExtractDataFromPage(_this.siteMap[0]);
    }
    
}

module.exports = ExtractData;