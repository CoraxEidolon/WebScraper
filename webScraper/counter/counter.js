class Counter {
    #counter = 0;
    set counter(inputNum) {
        return;
    }

    get counter() {
        return this.#counter;
    }

    Tick() {
        return ++this.#counter;
    }
}

module.exports = Counter;