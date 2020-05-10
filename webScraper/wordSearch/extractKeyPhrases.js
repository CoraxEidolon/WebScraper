class ExtractKeyPhrases {
    #natural = require('natural');
    #searchWords = []; //Список слов для поиска
    #text = "";//текст для анализа
    #searchThreshold = 0.7; //Порог уникальности для найденных слов

    /**
     * Осуществляет нормализацию текста
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
     * Остааляет только уникальные значения массива. 
     * @param {Array} inputArr  - массив в котором нужно оставить только уникальные значения
     */
    #UniqueArrVal = function (inputArr) {
        if (!Array.isArray(inputArr)) {
            return null;
        }
        return Array.from(new Set(inputArr));
    }

    /**
     * определяет язык полученного текста, возвращает массив найденных языков
     * @param {string} inputText  - текст для поиска
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
     * Удаляет стоп слова из массива токенов заданного языка. Возвращает массив токенов без стоп стов.
     * @param {Array} tokensArr - массив токенов
     * @param {Array} langArr - список языков
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
     * @param {Array} tokensArr - массив токенов
     */
    #PorterStemmer = function (tokensArr) {

        if (!Array.isArray(tokensArr)) {
            return null;
        }
        const _this = this;
        const LANG = {
            rus: function (inputToken) {
                return _this.#natural.PorterStemmerRu.stem(inputToken);
            },

            eng: function (inputToken) {
                return _this.#natural.PorterStemmer.stem(inputToken);
            }
        }

        for (let i = 0; i < tokensArr.length; ++i) {
            const langTokenArr = this.#DefineLanguageText(tokensArr[i]);
            const langToken = langTokenArr[0];

            if (LANG.hasOwnProperty(langToken)) {
                tokensArr[i] = LANG[langToken](tokensArr[i]);
            }
        }
        return tokensArr;
    }

    /**
     * Считает Tf-idf для переданного массива токенов
     * @param {Array} tokensArr - массив токенов
     * @param {string} textForSearch - тест для поиска
     */
    #CountTfidf = function (tokensArr, textForSearch) {
        if (!Array.isArray(tokensArr)) {
            return null;
        }
        const TfIdf = this.#natural.TfIdf;
        const tfidf = new TfIdf();
        const tokensArrStr = [];
        for (let i = 0; i < tokensArr.length; ++i) {
            tokensArrStr.push(tokensArr[i].join(" "));
        }

        tfidf.addDocument(textForSearch);
        const tokensMeasure = [];
        for (let i = 0; i < tokensArrStr.length; ++i) {
            tfidf.tfidfs(tokensArrStr[i], function (k, measure) {
                tokensMeasure.push(
                    JSON.stringify({
                        token: tokensArrStr[i],
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
     * Осуществляет нормализацию полученных значений tf-idf. Принимает массив токенов с величеной tf-idf
     * @param {Array} inputArr 
     */
    #NormalizationValue = function (inputArr) {
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
    #NormalizationSearchWords =  function () {
        if (this.#searchWords.length === 0) {
            return null;
        }

        const tokenizer = new this.#natural.WordTokenizer();
        const resultNormalizationText = [];
        //Нормализуем все ключевые фразы
        for (let i = 0; i < this.#searchWords.length; ++i) {
            const normalizationText = this.#NormalizationText(this.#searchWords[i]);//Нормализуем текст   
            const langTextArr = this.#DefineLanguageText(normalizationText);// Определяем языки в тексте   
            const tokens = tokenizer.tokenize(normalizationText); //Разбиваем на токены
            const tokensWithoutStopWord = this.#DeleteStopWords(tokens, langTextArr); //Удаляем стоп слова
            const porterStemmer = this.#PorterStemmer(tokensWithoutStopWord);    
            resultNormalizationText.push(porterStemmer);
        }

        return resultNormalizationText;
    }

    /**
     * Определяет длину N-грамы. Возвращает массив уникальных длин
     * @param {Array} inputArr - массив N-грам
     */
    #LengthNGrams = function (inputArr) {
        if (!Array.isArray(inputArr)) {
            return;
        }

        let lengthNGrams = [];
        for (let i = 0; i < inputArr.length; ++i) {
            lengthNGrams.push(inputArr[i].length);
        }
        lengthNGrams = this.#UniqueArrVal(lengthNGrams);//Оставляем только уникальные значения
        return lengthNGrams;
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
        const nGrams = this.#natural.NGrams;
        const tokenizer = new this.#natural.WordTokenizer();
        const textForSearchNorm = this.#NormalizationText(this.#text);//Нормализуем текст
        const normalizationSearchWords = this.#NormalizationSearchWords();//Нормализуем ключевые фразы
        const lengthNGramsArr = this.#LengthNGrams(normalizationSearchWords);//Определяем длины будущих ngram
        const LANG_TEXT_ARR = this.#DefineLanguageText(textForSearchNorm);// Определяем языки в тексте    
        const tokens = tokenizer.tokenize(textForSearchNorm); //Разбиваем на токены
        const tokensWithoutStopWord = this.#DeleteStopWords(tokens, LANG_TEXT_ARR); //Удаляем стоп слова
        const tokensWordBasis = this.#PorterStemmer(tokensWithoutStopWord); // Стеммер Портера, выделяем основы слов
        const textForSearch = tokensWordBasis.join(" ");

        let resultRating = [];
        for (let i = 0; i < lengthNGramsArr.length; ++i) {
            const nGramsTmp = nGrams.ngrams(tokensWordBasis, lengthNGramsArr[i]);
            const tfidfTmp = this.#CountTfidf(nGramsTmp, textForSearch);
            const resultTfidfNormalizationValue = this.#NormalizationValue(tfidfTmp);
            resultRating.push(resultTfidfNormalizationValue);
        }
        console.log(resultRating);


   
        /*const resultKeywords = [];
        for (let i = 0; i < resultTfidfNormalizationValue.length; ++i) {
            if (resultTfidfNormalizationValue[i].rating >= this.#searchThreshold) {
                for (let j = 0; j < normalizationSearchWords.length; ++j) {
                    if (normalizationSearchWords[j] === resultTfidfNormalizationValue[i].token) {
                        resultKeywords.push(resultTfidfNormalizationValue[i]);
                        continue;
                    }
                }
            }
        }
        return resultKeywords;*/
    }
}
const text = "Я хочу вам рассказать про своего кота, которого зовут совершенно обычно - Мурзик. Я подобрал его на улице совсем крошечным котёнком, когда шёл из школы домой. Несмотря на свои размеры, этот крошечный комочек обладал весьма громким голосом и ел так, что вскоре стал похож на пушистый шарик с тоненьким хвостиком. Котик очень долго почему-то совсем не рос, и мы уже решили, что, видимо, он какой-нибудь миниатюрной породы, но в какой-то момент он вдруг превратился в большого красавца-кота с умными зелёными глазами. Мой кот очень ласковый, забавный и умный. Он всегда каким-то образом узнаёт, когда я иду со школы. Когда дверь открывается, он выбегает мне навстречу, трётся об мои ноги и громко мяукает, как будто говорит, как сильно он скучал по мне. Он любит играть со мной в прятки и догонялки и всегда меня находит, где бы я ни прятался. Утром кот встает раньше  всех и пытается разбудить кого-нибудь, так он просит, чтобы его покормили. Мой кот, не просто домашнее животное, а член семьи, и я очень его люблю. Уже поздно и мне пора спать, вот и мой любимый Мурзик, как обычно,  тоже укладывается на подушке рядом со мной, громко мурлыча. Спокойной ночи, котик! Завтра нас ждёт новый день.";
const extractKeyPhrasesObj = new ExtractKeyPhrases();
extractKeyPhrasesObj.text = text;
extractKeyPhrasesObj.AddSearchWordsList(["Я хочу вам рассказать", "текст про кота", "ПрО коТа текст", "этот крошечный комочек", "Он всегда каким-то образом узнаёт"]);
extractKeyPhrasesObj.GetKeyWordList();