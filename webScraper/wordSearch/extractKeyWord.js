class ExtractKeyWord {
    #natural = require('natural');
    #searchWords = []; //массив слов для поиска
    #text = ""; //Текст в котором будео осуществляться поиск
    #searchThreshold = 0.7;//Порог уникальности

    /**
     * Осуществляет нормализацию текста. Возвращает нормализованный текст
     * @param {string} textForNormalization 
     */
    #NormalizationText = function (textForNormalization) {
        if (typeof textForNormalization !== "string") {
            return;
        }

        let result = textForNormalization.replace(/[^a-zA-ZА-ЯЁа-яё\s]/g, "");//Убираем все кроме русских и английских символов
        result = result.replace(/[ё]/g, "е");
        result = result.replace(/\s+.?\s+/g, " ");//Удаляем все предлоги
        result = result.toLowerCase();
        result = result.replace(/\s+/g, " "); //Оставояем только один пробел
        result = result.trim();
        return result;
    }

    /**
     * Принимает массив, оставляет только уникальные значения
     * @param {Array} inputArr 
     */
    #UniqueArrVal = function (inputArr) {
        if (!Array.isArray(inputArr)) {
            return null;
        }
        return Array.from(new Set(inputArr));
    }

    /**
     * Принимает текст, определяет языки содержащиеся в тексте, возвращает массив найденных языков
     * @param {string} inputText 
     */
    #DefineLanguageText = function (inputText) {
        const LANG = {
            rus: function (checkText) {
                return /[А-ЯЁа-яё]/g.test(checkText);
            },
            eng: function (checkText) {
                return /[a-zA-Z]/g.test(checkText);
            }
        }

        let resultLangList = [];
        for (const langKey in LANG) {
            if (LANG[langKey](inputText)) {
                resultLangList.push(langKey);
            }
        }

        return resultLangList;
    }

    /**
     * Удаляет стоп слова заданных языков из полученного массива токенов
     * @param {Array} tokensArr - массив токенов (слов)
     * @param {Array} langArr - массив языков
     */
    #DeleteStopWords = function (tokensArr, langArr = ["rus"]) {
        if (!Array.isArray(tokensArr)) {
            return null;
        }

        if (!Array.isArray(langArr)) {
            return null;
        }

        const sw = require("stopword");
        const LANG = {
            rus: function (inputTokens) {
                return sw.removeStopwords(inputTokens, sw.ru);
            },

            eng: function (inputTokens) {
                return sw.removeStopwords(inputTokens, sw.en);
            }
        }

        let result = tokensArr;
        for (let i = 0; i < langArr.length; ++i) {
            if (LANG.hasOwnProperty(langArr[i])) {
                result = LANG[langArr[i]](result);
            }
        }
        return result;
    }
   
    /**
     * Осуществляет Стеммер Портера. Возвращает обработанный массив токенов
     * @param {Array} tokensArr 
     */
    #PorterStemmer = function (tokensArr) {

        if (!Array.isArray(tokensArr)) {
            return null;
        }
        const tokensArrCopy = JSON.parse(JSON.stringify(tokensArr));

        const _this = this;
        const LANG = {
            rus: function (inputToken) {
                return _this.#natural.PorterStemmerRu.stem(inputToken);
            },

            eng: function (inputToken) {
                return _this.#natural.PorterStemmer.stem(inputToken);
            }
        }

        for (let i = 0; i < tokensArrCopy.length; ++i) {
            const langTokenArr = this.#DefineLanguageText(tokensArrCopy[i]);
            const langToken = langTokenArr[0];

            if (LANG.hasOwnProperty(langToken)) {
                tokensArrCopy[i] = LANG[langToken](tokensArrCopy[i]);
            }
        }
        return {
            original: tokensArr,
            porterStemmer: tokensArrCopy
        }
    }

    /**
     * Вычисляет Tf-idf для каждого переданного токена. Возвращает массив токенов с величеной Tf-idf
     * @param {Array} tokensArr - массив токенов
     */
    #CountTfidf = function (tokensArr) {
        if (!Array.isArray(tokensArr)) {
            return null;
        }
        const TfIdf = this.#natural.TfIdf;
        const tfidf = new TfIdf();

        tfidf.addDocument(tokensArr);
        const tokensMeasure = [];
        for (let i = 0; i < tokensArr.length; ++i) {
            tfidf.tfidfs(tokensArr[i], function (k, measure) {
                tokensMeasure.push(
                    JSON.stringify({
                        token: tokensArr[i],
                        tfidf: measure
                    }));
            });
        }
        const result = this.#UniqueArrVal(tokensMeasure);

        for (let i = 0; i < result.length; ++i) {
            result[i] = JSON.parse(result[i]);
        }

        result.sort((a, b) => a.tfidf > b.tfidf ? -1 : 1);
        return result;
    }

    /**
     * Производит нормализацию значений Tf-idf 
     * @param {Array} inputArr - массив токенов с величеной Tf-idf 
     */
    #NormalizationValue =  function (inputArr) {
        if (!Array.isArray(inputArr)) {
            return null;
        }

        if (inputArr.length <= 1) {
            return null;
        }

        const max = inputArr[0].tfidf;
        const min = inputArr[inputArr.length - 1].tfidf;
        for (let i = 0; i < inputArr.length; ++i) {
            inputArr[i].rating = (inputArr[i].tfidf - min) / (max - min);
        }
        return inputArr;
    }

    /**
     * Производит нормализацию слов для поиска
     */
    #NormalizationSearchWords = function () {
        const t = this.#searchWords;
        if (this.#searchWords.length === 0) {
            return null;
        }

        const resultNormalizationText = [];
        //Нормализуем все ключевые слова
        for (let i = 0; i < this.#searchWords.length; ++i) {
            const tmp = this.#NormalizationText(this.#searchWords[i]);
            resultNormalizationText.push(tmp);
        }

        const resultPorterStemmer = this.#PorterStemmer(resultNormalizationText);
        return resultPorterStemmer;
    }

    //#region SearchWords
    AddSearchWordsList(inputArr) {
        if (!Array.isArray(inputArr)) {
            return;
        }
        this.#searchWords = this.#searchWords.concat(inputArr);
    }

    ClearSearchWordsList() {
        this.#searchWords = [];
    }
    //#endregion SearchWords

    //#region text
    set text(inputStr) {
        if (typeof inputStr !== "string") {
            return;
        }
        this.#text = inputStr;
    }

    get text() {
        return this.#text = inputStr;
    }
    //#endregion text

    //#region searchThreshold

    set searchThreshold(inputNum) {
        if (typeof inputNum !== "number") {
            return;
        }
        if (inputNum > 1 || inputNum < 0) {
            return;
        }

        this.#searchThreshold = inputNum;
    }

    get searchThreshold() {
        return this.#searchThreshold;
    }

    //#endregion searchThreshold

    GetKeyWordList() {
        const tokenizer = new this.#natural.WordTokenizer();
        const textForSearch = this.#NormalizationText(this.#text);//Нормализуем текст  
        const LANG_TEXT_ARR = this.#DefineLanguageText(textForSearch);// Определяем языки в тексте
        const tokens = tokenizer.tokenize(textForSearch); //Разбиваем на токены
        const tokensWithoutStopWord = this.#DeleteStopWords(tokens, LANG_TEXT_ARR); //Удаляем стоп слова
        const tokensWordBasis = this.#PorterStemmer(tokensWithoutStopWord); // Стеммер Портера, выделяем основы слов
        const resultTfidf = this.#CountTfidf(tokensWordBasis.porterStemmer);
        const resultTfidfNormalizationValue = this.#NormalizationValue(resultTfidf);
        
        const normalizationSearchWords = this.#NormalizationSearchWords();
        const resultKeywords = [];
        for (let i = 0; i < resultTfidfNormalizationValue.length; ++i) {
            if (resultTfidfNormalizationValue[i].rating >= this.#searchThreshold) {
                for (let j = 0; j < normalizationSearchWords.porterStemmer.length; ++j) {
                    if (normalizationSearchWords.porterStemmer[j] === resultTfidfNormalizationValue[i].token) {
                        resultKeywords.push(normalizationSearchWords.original[j]);
                        continue;
                    }
                }
            }
        }
        return resultKeywords;
    }
}
const text = "Я хочу вам рассказать про своего кота, которого зовут совершенно обычно - Мурзик. Я подобрал его на улице совсем крошечным котёнком, когда шёл из школы домой. Несмотря на свои размеры, этот крошечный комочек обладал весьма громким голосом и ел так, что вскоре стал похож на пушистый шарик с тоненьким хвостиком. Котик очень долго почему-то совсем не рос, и мы уже решили, что, видимо, он какой-нибудь миниатюрной породы, но в какой-то момент он вдруг превратился в большого красавца-кота с умными зелёными глазами. Мой кот очень ласковый, забавный и умный. Он всегда каким-то образом узнаёт, когда я иду со школы. Когда дверь открывается, он выбегает мне навстречу, трётся об мои ноги и громко мяукает, как будто говорит, как сильно он скучал по мне. Он любит играть со мной в прятки и догонялки и всегда меня находит, где бы я ни прятался. Утром кот встает раньше  всех и пытается разбудить кого-нибудь, так он просит, чтобы его покормили. Мой кот, не просто домашнее животное, а член семьи, и я очень его люблю. Уже поздно и мне пора спать, вот и мой любимый Мурзик, как обычно,  тоже укладывается на подушке рядом со мной, громко мурлыча. Спокойной ночи, котик! Завтра нас ждёт новый день.";
const extractKeyWordObj = new ExtractKeyWord();
extractKeyWordObj.text = text;
extractKeyWordObj.AddSearchWordsList(["извлечение", "вебсайт", "методика", "кот"]);
extractKeyWordObj.GetKeyWordList();