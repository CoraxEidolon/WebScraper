const Counter = require("./counter");
const SiteMapModel = require("./siteMapModel");
const SiteMapList = require("./siteMapList");
const DataResultList = require("./dataResultList");
const DataResultModel = require("./dataResultModel");

class ExtractStaticData {
  #request = require("request");
  #cheerio = require('cheerio');
  #rootPage = ""; // Стартовая страница
  #urlPageNormalization = "";// Url для нормализации страницы
  #maxDepth = 10; // Максимальная глубина
  #delayTime = 1000;//Время задержки между новыми запросами
  #siteMapList = new SiteMapList();//Карта сайта
  #counter = new Counter();//Счетчик
  #dataResult = new DataResultList();// Искомые данные

  #UrlPaginationNormalization = function (url) {
    return this.#urlPageNormalization + url;
  }


  #ExtractDataNews = function () {
    const currentPageObj = this.#dataResult.GetCurrent();
    if (!currentPageObj) {
      return;
    }

    console.log("    " + currentPageObj.url);
    this.#request(currentPageObj.url, (function (err, res, body) {
      if (err) throw err;
      if (res.statusCode !== 200) {
        console.log("Статус страницы новости: " + res.statusCode);
        return;
      }

      // парсим DOM
      const $ = this.#cheerio.load(body);
      const titleAndDate = $('.artheader').text(); // Заголовок и дата одной строкой
      const titleAndDateArr = titleAndDate.split("/");// Заголовок(0) и дата(1)
      const dateArr = titleAndDateArr[1].split(".");//День[0], месяц[1], год[2]
      dateArr[0] = Number(dateArr[0]);//День
      dateArr[1] = Number(dateArr[1]) - 1;//Месяц -1 т.к. начинается с 0
      dateArr[2] = Number(dateArr[2]);
      titleAndDateArr[1] = +new Date(dateArr[2], dateArr[1], dateArr[0]);
      const artauthor = $('.artauthor').text();//автор
      const text = $('.arttext').text()//Текст

      currentPageObj.data.title = titleAndDateArr[0].trim();
      currentPageObj.data.date = titleAndDateArr[1];
      currentPageObj.data.author = artauthor.trim();
      currentPageObj.data.text = text.trim();

      if (this.#counter.Tick() >= this.#maxDepth) {
        //Максимальная глубина поиска привышена, завершаем работу
        const workWithFiles = require("../workWithFiles");
        workWithFiles.JSONSaveFromFile("test.json", this.#dataResult.ExportToJson());
        return;
      }

      setTimeout((function () {
        const nextPageNews = this.#dataResult.GetNext();//Получаем следующую ссылку на новость
        if (nextPageNews === null) {
          //Если все стр новостей обработаны получаем новую страницу со списком новостей
          const nextPageNewsList = this.#siteMapList.GetNext();
          if (!nextPageNewsList) {
            //Больше страниц нет, завершаем работу
            const workWithFiles = require("../workWithFiles");
            workWithFiles.JSONSaveFromFile("test.json", this.#dataResult.ExportToJson());
            return;
          }
          this.#ExtractDataFromPage(nextPageNewsList);
          return;
        }else {
          this.#ExtractDataNews();
        }   
      }).bind(this), this.#delayTime);

    }).bind(this));
  }

  #ExtractData = function (err, res, body) {
    if (err) throw err;
    if (res.statusCode !== 200) {
      console.log("Статус страницы: " + res.statusCode);
      return;
    }

    // парсим DOM
    const $ = this.#cheerio.load(body);
    const paginationLinkList = $(".pages a");//Ссылки пагинации
    const newsLinkList = $(".news_headline a");//Ссылки новостей

    // Получаем список ссылок пагинации на странице
    for (let i = 0; i < paginationLinkList.length - 1; ++i) {
      const href = this.#UrlPaginationNormalization($(paginationLinkList[i]).attr("href"));//Извлекаем ссылку
      const paginationLink = new SiteMapModel();
      paginationLink.url = href;
      this.#siteMapList.Add(paginationLink);
    }

    // Получаем список ссылок новостей на странице
    for (let i = 0; i < newsLinkList.length; ++i) {
      const href = $(newsLinkList[i]).attr("href");
      const numberNews = href.replace(/[^\d]/g, "");
      const resultLink = this.#urlPageNormalization + numberNews;
      const newNews = new DataResultModel();
      newNews.url = resultLink;
      this.#dataResult.Add(newNews);
    }

    setTimeout((function () {
      this.#ExtractDataNews();//Получаем данные новостей
    }).bind(this), this.#delayTime);
  }

  #ExtractDataFromPage = function (inputPageObj) {
    if (typeof inputPageObj !== "object") {
      return;
    }
    this.delayTime = 1000;
    console.log("");
    console.log(inputPageObj.url);
    //Делаем запрос на inputPageObj
    this.#request(inputPageObj.url, this.#ExtractData.bind(this));

  }

  //#region rootPage Стартовая страница поиска
  set rootPage(inputUrl) {
    if (typeof inputUrl !== "string") {
      return;
    }
    this.#rootPage = inputUrl;
  }

  get rootPage() {
    return this.#rootPage;
  }
  //#endregion rootPage

  //#region maxDepth Максимальная глубина поиска (количество итераций)
  set maxDepth(inputNum) {
    if (typeof inputNum !== "number") {
      return;
    }
    this.#maxDepth = inputNum;
  }

  get maxDepth() {
    return this.#maxDepth;
  }
  //#endregion

  //#region urlPageNormalization
  set urlPageNormalization(inputStr) {
    if (typeof inputStr !== "string") {
      return;
    }
    this.#urlPageNormalization = inputStr;
  }

  get urlPageNormalization() {
    return this.#urlPageNormalization;
  }
  //#endregion urlPageNormalization

  StartExtractData() {
    const startPage = new SiteMapModel();
    startPage.url = this.#rootPage;
    this.#siteMapList.Add(startPage);
    const currentPage =  this.#siteMapList.GetCurrent();
    this.#ExtractDataFromPage(currentPage);
  }

}


const ExtractStaticDataObj = new ExtractStaticData();
ExtractStaticDataObj.rootPage = "http://tsu.tula.ru/news/all/?skip=0";
ExtractStaticDataObj.urlPageNormalization = "http://tsu.tula.ru/news/all/";
ExtractStaticDataObj.maxDepth = 100;
ExtractStaticDataObj.delayTime = 300;
ExtractStaticDataObj.StartExtractData();