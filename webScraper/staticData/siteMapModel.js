class SiteMapModel {
  #url = "";
  #visited = false;

  // url
  set url(inputStr) {
    if (typeof inputStr !== "string") {
      return;
    }
    this.#url = inputStr;
  }

  get url() {
    return this.#url;
  }

  // visited
  set visited(inputBool) {
    return;
  }

  get visited() {
    return this.#visited;
  }

}

module.exports = SiteMapModel;