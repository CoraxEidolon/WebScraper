class DataResultList {
  #dataResult = [];
  #index = 0;
  #IsUniqueLink = function (searchValue) {
    if (this.#dataResult.length === 0) {
      return true; //Массив пуст, значит любая ссылка уникальна
    }

    const result = this.#dataResult.filter(v => v.url === searchValue);
    if (result.length > 0) {
      return false; //Найдено совпадение
    } else {
      return true; //Совпадений нет
    }
  }

  ExportToJson = function () {
    let tmpExportData = [];
    const dataResult = this.#dataResult;
    for (let i = 0; i < dataResult.length; ++i) {
      const tmpObj = {
        url: dataResult[i].url,
        visited: dataResult[i].visited,
        data: {
          title: dataResult[i].data.title,
          date: dataResult[i].data.date,
          author: dataResult[i].data.author,
          text: dataResult[i].data.text,
        }
      }
      tmpExportData.push(tmpObj);
    }

    return JSON.stringify(tmpExportData);
  }

  Add(inputObj) {
    if (typeof inputObj !== "object") {
      return;
    }
    if (this.#IsUniqueLink(inputObj.url)) {
      this.#dataResult.push(inputObj);
    }
  }

  GetCurrent() {
    if (this.#dataResult[this.#index]) {
      return this.#dataResult[this.#index];
    } else {
      null;
    }
  }

  GetNext() {
    const nextVal = this.#dataResult[this.#index + 1];
    if (nextVal) {
      this.#dataResult[this.#index].visited = true;
      ++this.#index;
      return nextVal;
    } else {
      return null;
    }
  }
}

module.exports = DataResultList;