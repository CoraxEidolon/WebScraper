class DataResultModel {
    #url = "";
    #visited = false;
  
    constructor() {
      this.data = new class {
        #title = "";
        #date = +new Date();
        #author = "";
        #text = "";
  
        //title
        set title(inputStr) {
          if (typeof inputStr !== "string") {
            return;
          }
          this.#title = inputStr;
        }
  
        get title() {
          return this.#title;
        }
  
        //date
        set date(inputNum) {
          if (typeof inputNum !== "number") {
            return;
          }
          this.#date = inputNum;
        }
  
        get date() {
          return this.#date;
        }
  
        //author
        set author(inputStr) {
          if (typeof inputStr !== "string") {
            return;
          }
          this.#author = inputStr;
        }
  
        get author() {
          return this.#author;
        }
  
        //text
        set text(inputStr) {
          if (typeof inputStr !== "string") {
            return;
          }
          this.#text = inputStr;
        }
  
        get text() {
          return this.#text;
        }
      }
    }
  
    // url
    set url(inputUrl) {
      if (typeof inputUrl !== "string") {
        return;
      }
      this.#url = inputUrl;
    }
  
    get url() {
      return this.#url;
    }
  
    // visited
    set visited(inputBool) {
      if (typeof inputBool !== "boolean") {
        return;
      }
      this.#visited = inputBool;
    }
  
    get visited() {
      return this.#visited;
    }
  }

  module.exports = DataResultModel;