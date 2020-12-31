var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/* Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org */
var medicinejava;
(function (medicinejava) {
    var Logic = (function () {
        function Logic() {
            /**
             * number of incorrect answers to generate
             */
            this.N = 4;
            /**
             * Choose a random item as the root
             */
            this.randomroot = false;
            /**
             * Restrict possible roots to items with proper ultimate parents
             */
            this.restrRoot = false;
            /**
             * Restrict possible stems to items with proper ultimate parents
             */
            this.restrChoice = false;
            /**
             * Include descriptions in the reasoning
             */
            this.INCLUDE_DESCRIPTION = true;
            /**
             * permitted direction for question
             */
            this.DIRECTIONS = [medicinejava.Entity.CAUSE, medicinejava.Entity.EFFECT, medicinejava.Entity.TREATMENTS, medicinejava.Entity.TREATS];
            /**
             *
             * an array of pairs of strings that wrap the root entity;
             * currently one pair for each direction of questioning.
             */
            this.questionHead = [["Which of the following is most likely to be the cause of ", "?"], ["Which of the following are commonly associated with ", "?"], ["Which of the following might be used to treat ", "?"], ["Which of the following is most likely to be treated with ", "?"]];
            /**
             * set of entities that could be used as incorrect answers
             */
            this.currentBank = ([]);
            if (this.ed === undefined)
                this.ed = null;
            if (this.seed === undefined)
                this.seed = null;
            if (this.incorrect === undefined)
                this.incorrect = null;
            if (this.infoText === undefined)
                this.infoText = null;
            if (this.infoIncor === undefined)
                this.infoIncor = null;
            if (this.infoCorrect === undefined)
                this.infoCorrect = null;
            if (this.q === undefined)
                this.q = null;
        }
        Logic.MODE_NAMES_$LI$ = function () { if (Logic.MODE_NAMES == null)
            Logic.MODE_NAMES = ["Random typed", "Random related", "Random.", "Looks similar", "Brother of correct", "Brother of root"]; return Logic.MODE_NAMES; };
        ;
        /**
         * create a question, with new root, new correct, and store it in q.
         * @param {number} mode
         */
        Logic.prototype.newQuestion = function (mode) {
            var _this = this;
            this.q = new medicinejava.Question();
            if (this.randomroot) {
                var ok = false;
                while ((!ok)) {
                    {
                        this.q.root = this.ed.getRandomEntity();
                        ok = (function (lhs, rhs) { return lhs || rhs; })(!this.restrRoot, medicinejava.Entities.hasAStandardUltimateParent(this.q.root));
                    }
                }
                ;
            }
            else{
                this.q.root = this.seed;
            }
            this.seed = this.q.root;
            this.q.mode = mode;
            var d1;
            var d2;
            var attempt = 0;
            var numposs = 0;
            do {
                {
                    this.q.direction = (Math.floor(Math.random() * this.DIRECTIONS.length) | 0);
                    d1 = this.DIRECTIONS[this.q.direction];
                    d2 = medicinejava.Entity.inverseOf(d1);
                    this.q.head = this.questionHead[this.q.direction][0] + this.q.root + this.questionHead[this.q.direction][1];
                    numposs = this.q.root.listOf(d1).length;
                }
            } while ((numposs === 0 && attempt++ < 10));
            if (attempt >= 10)
                throw Object.defineProperty(new Error("Unable to find any questions for " + this.q.root), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.IllegalStateException', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.Exception'] });
            var corrStem = new medicinejava.Stem();
            /* add */ (this.q.correctStem.push(corrStem) > 0);
            corrStem.correct = true;
            var correct = Entity.fromJSON( 
              this.q.root.listOf(d1)[(Math.floor(Math.random() * numposs) | 0)] );
            corrStem.entity = correct;
            var correctTypeT = medicinejava.Entities.getUltimateParents(correct);
            var corrD2 = correct.listOf(d2);
            /* remove */ (function (a) { var index = a.indexOf(_this.q.root); if (index >= 0) {
                a.splice(index, 1);
                return true;
            }
            else {
                return false;
            } })(corrD2);
            var rel1 = d1 === medicinejava.Entity.CAUSE ? "Causes" : d1 === medicinejava.Entity.EFFECT ? "Effects" : d1 === medicinejava.Entity.TREATMENTS ? "Treatments" : d1 === medicinejava.Entity.TREATS ? "Uses" : "ERROR";
            var rel2 = d1 === medicinejava.Entity.CAUSE ? "can cause" : d1 === medicinejava.Entity.EFFECT ? "can be caused by" : d1 === medicinejava.Entity.TREATMENTS ? "can treat" : "can be treated by";
            var rel3 = d1 === medicinejava.Entity.CAUSE ? "Effects" : d1 === medicinejava.Entity.EFFECT ? "Causes" : d1 === medicinejava.Entity.TREATMENTS ? "Uses" : "Treatments";
            corrStem.reasoning = rel1 + " of " + this.q.root + " include " + medicinejava.Entities.listToText(this.q.root.listOf(d1)) + ". \n";
            if (corrD2.length > 0)
                corrStem.reasoning += correct + " also " + rel2 + " " + medicinejava.Entities.listToText(corrD2) + ".";
            if (this.INCLUDE_DESCRIPTION)
                corrStem.reasoning += '\n' + this.q.root.description;
            this.incorrect = (function (s) { var a = []; while (s-- > 0)
                a.push(null); return a; })(this.N);
            this.infoIncor = (function (s) { var a = []; while (s-- > 0)
                a.push(null); return a; })(this.N);
            for (var i = 0; i < this.N; i++) {
                {
                    var s = this.newIncorrect$medicinejava_Entity_A$medicinejava_Entity$medicinejava_Entity$int$int(this.incorrect, this.q.root, correct, this.q.direction, this.q.mode);
                    /* add */ (this.q.errorStems.push(s) > 0);
                    this.incorrect[i] = s.entity;
                }
                ;
            }
            this.infoText = "Incorrect answers are all " + this.infoText;
        };
        Logic.prototype.newIncorrect$medicinejava_Entity_A$medicinejava_Entity$medicinejava_Entity$int$int = function (exclude, root, correct, dirn, mode) {
            var attempt = 0;
            var isOK = false;
            var s = null;
            while ((attempt++ < 100 && !isOK)) {
                {
                    s = this.newIncorrect$medicinejava_Entity$medicinejava_Entity$int$int(root, correct, dirn, mode);
                    isOK = true;
                    for (var i = 0; i < exclude.length; i++) {
                        {
                            if (s.entity === exclude[i])
                                isOK = false;
                        }
                        ;
                    }
                }
            }
            ;
            if (!isOK)
                throw new Logic.TryAgain();
            return s;
        };
        /**
         * choose a single new incorrect item that isn't in Exclude.
         * dirn is the direction to move from the root entity in order to find alternatives.
         * mode is an index of the MODE_NAMES above
         * @param {Array} exclude
         * @param {medicinejava.Entity} root
         * @param {medicinejava.Entity} correct
         * @param {number} dirn
         * @param {number} mode
         * @return {medicinejava.Stem}
         */
        Logic.prototype.newIncorrect = function (exclude, root, correct, dirn, mode) {
            if (((exclude != null && exclude instanceof Array && (exclude.length == 0 || exclude[0] == null || (exclude[0] != null && exclude[0] instanceof medicinejava.Entity))) || exclude === null) && ((root != null && root instanceof medicinejava.Entity) || root === null) && ((correct != null && correct instanceof medicinejava.Entity) || correct === null) && ((typeof dirn === 'number') || dirn === null) && ((typeof mode === 'number') || mode === null)) {
                return this.newIncorrect$medicinejava_Entity_A$medicinejava_Entity$medicinejava_Entity$int$int(exclude, root, correct, dirn, mode);
            }
            else if (((exclude != null && exclude instanceof medicinejava.Entity) || exclude === null) && ((root != null && root instanceof medicinejava.Entity) || root === null) && ((typeof correct === 'number') || correct === null) && ((typeof dirn === 'number') || dirn === null) && mode === undefined) {
                return this.newIncorrect$medicinejava_Entity$medicinejava_Entity$int$int(exclude, root, correct, dirn);
            }
            else
                throw new Error('invalid overload');
        };
        Logic.prototype.newIncorrect$medicinejava_Entity$medicinejava_Entity$int$int = function (root, correct, dirn, mode) {
            var stem = new medicinejava.Stem();
            stem.correct = false;
            var d1 = this.DIRECTIONS[dirn];
            var d2 = medicinejava.Entity.inverseOf(d1);
            var rel1 = d1 === medicinejava.Entity.CAUSE ? "Causes" : "Effects";
            var rel2 = d1 === medicinejava.Entity.CAUSE ? "can cause" : "can be caused by";
            var rel3 = d1 === medicinejava.Entity.CAUSE ? "Effects" : "Causes";
            var rel4 = d1 === medicinejava.Entity.CAUSE ? "can be caused by" : "can cause";
            if (mode === Logic.MODE_RANDOM_TYPED || mode === Logic.MODE_RANDOM_RELATED || mode === Logic.MODE_COMPLETELY_RANDOM) {
                if (correct.parents.length === 0)
                    throw new Logic.TryAgain();
                var correctType1 = correct.parents[0];
                var correctType2 = null;
                if (correctType1.parents.length > 0 && Math.random() > 0.5)
                    correctType2 = correctType1.parents[0];
                var correctType0 = medicinejava.Entities.getUltimateParents(correct);
                var tmp = void 0;
                var attempt = 0;
                var sametype = false;
                do {
                    {
                        tmp = this.ed.getRandomEntity();
                        if (mode === Logic.MODE_RANDOM_RELATED) {
                            if (tmp.parents.length === 0)
                                sametype = false;
                            else {
                                var tmpp = tmp.parents[0];
                                sametype = tmpp === correctType1;
                            }
                            stem.reasoning = tmp + " is related to " + correct + " by being a type of " + correctType1;
                        }
                        else if (mode === Logic.MODE_RANDOM_TYPED) {
                            sametype = medicinejava.Entities.getUltimateParents(tmp) === correctType0;
                            stem.reasoning = tmp + " is a " + correctType0;
                        }
                        else if (mode === Logic.MODE_COMPLETELY_RANDOM) {
                            sametype = true;
                            stem.reasoning = "";
                        }
                    }
                } while (((!sametype || medicinejava.Entities.isRelatedTo(root, tmp, d2 | medicinejava.Entity.PARENT | medicinejava.Entity.CHILD, 3, null) || correct === tmp) && attempt++ < 5000));
                if (attempt >= 5000)
                    throw Object.defineProperty(new Error("Unable to find an unrelated (" + d1 + ") item to " + root + ", of type " + correctType1), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.IllegalStateException', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.Exception'] });
                this.infoText = "randomly related";
                stem.entity = tmp;
                if (stem.entity.listOf(d1).length > 0)
                    stem.reasoning += " It " + rel4 + " " + medicinejava.Entities.listToText(stem.entity.listOf(d1)) + ".";
                if (stem.entity.listOf(d2).length > 0)
                    stem.reasoning += " It " + rel2 + " " + medicinejava.Entities.listToText(stem.entity.listOf(d2)) + ".";
            }
            else if (mode === Logic.MODE_SOUNDS_SIMILAR) {
                var NS = 7;
                var es = this.ed.getAllEntities();
                var score = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })(/* size */ es.length);
                var hiscore = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })(NS);
                var hient = (function (s) { var a = []; while (s-- > 0)
                    a.push(null); return a; })(NS);
                var idx = 0;
                for (var i_1 = 0; i_1 < NS; i_1++) {
                    hiscore[i_1] = 4.9E-324;
                }
                for (var i_2 = (function (a) { var i = 0; return { next: function () { return i < a.length ? a[i++] : null; }, hasNext: function () { return i < a.length; } }; })(es); i_2.hasNext(); idx++) {
                    {
                        var ei = i_2.next();
                        if (ei === correct || medicinejava.Entities.isRelatedTo(ei, correct, medicinejava.Entity.PARENT | medicinejava.Entity.CHILD | d1, 2, null))
                            continue;
                        score[idx] = Logic.compareStrings(ei.name, correct.name);
                        if (score[idx] > hiscore[0]) {
                            var inspos = 0;
                            while ((inspos < NS - 1 && score[idx] > hiscore[inspos + 1])) {
                                inspos++;
                            }
                            ;
                            for (var j = 0; j < inspos; j++) {
                                {
                                    hiscore[j] = hiscore[j + 1];
                                    hient[j] = hient[j + 1];
                                }
                                ;
                            }
                            hiscore[inspos] = score[idx];
                            hient[inspos] = ei;
                        }
                        this.infoText = "Lexically similar to " + correct;
                    }
                    ;
                }
                for (var i_3 = 0; i_3 < NS; i_3++) {
                    {
                    }
                    ;
                }
                for (var i_4 = 0; i_4 < 5; i_4++) {
                    if (hiscore[i_4] < 0.5)
                        throw new Logic.TryAgain();
                    ;
                }
                this.currentBank = (hient.slice(0).slice(0));
                var i = ((NS * Math.random()) | 0);
                stem.entity = hient[i];
                stem.reasoning = hient[i] + " could be confused with " + correct + ".";
                if (stem.entity.listOf(d1).length > 0)
                    stem.reasoning += " It " + rel4 + " " + medicinejava.Entities.listToText(stem.entity.listOf(d1)) + ".";
                if (stem.entity.listOf(d2).length > 0)
                    stem.reasoning += " It " + rel2 + " " + medicinejava.Entities.listToText(stem.entity.listOf(d2)) + ".";
            }
            else if (mode === Logic.MODE_BROTHER_OF_CORRECT) {
                if (correct.parents.length === 0)
                    throw new Logic.TryAgain();
                var p = correct.parents[0];
                var s = (medicinejava.Entities.getExtensiveListOf$int$medicinejava_Entity$int(medicinejava.Entity.CHILD, p, 10).slice(0));
                this.filterOutRelations(s, root, d2 | medicinejava.Entity.CHILD, 3);
                /* remove */ (function (a) { var index = a.indexOf(correct); if (index >= 0) {
                    a.splice(index, 1);
                    return true;
                }
                else {
                    return false;
                } })(s);
                this.infoText = "Brothers of " + correct;
                if (s.length < this.N) {
                    if (p.parents.length > 0)
                        p = p.parents[0];
                    /* addAll */ (function (l1, l2) { return l1.push.apply(l1, l2); })(s, medicinejava.Entities.getExtensiveListOf$int$medicinejava_Entity$int(medicinejava.Entity.CHILD, p, 10));
                    this.filterOutRelations(s, root, d2 | medicinejava.Entity.CHILD, 3);
                    /* remove */ (function (a) { var index = a.indexOf(correct); if (index >= 0) {
                        a.splice(index, 1);
                        return true;
                    }
                    else {
                        return false;
                    } })(s);
                    if (s.length < this.N)
                        throw new Logic.TryAgain();
                    this.infoText = "Cousins of " + correct;
                }
                this.currentBank = s;
                var i = ((s.length * Math.random()) | 0);
                stem.entity = s[i];
                stem.reasoning = stem.entity + " is a type of " + p + ".";
                var stement = Entity.fromJSON(stem.entity); // SGM : convert to entity
                if (stement.listOf(d1).length > 0)
                    stem.reasoning += " It " + rel4 + " " + medicinejava.Entities.listToText(
                      stement.listOf(d1)) + ".";
                if (stement.listOf(d2).length > 0)
                    stem.reasoning += " It " + rel2 + " " + medicinejava.Entities.listToText(
                      stement.listOf(d2)) + ".";
            }
            else if (mode === Logic.MODE_BROTHER_OF_ROOT) {
                if (root.parents.length === 0)
                    throw new Logic.TryAgain();
                var p = root.parents[0];
                var exclude = ([]);
                /* add */ (function (s, e) { if (s.indexOf(e) == -1) {
                    s.push(e);
                    return true;
                }
                else {
                    return false;
                } })(exclude, root);
                var brothrs = medicinejava.Entities.getExtensiveListOf$int$medicinejava_Entity$int$java_util_Set(medicinejava.Entity.CHILD, p, 2, exclude);
                var rels = ([]);
                for (var i_5 = (function (a) { var i = 0; return { next: function () { return i < a.length ? a[i++] : null; }, hasNext: function () { return i < a.length; } }; })(brothrs); i_5.hasNext();) {
                    {
                        var b = i_5.next();
                        exclude = ([]);
                        /* add */ (function (s, e) { if (s.indexOf(e) == -1) {
                            s.push(e);
                            return true;
                        }
                        else {
                            return false;
                        } })(exclude, root);
                        /* addAll */ (function (l1, l2) { return l1.push.apply(l1, l2); })(rels, medicinejava.Entities.getExtensiveListOf$int$medicinejava_Entity$int$java_util_Set(d1, b, 1, exclude));
                    }
                    ;
                }
                /* removeAll */ (function (a, r) { var b = false; for (var i_6 = 0; i_6 < r.length; i_6++) {
                    var ndx = a.indexOf(r[i_6]);
                    if (ndx >= 0) {
                        a.splice(ndx, 1);
                        b = true;
                    }
                } return b; })(rels, brothrs);
                var v = (rels.slice(0));
                this.filterOutRelations(v, root, d2, 3);
                if (v.length === 0)
                    throw new Logic.TryAgain();
                this.currentBank = v;
                var i = ((v.length * Math.random()) | 0);
                stem.entity = v[i];
                var ch = medicinejava.Entities.findRelationChains(p, stem.entity, medicinejava.Entity.CHILD | d1, 4, null, null, null, 0);
                if (ch.length === 0)
                    throw Object.defineProperty(new Error("Could not find chain for brother of root: " + p + "\'s children\'s " + medicinejava.Entities.getRelationNamesFromBits(d1) + " don\'t include " + stem.entity), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.IllegalStateException', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.Exception'] });
                var shortest = 0;
                var shortlen = 100;
                var tmp = void 0;
                for (var j = 0; j < ch.length; j++) {
                    if ((tmp = ch[j].length) < shortlen) {
                        shortest = j;
                        shortlen = tmp;
                    }
                    ;
                }
                var inf = ch[shortest];
                /* reverse */ inf.reverse();
                try {
                    stem.reasoning = medicinejava.Entities.chainText(inf);
                }
                catch (x) {
                    console.error(x.message, x);
                }
                ;
                if (stem.entity.listOf(d1).length > 0)
                    stem.reasoning += " It " + rel4 + " " + medicinejava.Entities.listToText(stem.entity.listOf(d1)) + ".";
                if (stem.entity.listOf(d2).length > 0)
                    stem.reasoning += " It " + rel2 + " " + medicinejava.Entities.listToText(stem.entity.listOf(d2)) + ".";
            }
            if (this.INCLUDE_DESCRIPTION)
                stem.reasoning += '\n' + stem.entity.description;
            return stem;
        };
        /**
         * is any of the items in a[0 to N-1] equal to e?
         * @param {Array} a
         * @param {number} N
         * @param {medicinejava.Entity} e
         * @return {boolean}
         */
        Logic.prototype.anyarrayequal = function (a, N, e) {
            var f = false;
            for (var i = 0; i < N; i++) {
                if (a[i] === e)
                    f = true;
                ;
            }
            return f;
        };
        /**
         * randomly choose n items from c into a vector
         * @param {Array} s
         * @param {number} n
         * @return {Array}
         */
        Logic.prototype.choose = function (s, n) {
            var ns = s.length;
            var result = ([]);
            if (ns < n)
                throw Object.defineProperty(new Error("Cannot choose " + n + " items from a set " + (function (a) { return a ? '[' + a.join(', ') + ']' : 'null'; })(s) + " of " + ns), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.IllegalStateException', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.Exception'] });
            var r = ([]);
            for (var i = 0; i < ns; i++) {
                {
                    /* add */ (r.push(new Number(i).valueOf()) > 0);
                }
                ;
            }
            console.info("Collections.shuffle(r);");
            var it = (function (a) { var i = 0; return { next: function () { return i < a.length ? a[i++] : null; }, hasNext: function () { return i < a.length; } }; })(s);
            var un = 0;
            for (var i = 0; i < ns; i++) {
                {
                    var o = it.next();
                    for (var j = 0; j < n; j++) {
                        if ((r[j] | 0) === i) {
                            /* add */ (result.push(o) > 0);
                            un++;
                        }
                        ;
                    }
                    if (un >= n)
                        break;
                }
                ;
            }
            return result;
        };
        /**
         * remove any items from v which are related to 'relative' by relations 'relations'
         * to a depth 'depth'
         * @param {Array} v
         * @param {medicinejava.Entity} relative
         * @param {number} relations
         * @param {number} depth
         */
        Logic.prototype.filterOutRelations = function (v, relative, relations, depth) {
            var rm = ([]);
            for (var i = 0; i < v.length; i++) {
                {
                    if (medicinejava.Entities.isRelatedTo(v[i], relative, relations, depth, null))
                        (rm.push(/* get */ v[i]) > 0);
                }
                ;
            }
            /* removeAll */ (function (a, r) { var b = false; for (var i = 0; i < r.length; i++) {
                var ndx = a.indexOf(r[i]);
                if (ndx >= 0) {
                    a.splice(ndx, 1);
                    b = true;
                }
            } return b; })(v, rm);
        };
        /**
         * @return {number} lexical similarity value in the range [0,1]
         * @param {string} str1
         * @param {string} str2
         */
        Logic.compareStrings = function (str1, str2) {
            var pairs1 = Logic.wordLetterPairs(str1.toUpperCase());
            var pairs2 = Logic.wordLetterPairs(str2.toUpperCase());
            var intersection = 0;
            var union = pairs1.length + pairs2.length;
            for (var i = 0; i < pairs1.length; i++) {
                {
                    var pair1 = pairs1[i];
                    for (var j = 0; j < pairs2.length; j++) {
                        {
                            var pair2 = pairs2[j];
                            if ((function (o1, o2) { if (o1 && o1.equals) {
                                return o1.equals(o2);
                            }
                            else {
                                return o1 === o2;
                            } })(pair1, pair2)) {
                                intersection++;
                                /* remove */ pairs2.splice(j, 1)[0];
                                break;
                            }
                        }
                        ;
                    }
                }
                ;
            }
            return (2.0 * intersection) / union;
        };
        /**
         * @return {Array} an ArrayList of 2-character Strings.
         * @param {string} str
         * @private
         */
        Logic.wordLetterPairs = function (str) {
            var allPairs = ([]);
            var words = str.split("\\s");
            for (var w = 0; w < words.length; w++) {
                {
                    var pairsInWord = Logic.letterPairs(words[w]);
                    for (var p = 0; p < pairsInWord.length; p++) {
                        {
                            /* add */ (allPairs.push(pairsInWord[p]) > 0);
                        }
                        ;
                    }
                }
                ;
            }
            return allPairs;
        };
        /**
         * @return {Array} an array of adjacent letter pairs contained in the input string
         * @param {string} str
         * @private
         */
        Logic.letterPairs = function (str) {
            var numPairs = str.length - 1;
            if (numPairs < 1)
                return [];
            var pairs = (function (s) { var a = []; while (s-- > 0)
                a.push(null); return a; })(numPairs);
            for (var i = 0; i < numPairs; i++) {
                {
                    pairs[i] = str.substring(i, i + 2);
                }
                ;
            }
            return pairs;
        };
        /**
         * Call newQuestion() then
         * Create a question structure from the current logic
         * @param {number} mode
         * @return {medicinejava.Question}
         */
        Logic.prototype.getNewQuestion = function (mode) {
            this.newQuestion(mode);
            return this.q;
        };
        /**
         * generate a single new Stem according to the current logic and current
         * question's root, correct, direction and mode.
         * @return {medicinejava.Stem}
         */
        Logic.prototype.generateNewStem = function () {
            return this.newIncorrect$medicinejava_Entity_A$medicinejava_Entity$medicinejava_Entity$int$int(this.incorrect, this.q.root, /* get */ this.q.correctStem[0].entity, this.q.direction, this.q.mode);
        };
        Logic.prototype.setQuestion = function (qu) {
            qu = qu;
        };
        Logic.prototype.setStem = function (stem, newItem) {
            stem.entity = newItem;
            stem.reasoning = medicinejava.Essay.getText(newItem);
        };
        return Logic;
    }());
    /**
     * Logic modes - how to choose alternatives!
     */
    Logic.MODE_RANDOM_TYPED = 0;
    /**
     * Logic modes - how to choose alternatives!
     */
    Logic.MODE_RANDOM_RELATED = 1;
    /**
     * Logic modes - how to choose alternatives!
     */
    Logic.MODE_COMPLETELY_RANDOM = 2;
    /**
     * Logic modes - how to choose alternatives!
     */
    Logic.MODE_SOUNDS_SIMILAR = 3;
    /**
     * Logic modes - how to choose alternatives!
     */
    Logic.MODE_BROTHER_OF_CORRECT = 4;
    /**
     * Logic modes - how to choose alternatives!
     */
    Logic.MODE_BROTHER_OF_ROOT = 5;
    medicinejava.Logic = Logic;
    Logic["__class"] = "medicinejava.Logic";
    (function (Logic) {
        var TryAgain = (function (_super) {
            __extends(TryAgain, _super);
            function TryAgain() {
                var _this = _super.call(this) || this;
                Object.setPrototypeOf(_this, TryAgain.prototype);
                return _this;
            }
            return TryAgain;
        }(Error));
        Logic.TryAgain = TryAgain;
        TryAgain["__class"] = "medicinejava.Logic.TryAgain";
        TryAgain["__interfaces"] = ["java.io.Serializable"];
    })(Logic = medicinejava.Logic || (medicinejava.Logic = {}));
    var Entity = (function () {
        function Entity(from, connection) {
            if (this.probs === undefined)
                this.probs = null;
            if (this.children === undefined)
                this.children = null;
            if (this.parents === undefined)
                this.parents = null;
            if (this.causes === undefined)
                this.causes = null;
            if (this.effects === undefined)
                this.effects = null;
            if (this.synonyms === undefined)
                this.synonyms = null;
            if (this.name === undefined)
                this.name = null;
            if (this.description === undefined)
                this.description = null;
            if (this.treats === undefined)
                this.treats = null;
            if (this.treatments === undefined)
                this.treatments = null;
            if (this.pChildren === undefined)
                this.pChildren = null;
            if (this.pCauses === undefined)
                this.pCauses = null;
            if (this.pEffects === undefined)
                this.pEffects = null;
            this.children = ([]);
            this.parents = ([]);
            this.causes = ([]);
            this.effects = ([]);
            this.treats = ([]);
            this.treatments = ([]);
            if (from != null) {
                this.connect(from, connection);
            }
            this.synonyms = ([]);
            this.name = "Entity" + Entity.serial++;
            this.description = "";
        }
        /**
         * SGM convert from json to Java entity
         */
        Entity.fromJSON = function(name){
          var e = new Entity(null),
              o = medicine.cache[name];
          if(o===undefined){console.log("error creating Java Entity");}
          e.name = name;
          e.causes = o.Causes;
          e.effects = o.Effects;
          e.parents = o.Parents;
          e.children = o.Children;
          e.treats = o.Treats;
          e.treatments = o.Treatments;
          e.validate();
          return e;
        }
        Entity.prototype.validate = function(){
          if (this.probs === undefined)
              this.probs = null;
          if (this.synonyms === undefined)
              this.synonyms = ([]);
          if (this.name === undefined)
              this.name = "ERROR";
          if (this.description === undefined)
              this.description = "";
          if (this.pChildren === undefined)
              this.pChildren = null;
          if (this.pCauses === undefined)
              this.pCauses = null;
          if (this.pEffects === undefined)
              this.pEffects = null;
          if (this.children === undefined)
              this.children = ([]);
          if (this.parents === undefined)
              this.parents = ([]);
          if (this.causes === undefined)
              this.causes = ([]);
          if (this.effects === undefined)
              this.effects = ([]);
          if (this.treats === undefined)
              this.treats = ([]);
          if (this.treatments === undefined)
              this.treatments = ([]);
        }


        Entity.relationList_$LI$ = function () { if (Entity.relationList == null)
            Entity.relationList = [Entity.CAUSE, Entity.EFFECT, Entity.PARENT, Entity.CHILD, Entity.TREATS, Entity.TREATMENTS]; return Entity.relationList; };
        ;
        Entity.relationNameList_$LI$ = function () { if (Entity.relationNameList == null)
            Entity.relationNameList = ["Causes", "Effects", "Supertypes", "Subtypes", "Treats", "Treatments"]; return Entity.relationNameList; };
        ;
        /**
         * eg. listOf(PARENT) returns parent.
         * @param {number} relation
         * @return {Array}
         */
        Entity.prototype.listOf = function (relation) {
            switch ((relation)) {
                case 1 /* PARENT */:
                    return this.parents;
                case 2 /* CHILD */:
                    return this.children;
                case 4 /* CAUSE */:
                    return this.causes;
                case 8 /* EFFECT */:
                    return this.effects;
                case 16 /* TREATS */:
                    return this.treats;
                case 32 /* TREATMENTS */:
                    return this.treatments;
            }
            return null;
        };
        /**
         * List the probabilities of the entities related to this entity.
         * return null if not set.
         * @param {number} relation
         * @return {Array}
         */
        Entity.prototype.probsOf = function (relation) {
            if (this.probs == null)
                return null;
            for (var i = 0; i < Entity.relationList_$LI$().length; i++) {
                {
                    if ((Entity.relationList_$LI$()[i] & relation) > 0) {
                        var v = this.probs[i];
                        if (v == null)
                            continue;
                        if (v.length !== this.listOf(relation).length) {
                            this.ensureConnectionProbs(relation);
                        }
                        return v;
                    }
                }
                ;
            }
            return null;
        };
        /*private*/ Entity.probidxOfRel = function (rel) {
            for (var i = 0; i < Entity.relationList_$LI$().length; i++) {
                {
                    if ((Entity.relationList_$LI$()[i] & rel) > 0) {
                        return i;
                    }
                }
                ;
            }
            throw Object.defineProperty(new Error(rel + " is not a relation."), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
        };
        /**
         * return the name of the first relation in the bitwise flags 'rel'
         * @param {number} rel
         * @return {string}
         */
        Entity.nameOfRelation = function (rel) {
            return Entity.relationNameList_$LI$()[Entity.probidxOfRel(rel)];
        };
        /**
         * return the bitwise flags for a given relation string. return 0  if not a valid string.
         * @param {string} s
         * @return {number}
         */
        Entity.getRelationForName = function (s) {
            for (var i = 0; i < Entity.relationNameList_$LI$().length; i++) {
                {
                    if ((function (o1, o2) { if (o1 && o1.equals) {
                        return o1.equals(o2);
                    }
                    else {
                        return o1 === o2;
                    } })(Entity.relationNameList_$LI$()[i].toLowerCase(), s.toLowerCase()))
                        return Entity.relationList_$LI$()[i];
                }
                ;
            }
            return 0;
        };
        /*private*/ Entity.prototype.removeProb = function (rel, idx) {
            if (this.probs != null) {
                var op = this.probs[Entity.probidxOfRel(rel)];
                if (op != null) {
                    var np = (function (s) { var a = []; while (s-- > 0)
                        a.push(0); return a; })(op.length - 1);
                    /* arraycopy */ (function (srcPts, srcOff, dstPts, dstOff, size) { if (srcPts !== dstPts || dstOff >= srcOff + size) {
                        while (--size >= 0)
                            dstPts[dstOff++] = srcPts[srcOff++];
                    }
                    else {
                        var tmp = srcPts.slice(srcOff, srcOff + size);
                        for (var i = 0; i < size; i++)
                            dstPts[dstOff++] = tmp[i];
                    } })(op, 0, np, 0, idx);
                    /* arraycopy */ (function (srcPts, srcOff, dstPts, dstOff, size) { if (srcPts !== dstPts || dstOff >= srcOff + size) {
                        while (--size >= 0)
                            dstPts[dstOff++] = srcPts[srcOff++];
                    }
                    else {
                        var tmp = srcPts.slice(srcOff, srcOff + size);
                        for (var i = 0; i < size; i++)
                            dstPts[dstOff++] = tmp[i];
                    } })(op, idx + 1, np, idx, op.length - idx - 1);
                    this.probs[Entity.probidxOfRel(rel)] = np;
                }
            }
        };
        Entity.prototype.moveListItem = function (rel, idx1, idx2) {
            var o = this.listOf(rel)[idx1];
            if (idx1 === idx2)
                return;
            var dest = idx2;
            if (idx1 < idx2) {
                dest--;
            }
            /* remove */ this.listOf(rel).splice(idx1, 1)[0];
            var v = this.listOf(rel);
            console.info("v.insertElementAt(o,dest)");
            var p = this.probsOf(rel);
            if (p != null) {
                var tmp = p[idx1];
                if (idx2 > idx1)
                    for (var i = idx1; i < dest; i++) {
                        p[i] = p[i + 1];
                    }
                else
                    for (var i = idx1; i > dest; i--) {
                        p[i] = p[i - 1];
                    }
                p[dest] = tmp;
            }
        };
        /**
         * remove a probability list if all NaN
         */
        Entity.prototype.checkIfProbsClear = function () {
            if (this.probs != null) {
                for (var i = 0; i < this.probs.length; i++) {
                    {
                        if (this.probs[i] == null)
                            continue;
                        var empty = true;
                        for (var j = 0; j < this.probs[i].length; j++) {
                            {
                                if (!isNaN(this.probs[i][j]))
                                    empty = false;
                            }
                            ;
                        }
                        if (empty)
                            this.probs[i] = null;
                    }
                    ;
                }
            }
        };
        /**
         * Set the probabilities of the entities related to this entity.
         * the probabilities x must have name size as number of related items.
         * @param {number} relation
         * @param {number} idx
         * @param {number} x
         */
        Entity.prototype.setProbOf = function (relation, idx, x) {
            if (this.probs == null)
                this.probs = (function (s) { var a = []; while (s-- > 0)
                    a.push(null); return a; })(Entity.relationList_$LI$().length);
            for (var i = 0; i < Entity.relationList_$LI$().length; i++) {
                {
                    if ((Entity.relationList_$LI$()[i] & relation) > 0) {
                        if (this.probs[i] == null) {
                            var nrel = this.listOf(relation).length;
                            this.probs[i] = (function (s) { var a = []; while (s-- > 0)
                                a.push(0); return a; })(nrel);
                            for (var j = 0; j < nrel; j++) {
                                this.probs[i][j] = NaN;
                            }
                        }
                        else if (this.probs[i].length <= idx) {
                            var nrel = this.listOf(relation).length;
                            var npr = (function (s) { var a = []; while (s-- > 0)
                                a.push(0); return a; })(nrel);
                            for (var j = 0; j < this.probs[i].length; j++) {
                                npr[j] = this.probs[i][j];
                            }
                            for (var j = this.probs[i].length; j < nrel; j++) {
                                npr[j] = NaN;
                            }
                            this.probs[i] = npr;
                        }
                        this.probs[i][idx] = x;
                    }
                }
                ;
            }
        };
        Entity.inverseOf = function (reciprocalRelation) {
            switch ((reciprocalRelation)) {
                case 1 /* PARENT */:
                    return Entity.CHILD;
                case 2 /* CHILD */:
                    return Entity.PARENT;
                case 4 /* CAUSE */:
                    return Entity.EFFECT;
                case 8 /* EFFECT */:
                    return Entity.CAUSE;
                case 16 /* TREATS */:
                    return Entity.TREATMENTS;
                case 32 /* TREATMENTS */:
                    return Entity.TREATS;
            }
            return 0;
        };
        /**
         * e.g. A.connect(B, PARENT) means
         * A.parents.add(B);  B.children.add(A)
         * @param {medicinejava.Entity} to
         * @param {number} connectAs
         */
        Entity.prototype.connect = function (to, connectAs) {
            var mylist = this.listOf(connectAs);
            if (mylist.indexOf(to) >= 0)
                return;
            /* add */ (this.listOf(connectAs).push(to) > 0);
            this.ensureConnectionProbs(connectAs);
            /* add */ (to.listOf(Entity.inverseOf(connectAs)).push(this) > 0);
            to.ensureConnectionProbs(Entity.inverseOf(connectAs));
        };
        /**
         * expand the probabilities list to the correct size after adding a connection
         * @param {number} rel
         */
        Entity.prototype.ensureConnectionProbs = function (rel) {
            var error = false;
            if (this.probs != null) {
                var r = Entity.probidxOfRel(rel);
                if (this.probs[r] != null) {
                    var n = this.listOf(rel).length;
                    var nn = this.probs[r].length;
                    if (nn === n)
                        return;
                    var np = (function (s) { var a = []; while (s-- > 0)
                        a.push(0); return a; })(n);
                    if (n < nn) {
                        nn = n;
                        error = true;
                    }
                    /* arraycopy */ (function (srcPts, srcOff, dstPts, dstOff, size) { if (srcPts !== dstPts || dstOff >= srcOff + size) {
                        while (--size >= 0)
                            dstPts[dstOff++] = srcPts[srcOff++];
                    }
                    else {
                        var tmp = srcPts.slice(srcOff, srcOff + size);
                        for (var i = 0; i < size; i++)
                            dstPts[dstOff++] = tmp[i];
                    } })(this.probs[r], 0, np, 0, nn);
                    for (var j = this.probs[r].length; j < np.length; j++) {
                        np[j] = NaN;
                    }
                    this.probs[r] = np;
                }
            }
            if (error) {
                throw Object.defineProperty(new Error("The list " + this + "." + Entity.relationNameList_$LI$()[rel] + " has too many probabilities. I am truncating the list, possible losing data."), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.IllegalStateException', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.Exception'] });
            }
        };
        Entity.prototype.disconnect = function (from, relation) {
            var _this = this;
            if (this.numConnections() < 2) {
                console.info("Cannot delete last connection");
                return;
            }
            if ((this.listOf(relation).indexOf((from)) >= 0)) {
                var idx = this.listOf(relation).indexOf(from);
                /* remove */ (function (a) { var index = a.indexOf(from); if (index >= 0) {
                    a.splice(index, 1);
                    return true;
                }
                else {
                    return false;
                } })(this.listOf(relation));
                this.removeProb(relation, idx);
                var idx2 = from.listOf(Entity.inverseOf(relation)).indexOf(this);
                /* remove */ (function (a) { var index = a.indexOf(_this); if (index >= 0) {
                    a.splice(index, 1);
                    return true;
                }
                else {
                    return false;
                } })(from.listOf(Entity.inverseOf(relation)));
                from.removeProb(Entity.inverseOf(relation), idx2);
            }
        };
        Entity.prototype.toString = function () {
            return this.name;
        };
        /**
         * Check if equal to name or any of the synonyms
         * @param {string} s
         * @return {boolean}
         */
        Entity.prototype.equals = function (s) {
            if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(this.name, s))
                return true;
            for (var i = 0; i < this.synonyms.length; i++) {
                {
                    if ((function (o1, o2) { if (o1 && o1.equals) {
                        return o1.equals(o2);
                    }
                    else {
                        return o1 === o2;
                    } })(s, this.synonyms[i]))
                        return true;
                }
                ;
            }
            return false;
        };
        Entity.prototype.equalsIgnoreCase = function (s) {
            if ((function (o1, o2) { return o1.toUpperCase() === (o2 === null ? o2 : o2.toUpperCase()); })(this.name, s))
                return true;
            for (var i = 0; i < this.synonyms.length; i++) {
                {
                    if ((function (o1, o2) { return o1.toUpperCase() === (o2 === null ? o2 : o2.toUpperCase()); })(s, this.synonyms[i]))
                        return true;
                }
                ;
            }
            return false;
        };
        Entity.prototype.contains = function (s) {
            if (this.name.indexOf(s) >= 0)
                return true;
            for (var i = 0; i < this.synonyms.length; i++) {
                {
                    if (this.synonyms[i].indexOf(s) >= 0)
                        return true;
                }
                ;
            }
            return false;
        };
        Entity.prototype.containsIgnoreCase = function (s) {
            if (this.indexOfIgnoreCase(this.name, s) >= 0)
                return true;
            for (var i = 0; i < this.synonyms.length; i++) {
                {
                    if (this.indexOfIgnoreCase(this.synonyms[i], s) >= 0)
                        return true;
                }
                ;
            }
            return false;
        };
        Entity.prototype.indexOfIgnoreCase = function (main, sub) {
            for (var k = 0; k <= main.length - sub.length; k++) {
                {
                    if ((function (o1, o2) { return o1.toUpperCase() === (o2 === null ? o2 : o2.toUpperCase()); })(main.substring(k, k + sub.length), sub))
                        return k;
                }
                ;
            }
            return -1;
        };
        /**
         * Is the object blank -- i.e. does it have connections other than its
         * original one?
         * @return {boolean}
         */
        Entity.prototype.isBlank = function () {
            return (this.synonyms.length == 0) && this.numConnections() < 2 && (function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(this.description, "");
        };
        /**
         * Replaces any uses of the current entry with the replacement entry,
         * leaving this entry disconnected & henceforth discardable
         * @param {medicinejava.Entity} replacement
         */
        Entity.prototype.replaceAllWith = function (replacement) {
            for (var i = 0; i < Entity.relationList_$LI$().length; i++) {
                {
                    var rel = Entity.relationList_$LI$()[i];
                    var v = this.listOf(rel);
                    for (var j = 0; j < v.length; j++) {
                        {
                            var dest = v[j];
                            replacement.connect(dest, rel);
                            dest.disconnect(this, Entity.inverseOf(rel));
                        }
                        ;
                    }
                }
                ;
            }
        };
        /**
         * Count total number of links this object has with other objects
         * @return {number}
         */
        Entity.prototype.numConnections = function () {
            var n = this.causes.length + this.effects.length + this.parents.length + this.children.length;
            n += this.treatments.length + this.treats.length;
            return n;
        };
        return Entity;
    }());
    Entity.serial = 0;
    Entity.PARENT = 1;
    Entity.CHILD = 2;
    Entity.CAUSE = 4;
    Entity.EFFECT = 8;
    Entity.TREATS = 16;
    Entity.TREATMENTS = 32;
    medicinejava.Entity = Entity;
    Entity["__class"] = "medicinejava.Entity";
    Entity["__interfaces"] = ["java.io.Serializable"];
    var EntityData = (function () {
        function EntityData() {
            /*private*/ this.namesToEntities = ({});
            if (this.saveTime === undefined)
                this.saveTime = 0;
            if (this.lastRead === undefined)
                this.lastRead = 0;
        }
        /**
         * Collection of entities backed by the hashtable of names
         * @return {Array}
         */
        EntityData.prototype.getAllEntities = function () {
            return (function (m) { return medicine.cache; })(this.namesToEntities);
        };
        EntityData.prototype.addNewEntity$java_lang_String = function (name) {
            var e = new medicinejava.Entity(null, 0);
            e.name = name;
            var o = (function (m, k, v) { if (m.entries == null)
                m.entries = []; for (var i = 0; i < m.entries.length; i++)
                if (m.entries[i].key.equals != null && m.entries[i].key.equals(k) || m.entries[i].key === k) {
                    m.entries[i].value = v;
                    return;
                } m.entries.push({ key: k, value: v, getKey: function () { return this.key; }, getValue: function () { return this.value; } }); })(this.namesToEntities, name, e);
            if (o != null)
                throw Object.defineProperty(new Error("Two entites with key " + name), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.IllegalStateException', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.Exception'] });
            return e;
        };
        EntityData.prototype.addNewEntity$medicinejava_Entity$int = function (from, relation) {
            var e = new medicinejava.Entity(from, relation);
            var o = (function (m, k, v) { if (m.entries == null)
                m.entries = []; for (var i = 0; i < m.entries.length; i++)
                if (m.entries[i].key.equals != null && m.entries[i].key.equals(k) || m.entries[i].key === k) {
                    m.entries[i].value = v;
                    return;
                } m.entries.push({ key: k, value: v, getKey: function () { return this.key; }, getValue: function () { return this.value; } }); })(this.namesToEntities, e.name, e);
            if (o != null)
                throw Object.defineProperty(new Error("Two entites with key " + e.name), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.IllegalStateException', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.Exception'] });
            return e;
        };
        EntityData.prototype.addNewEntity = function (from, relation) {
            if (((from != null && from instanceof medicinejava.Entity) || from === null) && ((typeof relation === 'number') || relation === null)) {
                return this.addNewEntity$medicinejava_Entity$int(from, relation);
            }
            else if (((typeof from === 'string') || from === null) && relation === undefined) {
                return this.addNewEntity$java_lang_String(from);
            }
            else
                throw new Error('invalid overload');
        };
        EntityData.prototype.removeEntity = function (r) {
            /* remove */ (function (m, k) { if (m.entries == null)
                m.entries = []; for (var i = 0; i < m.entries.length; i++)
                if (m.entries[i].key.equals != null && m.entries[i].key.equals(k) || m.entries[i].key === k) {
                    return m.entries.splice(i, 1)[0];
                } })(this.namesToEntities, r.name);
        };
        EntityData.prototype.removeAllOf = function (e) {
            for (var i = (function (a) { var i = 0; return { next: function () { return i < a.length ? a[i++] : null; }, hasNext: function () { return i < a.length; } }; })(e); i.hasNext();) {
                {
                    this.removeEntity(i.next());
                }
                ;
            }
        };
        /**
         * update the name hash table
         */
        EntityData.prototype.refreshNames = function () {
            var es = (function (m) { var r = []; if (m.entries == null)
                m.entries = []; for (var i = 0; i < m.entries.length; i++)
                r.push(m.entries[i].value); return r; })(this.namesToEntities);
            var nht = ({});
            for (var i = (function (a) { var i = 0; return { next: function () { return i < a.length ? a[i++] : null; }, hasNext: function () { return i < a.length; } }; })(es); i.hasNext();) {
                {
                    var e = i.next();
                    /* put */ (function (m, k, v) { if (m.entries == null)
                        m.entries = []; for (var i_7 = 0; i_7 < m.entries.length; i_7++)
                        if (m.entries[i_7].key.equals != null && m.entries[i_7].key.equals(k) || m.entries[i_7].key === k) {
                            m.entries[i_7].value = v;
                            return;
                        } m.entries.push({ key: k, value: v, getKey: function () { return this.key; }, getValue: function () { return this.value; } }); })(nht, e.name, e);
                }
                ;
            }
            this.namesToEntities = nht;
        };
        /**
         * Check that all entities are found in the data
         */
        EntityData.prototype.checkIntegrity = function () {
            var c = (function (m) { var r = []; if (m.entries == null)
                m.entries = []; for (var i = 0; i < m.entries.length; i++)
                r.push(m.entries[i].value); return r; })(this.namesToEntities);
            for (var it = (function (a) { var i = 0; return { next: function () { return i < a.length ? a[i++] : null; }, hasNext: function () { return i < a.length; } }; })(c); it.hasNext();) {
                {
                    var e = it.next();
                    for (var i = 1; i < medicinejava.Entity.relationList_$LI$().length; i++) {
                        {
                            var v = e.listOf(medicinejava.Entity.relationList_$LI$()[i]);
                            for (var it2 = (function (a) { var i = 0; return { next: function () { return i < a.length ? a[i++] : null; }, hasNext: function () { return i < a.length; } }; })(v); it2.hasNext();) {
                                {
                                    var e2 = it2.next();
                                    if (!(c.indexOf((e2)) >= 0)) {
                                        throw new medicinejava.DataIntegrityException(e2.name + " not found in data.");
                                    }
                                }
                                ;
                            }
                        }
                        ;
                    }
                }
                ;
            }
        };
        EntityData.prototype.size = function () {
            return (function (m) { if (m.entries == null)
                m.entries = []; return m.entries.length; })(this.namesToEntities);
        };
        EntityData.prototype.findEntityExact = function (name) {
            return (function (m, k) { if (m.entries == null)
                m.entries = []; for (var i = 0; i < m.entries.length; i++)
                if (m.entries[i].key.equals != null && m.entries[i].key.equals(k) || m.entries[i].key === k) {
                    return m.entries[i].value;
                } return null; })(this.namesToEntities, name);
        };
        EntityData.prototype.findEntities = function (text, contains, csensitive) {
            var res = ([]);
            for (var k = this.namesToEntities.elements(); k.hasMoreElements();) {
                {
                    var c = k.nextElement();
                    var s = c.name;
                    var textlc = text.toLowerCase();
                    if (contains) {
                        if (csensitive) {
                            if (s.indexOf(text) >= 0) {
                                /* addElement */ (res.push(/* get */ (function (m, k) { if (m.entries == null)
                                    m.entries = []; for (var i = 0; i < m.entries.length; i++)
                                    if (m.entries[i].key.equals != null && m.entries[i].key.equals(k) || m.entries[i].key === k) {
                                        return m.entries[i].value;
                                    } return null; })(this.namesToEntities, s)) > 0);
                                continue;
                            }
                        }
                        else {
                            if (s.toLowerCase().indexOf(textlc) >= 0) {
                                /* addElement */ (res.push(/* get */ (function (m, k) { if (m.entries == null)
                                    m.entries = []; for (var i = 0; i < m.entries.length; i++)
                                    if (m.entries[i].key.equals != null && m.entries[i].key.equals(k) || m.entries[i].key === k) {
                                        return m.entries[i].value;
                                    } return null; })(this.namesToEntities, s)) > 0);
                                continue;
                            }
                        }
                        for (var i = 0; i < c.synonyms.length; i++) {
                            {
                                var syn = c.synonyms[i];
                                if (csensitive) {
                                    if (syn.indexOf(text) >= 0) {
                                        /* addElement */ (res.push(/* get */ (function (m, k) { if (m.entries == null)
                                            m.entries = []; for (var i_8 = 0; i_8 < m.entries.length; i_8++)
                                            if (m.entries[i_8].key.equals != null && m.entries[i_8].key.equals(k) || m.entries[i_8].key === k) {
                                                return m.entries[i_8].value;
                                            } return null; })(this.namesToEntities, s)) > 0);
                                        break;
                                    }
                                }
                                else {
                                    if (syn.toLowerCase().indexOf(textlc) >= 0) {
                                        /* addElement */ (res.push(/* get */ (function (m, k) { if (m.entries == null)
                                            m.entries = []; for (var i_9 = 0; i_9 < m.entries.length; i_9++)
                                            if (m.entries[i_9].key.equals != null && m.entries[i_9].key.equals(k) || m.entries[i_9].key === k) {
                                                return m.entries[i_9].value;
                                            } return null; })(this.namesToEntities, s)) > 0);
                                        break;
                                    }
                                }
                            }
                            ;
                        }
                    }
                    else {
                        if (csensitive) {
                            if ((function (o1, o2) { if (o1 && o1.equals) {
                                return o1.equals(o2);
                            }
                            else {
                                return o1 === o2;
                            } })(s, text))
                                (res.push(/* get */ (function (m, k) { if (m.entries == null)
                                    m.entries = []; for (var i = 0; i < m.entries.length; i++)
                                    if (m.entries[i].key.equals != null && m.entries[i].key.equals(k) || m.entries[i].key === k) {
                                        return m.entries[i].value;
                                    } return null; })(this.namesToEntities, s)) > 0);
                        }
                        else {
                            if ((function (o1, o2) { return o1.toUpperCase() === (o2 === null ? o2 : o2.toUpperCase()); })(s, text))
                                (res.push(/* get */ (function (m, k) { if (m.entries == null)
                                    m.entries = []; for (var i = 0; i < m.entries.length; i++)
                                    if (m.entries[i].key.equals != null && m.entries[i].key.equals(k) || m.entries[i].key === k) {
                                        return m.entries[i].value;
                                    } return null; })(this.namesToEntities, s)) > 0);
                        }
                    }
                }
                ;
            }
            return res;
        };
        /**
         * @deprecated never crawl entities: the stack trace gets too deep.
         * @return {medicinejava.Entity}
         */
        EntityData.prototype.getFirstEntity = function () {
            return (function (a) { var i = 0; return { next: function () { return i < a.length ? a[i++] : null; }, hasNext: function () { return i < a.length; } }; })(/* values */ (function (m) { var r = []; if (m.entries == null)
                m.entries = []; for (var i = 0; i < m.entries.length; i++)
                r.push(m.entries[i].value); return r; })(this.namesToEntities)).next();
        };
        /**
         * this is a silly method that returns an entity by its serial index.
         * This serial index changes all the time, so don't use it except to generate
         * a random entity.
         * It is also slow, as it iterates through N entities!
         * @param {number} n
         * @return {medicinejava.Entity}
         * @private
         */
        EntityData.prototype.getItemAtIndex = function (n) {
          /** SGM - replace with medicine cache  */
          return medicine.cache[n];
            var index = 0;
            for (var i = (function (a) { var i = 0; return { next: function () { return i < a.length ? a[i++] : null; }, hasNext: function () { return i < a.length; } }; })(/* values */ (function (m) { var r = []; if (m.entries == null)
                m.entries = []; for (var i_10 = 0; i_10 < m.entries.length; i_10++)
                r.push(m.entries[i_10].value); return r; })(this.namesToEntities)); i.hasNext(); index++) {
                {
                    var o = i.next();
                    if (index === n)
                        return o;
                }
                ;
            }
            throw Object.defineProperty(new Error("can\'t get entity at index " + n), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.IndexOutOfBoundsException', 'java.lang.Object', 'java.lang.ArrayIndexOutOfBoundsException', 'java.lang.RuntimeException', 'java.lang.Exception'] });
        };
        EntityData.prototype.getRandomEntity = function () {
            return this.getItemAtIndex((Math.floor(Math.random() * this.getAllEntities().length) | 0));
        };
        /**
         * Parse an edit string
         * return: true if an edit was made
         * dispatches to the relevant implementEdit... functions
         * @param {string} editString
         * @return {boolean}
         */
        EntityData.prototype.implementEdit = function (editString) {
            var s = editString.split("\t");
            var i = 0;
            while ((s[i].length === 0)) {
                i++;
            }
            ;
            var cmd = s[i].toLowerCase().trim();
            var rel = medicinejava.Entity.getRelationForName(s[2].trim());
            var e1 = this.findEntityExact(s[1].trim());
            var e2 = this.findEntityExact(s[3].trim());
            if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(cmd, "remove")) {
                if ((function (o1, o2) { return o1.toUpperCase() === (o2 === null ? o2 : o2.toUpperCase()); })(s[2], "Synonyms")) {
                    if (e1 == null)
                        throw new EntityData.MedicineEditException("no entity for synonym in " + editString);
                    return this.implementEditRemoveSynonym(e1, s[3]);
                }
                else {
                    if (e1 == null || rel === 0 || e2 == null)
                        throw new EntityData.MedicineEditException("no such link in " + editString);
                    return this.implementEditDelete(e1, rel, e2);
                }
            }
            else if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(cmd, "add")) {
                if ((function (o1, o2) { return o1.toUpperCase() === (o2 === null ? o2 : o2.toUpperCase()); })(s[2], "Synonym")) {
                    if (e1 == null)
                        throw new EntityData.MedicineEditException("no entity for synonym in " + editString);
                    return this.implementEditAddSynonym(e1, s[3]);
                }
                else {
                    if (e1 == null || rel === 0)
                        throw new EntityData.MedicineEditException("invalid new link in " + editString);
                    if (e2 == null)
                        e2 = this.addNewEntity$java_lang_String(s[3]);
                    return this.implementEditAdd(e1, rel, e2);
                }
            }
            else if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(cmd, "edit")) {
                if ((function (o1, o2) { return o1.toUpperCase() === (o2 === null ? o2 : o2.toUpperCase()); })(s[2], "Name")) {
                    var newname = s[3].trim();
                    if (e1 == null || newname.length === 0)
                        throw new EntityData.MedicineEditException("invalid name edit: " + editString);
                    return this.implementEditName(e1, s[3]);
                }
                else if ((function (o1, o2) { return o1.toUpperCase() === (o2 === null ? o2 : o2.toUpperCase()); })(s[2], "Description")) {
                    var desc = s[3];
                    if (e1 == null)
                        throw new EntityData.MedicineEditException("no entity for description in " + editString);
                    return this.implementEditDescription(e1, desc);
                }
                else
                    throw new EntityData.MedicineEditException("unknown edit: " + s[2] + " in " + editString);
            }
            else if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(cmd, "updatepercent")) {
                if (e1 == null || rel === 0 || e2 == null)
                    throw new EntityData.MedicineEditException("invalid link for percentage in " + editString);
                var percent = void 0;
                try {
                    percent = parseFloat(s[4]);
                }
                catch (e) {
                    throw new EntityData.MedicineEditException("Not a valid percentage: " + s[4] + " in " + editString);
                }
                ;
                return this.implementEditUpdatePercent(e1, medicinejava.Entity.getRelationForName(s[2]), e2, percent);
            }
            else if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(cmd, "comment")) {
                return true;
            }
            else
                throw new EntityData.MedicineEditException("unknown command: " + cmd + " in " + editString);
        };
        /**
         * create a string representing an edit.
         * Starts with a command, then tab-separated arguments.
         * e.g.   remove  Disease  Child  Infection
         * add     Disease  Child  Infection
         * edit    Disease  Name   Diseases    (relation can be Name or Description)
         * updatepercent    Disease        Child   Infection  0.5
         * comment Disease  not sure about this one
         * @param {string} command
         * @param {medicinejava.Entity} entity
         * @param {string} relation
         * @param {string} item
         * @param {string} value
         * @return {string}
         */
        EntityData.createEditString = function (command, entity, relation, item, value) {
            var cmd = command.toLowerCase();
            var string;
            if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(cmd, "remove")) {
                string = cmd + "\t" + entity.name + "\t" + relation + "\t" + item;
            }
            else if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(cmd, "add")) {
                string = cmd + "\t" + entity.name + "\t" + relation + "\t" + item;
            }
            else if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(cmd, "edit")) {
                string = cmd + "\t" + entity.name + "\t" + relation + "\t" + item;
            }
            else if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(cmd, "updatepercent")) {
                string = cmd + "\t" + entity.name + "\t" + relation + "\t" + item + "\t" + value;
            }
            else if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(cmd, "comment")) {
                string = cmd + "\t" + value;
            }
            else {
                throw new EntityData.MedicineEditException("unknown command: " + cmd);
            }
            return string;
        };
        EntityData.prototype.implementEditRemoveSynonym = function (e, syn) {
            if ((e.synonyms.indexOf((syn)) >= 0)) {
                /* removeElement */ (function (a) { var index = a.indexOf(syn); if (index >= 0) {
                    a.splice(index, 1);
                    return true;
                }
                else {
                    return false;
                } })(e.synonyms);
                return true;
            }
            else
                return false;
        };
        EntityData.prototype.implementEditAddSynonym = function (e, syn) {
            return true;
        };
        EntityData.prototype.implementEditDelete = function (e, rel, item) {
            if ((e.listOf(rel).indexOf((item)) >= 0)) {
                e.disconnect(item, rel);
                return true;
            }
            else
                return false;
        };
        EntityData.prototype.implementEditAdd = function (e, rel, item) {
            e.connect(item, rel);
            return true;
        };
        EntityData.prototype.implementEditName = function (e, n) {
            var legalchars = "ABCDEFGHIJKLMNOPQRTSUVWXYZabcdefghijklmnopqrtsuvwxyz\' -";
            for (var i = 0; i < n.length; i++) {
                if (legalchars.indexOf(n.charAt(i)) < 0)
                    throw new EntityData.MedicineEditException("Illegal character " + n.charAt(i) + " in new name for " + e + ", " + n);
                ;
            }
            /* remove */ (function (m, k) { if (m.entries == null)
                m.entries = []; for (var i = 0; i < m.entries.length; i++)
                if (m.entries[i].key.equals != null && m.entries[i].key.equals(k) || m.entries[i].key === k) {
                    return m.entries.splice(i, 1)[0];
                } })(this.namesToEntities, e.name);
            e.name = n;
            /* put */ (function (m, k, v) { if (m.entries == null)
                m.entries = []; for (var i = 0; i < m.entries.length; i++)
                if (m.entries[i].key.equals != null && m.entries[i].key.equals(k) || m.entries[i].key === k) {
                    m.entries[i].value = v;
                    return;
                } m.entries.push({ key: k, value: v, getKey: function () { return this.key; }, getValue: function () { return this.value; } }); })(this.namesToEntities, e.name, e);
            return true;
        };
        EntityData.prototype.implementEditDescription = function (e, d) {
            e.description = d;
            return true;
        };
        EntityData.prototype.implementEditUpdatePercent = function (e, rel, item, p) {
            var ix = e.listOf(rel).indexOf(item);
            if (ix >= 0) {
                e.setProbOf(rel, ix, p);
                return true;
            }
            else
                return false;
        };
        return EntityData;
    }());
    medicinejava.EntityData = EntityData;
    EntityData["__class"] = "medicinejava.EntityData";
    (function (EntityData) {
        var MedicineEditException = (function (_super) {
            __extends(MedicineEditException, _super);
            function MedicineEditException(c) {
                var _this = _super.call(this, c) || this;
                _this.message = c;
                Object.setPrototypeOf(_this, MedicineEditException.prototype);
                return _this;
            }
            return MedicineEditException;
        }(Error));
        EntityData.MedicineEditException = MedicineEditException;
        MedicineEditException["__class"] = "medicinejava.EntityData.MedicineEditException";
        MedicineEditException["__interfaces"] = ["java.io.Serializable"];
    })(EntityData = medicinejava.EntityData || (medicinejava.EntityData = {}));
    var DataIntegrityException = (function () {
        function DataIntegrityException(s) {
            Object.setPrototypeOf(this, DataIntegrityException.prototype);
        }
        return DataIntegrityException;
    }());
    medicinejava.DataIntegrityException = DataIntegrityException;
    DataIntegrityException["__class"] = "medicinejava.DataIntegrityException";
    DataIntegrityException["__interfaces"] = ["java.io.Serializable"];
    /**
     * General utilities for use with tht class Entity
     * @class
     */
    var Entities = (function () {
        function Entities() {
            if (this.entityData === undefined)
                this.entityData = null;
            if (this.data === undefined)
                this.data = null;
        }
        Entities.standardStrings_$LI$ = function () { if (Entities.standardStrings == null)
            Entities.standardStrings = ["Disease", "Pathology", "Investigation", "Sign", "Symptom", "Substance", "Treatment", "Lifestyle"]; return Entities.standardStrings; };
        ;
        Entities.isStandardUltimateParent = function (e) {
            if (e == null)
                return false;
            for (var i = 0; i < Entities.standardStrings_$LI$().length; i++) {
                if ((function (o1, o2) { if (o1 && o1.equals) {
                    return o1.equals(o2);
                }
                else {
                    return o1 === o2;
                } })(e.name, Entities.standardStrings_$LI$()[i]))
                    return true;
                ;
            }
            return false;
        };
        Entities.hasAStandardUltimateParent = function (e) {
            var l = Entities.getExtensiveListOf$int$medicinejava_Entity$int(medicinejava.Entity.PARENT, e, 15);
            for (var i = (function (a) { var i = 0; return { next: function () { return i < a.length ? a[i++] : null; }, hasNext: function () { return i < a.length; } }; })(l); i.hasNext();) {
                if (Entities.isStandardUltimateParent(i.next()))
                    return true;
                ;
            }
            return false;
        };
        /**
         * modify the vector to contain only entities which have a standard ultimate parent
         * @param {Array} v
         */
        Entities.prototype.filterVectorForStandardParents = function (v) {
            var rm = ([]);
            for (var i = 0; i < v.length; i++) {
                if (Entities.isStandardUltimateParent(Entities.getUltimateParents(v[i])))
                    (rm.push(/* get */ v[i]) > 0);
                ;
            }
            /* removeAll */ (function (a, r) { var b = false; for (var i = 0; i < r.length; i++) {
                var ndx = a.indexOf(r[i]);
                if (ndx >= 0) {
                    a.splice(ndx, 1);
                    b = true;
                }
            } return b; })(v, rm);
        };
        /**
         *
         * modify the vector to contain only entities which have the specified ultimate parent
         * (specify a combination of the bits E_DISEASE E_PATHOLOGY etc)
         * @param {Array} v
         * @param {number} ultimateParent
         */
        Entities.filterVectorForStandardParents = function (v, ultimateParent) {
            var rm = ([]);
            for (var i = 0; i < v.length; i++) {
                {
                    var e = v[i];
                    var ultP = Entities.getUltimateParents(e);
                    var ok = false;
                    if (ultP != null) {
                        for (var b = 0; b < 8; b++) {
                            {
                                if ((ultimateParent & (1 << b)) > 0 && (function (o1, o2) { if (o1 && o1.equals) {
                                    return o1.equals(o2);
                                }
                                else {
                                    return o1 === o2;
                                } })(ultP.name, Entities.standardStrings_$LI$()[b]))
                                    ok = true;
                            }
                            ;
                        }
                    }
                    if (!ok)
                        (rm.push(/* get */ v[i]) > 0);
                }
                ;
            }
            /* removeAll */ (function (a, r) { var b = false; for (var i = 0; i < r.length; i++) {
                var ndx = a.indexOf(r[i]);
                if (ndx >= 0) {
                    a.splice(ndx, 1);
                    b = true;
                }
            } return b; })(v, rm);
        };
        Entities.prototype.setData = function (e) {
            var toremove = ([]);
            for (var i = (function (a) { var i = 0; return { next: function () { return i < a.length ? a[i++] : null; }, hasNext: function () { return i < a.length; } }; })(e.getAllEntities()); i.hasNext();) {
                {
                    var en = i.next();
                    var nconn = 0;
                    for (var j = 0; j < medicinejava.Entity.relationList_$LI$().length; j++) {
                        {
                            var v = en.listOf(medicinejava.Entity.relationList_$LI$()[j]);
                            nconn += v.length;
                        }
                        ;
                    }
                    if (nconn === 0) {
                        /* add */ (toremove.push(en) > 0);
                    }
                    var nsyn = en.synonyms.length;
                    for (var j = 0; j < nsyn; j++) {
                        {
                            for (var k = j + 1; k < nsyn; k++) {
                                {
                                    if ((function (o1, o2) { if (o1 && o1.equals) {
                                        return o1.equals(o2);
                                    }
                                    else {
                                        return o1 === o2;
                                    } })(/* get */ en.synonyms[j], /* get */ en.synonyms[k])) {
                                        /* set */ (en.synonyms[k] = "");
                                    }
                                }
                                ;
                            }
                        }
                        ;
                    }
                    for (var j = 0; j < en.synonyms.length; j++) {
                        if ((function (o1, o2) { if (o1 && o1.equals) {
                            return o1.equals(o2);
                        }
                        else {
                            return o1 === o2;
                        } })(/* get */ en.synonyms[j], "")) {
                            /* remove */ en.synonyms.splice(j--, 1)[0];
                        }
                        ;
                    }
                }
                ;
            }
            e.removeAllOf(toremove);
            this.entityData = e;
        };
        Entities.prototype.getData = function () {
            return this.entityData;
        };
        Entities.prototype.writeTextForm$java_io_OutputStream = function (os) {
            var out = new java.io.PrintStream(os);
            {
                for (var i = (function (a) { var i = 0; return { next: function () { return i < a.length ? a[i++] : null; }, hasNext: function () { return i < a.length; } }; })(this.entityData.getAllEntities()); i.hasNext();) {
                    {
                        var ent = i.next();
                        this.writeTextForm$java_io_PrintStream$medicinejava_Entity(out, ent);
                    }
                    ;
                }
                this.writeTimeToStream(out, new Date().getTime());
            }
            ;
        };
        Entities.prototype.writeTimeToStream = function (pw, time) {
            pw.println("_SAVED_TIME " + time);
        };
        Entities.prototype.writeTextForm$java_io_PrintStream$medicinejava_Entity = function (out, e) {
            out.println(e.name + " {");
            if (e.synonyms.length > 0)
                out.println("\tSynonyms {" + Entities.getDelimitedNames(e.synonyms, ", ") + "}");
            if (e.causes.length > 0)
                out.println("\tCauses {" + Entities.getDelimitedEntities(e, medicinejava.Entity.CAUSE, ", ") + "}");
            if (e.effects.length > 0)
                out.println("\tEffects {" + Entities.getDelimitedEntities(e, medicinejava.Entity.EFFECT, ", ") + "}");
            if (e.parents.length > 0)
                out.println("\tParents {" + Entities.getDelimitedEntities(e, medicinejava.Entity.PARENT, ", ") + "}");
            if (e.children.length > 0)
                out.println("\tChildren {" + Entities.getDelimitedEntities(e, medicinejava.Entity.CHILD, ", ") + "}");
            if (e.treats.length > 0)
                out.println("\tTreats {" + Entities.getDelimitedEntities(e, medicinejava.Entity.TREATS, ", ") + "}");
            if (e.treatments.length > 0)
                out.println("\tTreatments {" + Entities.getDelimitedEntities(e, medicinejava.Entity.TREATMENTS, ", ") + "}");
            if (!(function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(e.description, ""))
                out.println("\tDescription {\"" + e.description.split('{').join('(').split('}').join(')') + "\"}");
            out.println("}");
        };
        /**
         * format of output:
         *
         *
         * Pulmonary fibrosis{
         * Synonyms { Lung fibrosis, Fibrosis of lung }
         * Children { Apical lung fibrosis, Basal lung fibrosis }
         * Description {"Scarring and fibrous change of the
         * pulmonary interstitium"}
         * Parents { Lung pathology }
         * }
         * Aortic stenosis{
         * ...
         * }
         * @param {java.io.PrintStream} out
         * @param {medicinejava.Entity} e
         */
        Entities.prototype.writeTextForm = function (out, e) {
            if (((out != null && out instanceof java.io.PrintStream) || out === null) && ((e != null && e instanceof medicinejava.Entity) || e === null)) {
                return this.writeTextForm$java_io_PrintStream$medicinejava_Entity(out, e);
            }
            else if (((out != null && out instanceof java.io.OutputStream) || out === null) && e === undefined) {
                return this.writeTextForm$java_io_OutputStream(out);
            }
            else
                throw new Error('invalid overload');
        };
        Entities.readTextForm = function (is) {
            var fr = null;
            var data = null;
            try {
                fr = is;
                data = new medicinejava.EntityData();
                while ((true)) {
                    {
                        Entities.readEntity(data, fr);
                    }
                }
                ;
            }
            catch (e) {
            }
            ;
            if (fr != null) {
                /* close */ ;
            }
            if (data == null)
                return null;
            if (data.size() === 0)
                return null;
            Entities.validateConnections(data);
            return data;
        };
        /**
         * Merge two input streams in text format
         * @deprecated - use the single-stream version to merge with a dataset
         * @param {{ str: string, cursor: number }} is
         * @param {{ str: string, cursor: number }} is2
         * @return {medicinejava.Entity}
         */
        Entities.mergeTextFromStreams = function (is, is2) {
            var fr = null;
            var data = null;
            try {
                fr = is;
                data = new medicinejava.EntityData();
                while ((true)) {
                    {
                        Entities.readEntity(data, fr);
                    }
                }
                ;
            }
            catch (e) {
            }
            ;
            if (fr != null) {
                /* close */ ;
                fr = null;
            }
            if (data == null)
                data = new medicinejava.EntityData();
            try {
                fr = is2;
                while ((true)) {
                    {
                        Entities.readEntity(data, fr);
                    }
                }
                ;
            }
            catch (e) {
            }
            ;
            if (fr != null) {
                /* close */ ;
            }
            if (data == null)
                return null;
            if (data.size() === 0)
                return null;
            return data.getFirstEntity();
        };
        Entities.mergeTextFromStream = function (d, is) {
            var fr = null;
            try {
                fr = is;
                while ((true)) {
                    {
                        Entities.readEntity(d, fr);
                    }
                }
                ;
            }
            catch (e) {
            }
            ;
            if (fr != null) {
                /* close */ ;
            }
            Entities.validateConnections(d);
            return d;
        };
        /**
         * readEntity - reads an entity form the stream into the EntityData.
         *
         * @param {medicinejava.EntityData} data EntityData
         * @param fr FileReader
         * @param {{ str: string, cursor: number }} r
         * @private
         */
        Entities.readEntity = function (data, r) {
            var nameb = { str: "", toString: function () { return this.str; } };
            var ch;
            while (((ch = (function (r) { return r.str.charCodeAt(r.cursor++); })(r)) != '{'.charCodeAt(0) && ch !== -1)) {
                (function (sb) { sb.str = sb.str.concat(String.fromCharCode(ch)); return sb; })(nameb);
            }
            ;
            if (ch === -1)
                throw new Entities.EOF();
            var name = nameb.str.trim();
            if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(nameb, "_SAVED_TIME")) {
                data.saveTime = Entities.readTimeFromStream(r);
                return;
            }
            var e = data.findEntityExact(name);
            if (e == null) {
                e = data.addNewEntity$java_lang_String(name);
            }
            try {
                while ((true)) {
                    Entities.readSection(e, data, r);
                }
                ;
            }
            catch (ex) {
            }
            ;
        };
        Entities.readTimeFromStream = function (r) {
            var ch;
            var d = { str: "", toString: function () { return this.str; } };
            while ((!javaemul.internal.CharacterHelper.isWhitespace(String.fromCharCode((ch = (function (r) { return r.str.charCodeAt(r.cursor++); })(r)))))) {
                (function (sb) { sb.str = sb.str.concat(ch); return sb; })(d);
            }
            ;
            if (ch === -1)
                throw new Entities.EOF();
            return parseInt(/* toString */ d.str);
        };
        /**
         * readSection -reads a list of causes, effects, synonyms etc. from an entity
         *
         * @param {medicinejava.Entity} e Entity
         * @param {medicinejava.EntityData} data EntityData
         * @param {{ str: string, cursor: number }} r
         * @private
         */
        Entities.readSection = function (e, data, r) {
            var nameb = { str: "", toString: function () { return this.str; } };
            var ch;
            while (((ch = (function (r) { return r.str.charCodeAt(r.cursor++); })(r)) != '{'.charCodeAt(0) && ch != '}'.charCodeAt(0) && ch !== -1)) {
                (function (sb) { sb.str = sb.str.concat(String.fromCharCode(ch)); return sb; })(nameb);
            }
            ;
            if (ch == '}'.charCodeAt(0))
                throw new Entities.EOE();
            if (ch === -1)
                throw new Entities.EOF();
            var name = nameb.str.trim();
            if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(name, "Causes"))
                Entities.readListTillCloseBracket(e, medicinejava.Entity.CAUSE, data, r, true);
            if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(name, "Effects"))
                Entities.readListTillCloseBracket(e, medicinejava.Entity.EFFECT, data, r, true);
            if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(name, "Parents"))
                Entities.readListTillCloseBracket(e, medicinejava.Entity.PARENT, data, r, true);
            if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(name, "Children"))
                Entities.readListTillCloseBracket(e, medicinejava.Entity.CHILD, data, r, true);
            if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(name, "Synonyms"))
                Entities.readStringListTillCloseBracket(e.synonyms, data, r);
            if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(name, "Treats"))
                Entities.readListTillCloseBracket(e, medicinejava.Entity.TREATS, data, r, true);
            if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(name, "Treatments"))
                Entities.readListTillCloseBracket(e, medicinejava.Entity.TREATMENTS, data, r, true);
            if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(name, "Description")) {
                var desc = { str: "", toString: function () { return this.str; } };
                while (((ch = (function (r) { return r.str.charCodeAt(r.cursor++); })(r)) != '}'.charCodeAt(0) && ch !== -1)) {
                    (function (sb) { sb.str = sb.str.concat(String.fromCharCode(ch)); return sb; })(desc);
                }
                ;
                if (ch === -1)
                    throw new Entities.EOF();
                var d = desc.str.trim();
                if ((function (str, searchString, position) {
                    if (position === void 0) { position = 0; }
                    return str.substr(position, searchString.length) === searchString;
                })(d, "\""))
                    d = d.substring(1, d.length - 1);
                Entities.mergeDescriptions(e, d);
            }
        };
        /**
         * Scans a stream 'r' until the next }
         * Takes a list of comma-delimited values, and stores them as elements
         * in v, converting them into entities if instructed.
         * @param {medicinejava.Entity} from
         * @param {number} relation
         * @param {medicinejava.EntityData} data
         * @param {{ str: string, cursor: number }} r
         * @param {boolean} convertToEntity
         * @private
         */
        Entities.readListTillCloseBracket = function (from, relation, data, r, convertToEntity) {
            var s = { str: "", toString: function () { return this.str; } };
            var ch;
            while (((ch = (function (r) { return r.str.charCodeAt(r.cursor++); })(r)) != '}'.charCodeAt(0))) {
                {
                    if (ch === -1)
                        throw new Entities.EOF();
                    if (ch == ','.charCodeAt(0)) {
                        Entities.storeEntity(from, s, relation, data, convertToEntity);
                    }
                    else {
                        if (ch == '`'.charCodeAt(0))
                            ch = (',').charCodeAt(0);
                        /* append */ (function (sb) { sb.str = sb.str.concat(String.fromCharCode(ch)); return sb; })(s);
                    }
                }
            }
            ;
            Entities.storeEntity(from, s, relation, data, convertToEntity);
        };
        /**
         * scan the stream for comma delimited strings, into vector v.
         * @param {Array} v
         * @param {medicinejava.EntityData} d
         * @param {{ str: string, cursor: number }} r
         * @private
         */
        Entities.readStringListTillCloseBracket = function (v, d, r) {
            var s = { str: "", toString: function () { return this.str; } };
            var ch;
            while (((ch = (function (r) { return r.str.charCodeAt(r.cursor++); })(r)) != '}'.charCodeAt(0))) {
                {
                    if (ch === -1)
                        throw new Entities.EOF();
                    if (ch == ','.charCodeAt(0)) {
                        if (!(v.indexOf((s.str)) >= 0)) {
                            /* addElement */ (v.push(/* toString */ s.str.trim()) > 0);
                        }
                        /* setLength */ (function (sb, length) { return sb.str = sb.str.substring(0, length); })(s, 0);
                    }
                    else {
                        if (ch == '`'.charCodeAt(0))
                            ch = (',').charCodeAt(0);
                        /* append */ (function (sb) { sb.str = sb.str.concat(String.fromCharCode(ch)); return sb; })(s);
                    }
                }
            }
            ;
            if (!(v.indexOf((s.str)) >= 0)) {
                /* addElement */ (v.push(/* toString */ s.str.trim()) > 0);
            }
            /* setLength */ (function (sb, length) { return sb.str = sb.str.substring(0, length); })(s, 0);
        };
        /**
         * Called when an item 's' in a list has been read. This adds the item to
         * vector v, converting to entities if instructed.
         * @param {medicinejava.Entity} from
         * @param {{ str: string, toString: Function }} s
         * @param {number} relation
         * @param {medicinejava.EntityData} d
         * @param {boolean} convertToEntity
         * @private
         */
        Entities.storeEntity = function (from, s, relation, d, convertToEntity) {
            var n = s.str.trim();
            var v = from.listOf(relation);
            if (convertToEntity) {
                var p = NaN;
                if ((function (str, searchString) { var pos = str.length - searchString.length; var lastIndex = str.indexOf(searchString, pos); return lastIndex !== -1 && lastIndex === pos; })(n, "%")) {
                    var i = n.length - 2;
                    while ((!javaemul.internal.CharacterHelper.isWhitespace(n.charAt(i)))) {
                        i = i - 1;
                    }
                    ;
                    try {
                        p = parseFloat(n.substring(i + 1, n.length - 1));
                    }
                    catch (e) {
                        throw Object.defineProperty(new Error("Illegal percentage in " + from.name + ": " + n), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.io.IOException', 'java.lang.Object', 'java.lang.Exception'] });
                    }
                    ;
                    n = n.substring(0, i);
                }
                var e = d.findEntityExact(n);
                if (e == null) {
                    e = d.addNewEntity$java_lang_String(n);
                    /* addElement */ (v.push(e) > 0);
                    if (Entities.ENSURE_VALIIDTY_AT_EXPENSE_OF_ORDER)
                        (e.listOf(medicinejava.Entity.inverseOf(relation)).push(from) > 0);
                }
                else {
                    if (!(v.indexOf((e)) >= 0)) {
                        /* addElement */ (v.push(e) > 0);
                        if (Entities.ENSURE_VALIIDTY_AT_EXPENSE_OF_ORDER)
                            (e.listOf(medicinejava.Entity.inverseOf(relation)).push(from) > 0);
                    }
                }
                if (!isNaN(p)) {
                    from.setProbOf(relation, v.indexOf(e), p);
                }
                /* setLength */ (function (sb, length) { return sb.str = sb.str.substring(0, length); })(s, 0);
            }
            else {
                if (!(v.indexOf((s.str)) >= 0)) {
                    /* addElement */ (v.push(/* toString */ s.str.trim()) > 0);
                }
                /* setLength */ (function (sb, length) { return sb.str = sb.str.substring(0, length); })(s, 0);
            }
        };
        Entities.mergeDescriptions = function (e, d) {
            if ((function (o1, o2) { if (o1 && o1.equals) {
                return o1.equals(o2);
            }
            else {
                return o1 === o2;
            } })(e.description, d))
                return;
            if ((function (str, searchString, position) {
                if (position === void 0) { position = 0; }
                return str.substr(position, searchString.length) === searchString;
            })(e.description, d))
                return;
            if ((function (str, searchString, position) {
                if (position === void 0) { position = 0; }
                return str.substr(position, searchString.length) === searchString;
            })(d, e.description)) {
                e.description = d;
                return;
            }
            else
                e.description += '\n' + d;
        };
        /**
         * Convert a Vector to a string as a delimited list - for serialisation!
         * @param {Array} v
         * @param {string} delimiter
         * @return {string}
         */
        Entities.getDelimitedNames = function (v, delimiter) {
            var list = { str: "", toString: function () { return this.str; } };
            var _loop_1 = function (i) {
                {
                    var o = v[i];
                    var s_1 = o.toString();
                    s_1 = s_1.split('{').join('(').split('}').join(')').split(',').join('`');
                    /* append */ (function (sb) { sb.str = sb.str.concat(s_1.toString()); return sb; })(list);
                    if (i < v.length - 1)
                        (function (sb) { sb.str = sb.str.concat(delimiter); return sb; })(list);
                }
                ;
            };
            for (var i = 0; i < v.length; i++) {
                _loop_1(i);
            }
            return list.str;
        };
        /**
         * Get the list for a particular direction - for serialisation
         * @param {medicinejava.Entity} e
         * @param {number} relation
         * @param {string} delimiter
         * @return {string}
         */
        Entities.getDelimitedEntities = function (e, relation, delimiter) {
            var list = { str: "", toString: function () { return this.str; } };
            var v = e.listOf(relation);
            var p = e.probsOf(relation);
            var _loop_2 = function (i) {
                {
                    var o = v[i];
                    var s_2 = o.toString();
                    s_2 = s_2.split('{').join('(').split('}').join(')').split(',').join('`');
                    /* append */ (function (sb) { sb.str = sb.str.concat(s_2.toString()); return sb; })(list);
                    if (p != null && p.length > i && !isNaN(p[i])) {
                        /* append */ (function (sb) { sb.str = sb.str.concat(' '); return sb; })(list);
                        /* append */ (function (sb) { sb.str = sb.str.concat(p[i]); return sb; })(list);
                        /* append */ (function (sb) { sb.str = sb.str.concat('%'); return sb; })(list);
                    }
                    if (i < v.length - 1)
                        (function (sb) { sb.str = sb.str.concat(delimiter); return sb; })(list);
                }
                ;
            };
            for (var i = 0; i < v.length; i++) {
                _loop_2(i);
            }
            return list.str;
        };
        /**
         * Blocking call that checks each entity in the set
         * and ensures that every connection has a reciprocal.
         * If not, one is created.
         * Returns the number of extra connections created.
         * @param {medicinejava.EntityData} d
         * @return {number}
         */
        Entities.validateConnections = function (d) {
            var errors = 0;
            for (var i = (function (a) { var i = 0; return { next: function () { return i < a.length ? a[i++] : null; }, hasNext: function () { return i < a.length; } }; })(d.getAllEntities()); i.hasNext();) {
                {
                    var e = i.next();
                    for (var j = 1; j < medicinejava.Entity.relationList_$LI$().length; j++) {
                        {
                            var r = medicinejava.Entity.relationList_$LI$()[j];
                            var ri = medicinejava.Entity.inverseOf(r);
                            for (var k = (function (a) { var i = 0; return { next: function () { return i < a.length ? a[i++] : null; }, hasNext: function () { return i < a.length; } }; })(e.listOf(r)); k.hasNext();) {
                                {
                                    var f = k.next();
                                    if (!(f.listOf(ri).indexOf((e)) >= 0)) {
                                        /* add */ (f.listOf(ri).push(e) > 0);
                                        errors++;
                                    }
                                }
                                ;
                            }
                        }
                        ;
                    }
                }
                ;
            }
            return errors;
        };
        /**
         * Lists all causes of an entity
         * Use: Vector v=getAllCauses(currentEntity, null);
         * @param {medicinejava.Entity} entity
         * @param {Array} except
         * @return {Array}
         */
        Entities.getAllCauses = function (entity, except) {
            if (except != null && (except.indexOf((entity)) >= 0))
                return null;
            if (except == null)
                except = ([]);
            var v = ([]);
            /* add */ (except.push(entity) > 0);
            for (var i = 0; i < entity.causes.length; i++) {
                {
                    var e = entity.causes[i];
                    if (except == null || !(except.indexOf((e)) >= 0)) {
                        var ve = Entities.getAllCauses(e, v);
                        if (ve != null) {
                            if (ve.length > 0)
                                (function (l1, l2) { return l1.push.apply(l1, l2); })(v, ve);
                            else
                                (ve.push(e) > 0);
                        }
                    }
                }
                ;
            }
            return v;
        };
        Entities.getRelationNamesFromBits = function (b) {
            var s = "";
            for (var i = 0; i < medicinejava.Entity.relationList_$LI$().length; i++) {
                {
                    if ((b & medicinejava.Entity.relationList_$LI$()[i]) > 0)
                        s += medicinejava.Entity.relationNameList_$LI$()[i];
                }
                ;
            }
            if ((function (str, searchString) { var pos = str.length - searchString.length; var lastIndex = str.indexOf(searchString, pos); return lastIndex !== -1 && lastIndex === pos; })(s, "s"))
                s = s.substring(0, s.length - 1);
            return s.toLowerCase();
        };
        Entities.getExtensiveListOf$int$medicinejava_Entity$int = function (relations, entity, depth) {
            return Entities.getExtensiveListOf$int$medicinejava_Entity$int$java_util_Set(relations, entity, depth, null);
        };
        Entities.getExtensiveListOf$int$medicinejava_Entity$int$java_util_Set = function (relations, entity, depth, except) {
            var v = except;
            if (depth < 0)
                return v;
            if (v == null)
                v = ([]);
            if ((v.indexOf((entity)) >= 0))
                return v;
            /* add */ (function (s, e) { if (s.indexOf(e) == -1) {
                s.push(e);
                return true;
            }
            else {
                return false;
            } })(v, entity);
            for (var i = 0; i < medicinejava.Entity.relationList_$LI$().length; i++) {
                {
                    if ((relations & medicinejava.Entity.relationList_$LI$()[i]) > 0) {
                      /* SGM added fromJSON */
                        var ve = Entity.fromJSON(entity).listOf(medicinejava.Entity.relationList_$LI$()[i]);
                        if (ve != null)
                            for (var j = 0; j < ve.length; j++) {
                                {
                                    var e = ve[j];
                                    var vf = Entities.getExtensiveListOf$int$medicinejava_Entity$int$java_util_Set(relations, e, depth - 1, v);
                                    /* addAll */ (function (l1, l2) { return l1.push.apply(l1, l2); })(v, vf);
                                }
                                ;
                            }
                    }
                }
                ;
            }
            return v;
        };
        Entities.getExtensiveListOf = function (relations, entity, depth, except) {
            if (((typeof relations === 'number') || relations === null) && ((entity != null && entity instanceof medicinejava.Entity) || entity === null) && ((typeof depth === 'number') || depth === null) && ((except != null && (except instanceof Array)) || except === null)) {
                return medicinejava.Entities.getExtensiveListOf$int$medicinejava_Entity$int$java_util_Set(relations, entity, depth, except);
            }
            else if (((typeof relations === 'number') || relations === null) && ((entity != null && entity instanceof medicinejava.Entity) || entity === null) && ((typeof depth === 'number') || depth === null) && except === undefined) {
                return medicinejava.Entities.getExtensiveListOf$int$medicinejava_Entity$int(relations, entity, depth);
            }
            else
                throw new Error('invalid overload');
        };
        Entities.getDirectionalListOf$int$medicinejava_Entity$int = function (relations, entity, depth) {
            var s = Entities.getDirectionalListOf$int$medicinejava_Entity$int$java_util_Set(relations, entity, depth, null);
            var rm = ([]);
            {
                var array18061 = s;
                for (var index18060 = 0; index18060 < array18061.length; index18060++) {
                    var e = array18061[index18060];
                    {
                        if (Entities.isChildOf(e, entity) || Entities.isChildOf(entity, e) || entity === e) {
                            /* add */ (function (s, e) { if (s.indexOf(e) == -1) {
                                s.push(e);
                                return true;
                            }
                            else {
                                return false;
                            } })(rm, e);
                        }
                    }
                }
            }
            /* removeAll */ (function (a, r) { var b = false; for (var i = 0; i < r.length; i++) {
                var ndx = a.indexOf(r[i]);
                if (ndx >= 0) {
                    a.splice(ndx, 1);
                    b = true;
                }
            } return b; })(s, rm);
            return s;
        };
        Entities.getDirectionalListOf$int$medicinejava_Entity$int$java_util_Set = function (relations, entity, depth, except) {
            var v = except;
            if (depth < 0)
                return v;
            var first = v == null;
            if (first)
                v = ([]);
            if ((v.indexOf((entity)) >= 0))
                return v;
            /* add */ (function (s, e) { if (s.indexOf(e) == -1) {
                s.push(e);
                return true;
            }
            else {
                return false;
            } })(v, entity);
            for (var i = 0; i < medicinejava.Entity.relationList_$LI$().length; i++) {
                {
                    if ((relations & medicinejava.Entity.relationList_$LI$()[i]) > 0) {
                        var ve = entity.listOf(medicinejava.Entity.relationList_$LI$()[i]);
                        if (ve != null)
                            for (var j = 0; j < ve.length; j++) {
                                {
                                    var e = ve[j];
                                    var newrelations = relations & ~medicinejava.Entity.inverseOf(medicinejava.Entity.relationList_$LI$()[i]);
                                    var vf = Entities.getDirectionalListOf$int$medicinejava_Entity$int$java_util_Set(newrelations, e, depth - 1, v);
                                    /* addAll */ (function (l1, l2) { return l1.push.apply(l1, l2); })(v, vf);
                                }
                                ;
                            }
                    }
                }
                ;
            }
            return v;
        };
        /**
         * This implements recursive getDirectionalListOf
         * @param {number} relations
         * @param {medicinejava.Entity} entity
         * @param {number} depth
         * @param {Array} except
         * @return {Array}
         */
        Entities.getDirectionalListOf = function (relations, entity, depth, except) {
            if (((typeof relations === 'number') || relations === null) && ((entity != null && entity instanceof medicinejava.Entity) || entity === null) && ((typeof depth === 'number') || depth === null) && ((except != null && (except instanceof Array)) || except === null)) {
                return medicinejava.Entities.getDirectionalListOf$int$medicinejava_Entity$int$java_util_Set(relations, entity, depth, except);
            }
            else if (((typeof relations === 'number') || relations === null) && ((entity != null && entity instanceof medicinejava.Entity) || entity === null) && ((typeof depth === 'number') || depth === null) && except === undefined) {
                return medicinejava.Entities.getDirectionalListOf$int$medicinejava_Entity$int(relations, entity, depth);
            }
            else
                throw new Error('invalid overload');
        };
        Entities.getCauseHierarchy = function (entity, complete) {
            if (complete != null && (complete.indexOf((entity)) >= 0))
                return null;
            if (complete == null)
                complete = ([]);
            var v = ([]);
            /* add */ (complete.push(entity) > 0);
            for (var i = 0; i < entity.causes.length; i++) {
                {
                    var e = entity.causes[i];
                    if (complete == null || !(complete.indexOf((e)) >= 0)) {
                        var add = Entities.getCauseHierarchy(e, complete);
                        if (add != null)
                            (v.push(add) > 0);
                    }
                }
                ;
            }
            return v;
        };
        Entities.numConnections = function (e) {
            return e.causes.length + e.effects.length + e.parents.length + e.children.length;
        };
        /**
         * Recursively find whether the given queryItem is a child of 'parent'.
         * @param {medicinejava.Entity} queryItem
         * @param {medicinejava.Entity} parent
         * @return {boolean}
         */
        Entities.isChildOf = function (queryItem, parent) {
            return Entities.isChildOfRecursive(queryItem, parent, ([]));
        };
        Entities.isChildOfRecursive = function (queryItem, parent, avoid) {
            if ((avoid.indexOf((queryItem)) >= 0))
                return false;
            /* add */ (avoid.push(queryItem) > 0);
            var p = queryItem.parents;
            if (p.indexOf(parent) >= 0)
                return true;
            for (var i = 0; i < p.length; i++) {
                {
                    var nquery = p[i];
                    if (Entities.isChildOfRecursive(nquery, parent, avoid))
                        return true;
                }
                ;
            }
            return false;
        };
        /**
         * Get an entity by name. This call is slow and blocking.
         * @param any a node to start searching from.
         * @param {string} name
         * @param {medicinejava.EntityData} data
         * @return {medicinejava.Entity}
         */
        Entities.getSpecificNamedEntity = function (name, data) {
            var v = data.findEntities(name, false, true);
            if (v.length === 1)
                return v[1];
            else
                throw new medicinejava.EntityNotFoundException("Can\'t find entity " + name);
        };
        /**
         * Traverse the parents, using only the first element in the list of
         * parents on each level; and return the topmost entity
         * @param {medicinejava.Entity} e
         * @return {medicinejava.Entity}
         */
        Entities.getUltimateParents = function (e) {
          if(typeof e === "string"){ e = Entity.fromJSON(e); }
            if (e.parents.length === 0)
                return null;
            var p = Entity.fromJSON(e.parents[0]);
            while ((p.parents.length > 0) && p.parents[0] !== "Categories") {
                {
                    p = Entity.fromJSON(p.parents[0]);
                }
            }
            ;
            return p;
        };
        /**
         * traverse along a particular direction, getting the top item on each list
         * in that direction.
         * @param {medicinejava.Entity} e
         * @param {number} direction
         * @return {medicinejava.Entity[]}
         */
        Entities.getChainOfFirstItem = function (e, direction) {
            var v = ([]);
            /* add */ (v.push(e) > 0);
            while ((!(e.listOf(direction).length == 0))) {
                {
                    /* add */ (v.push(e = e.listOf(direction)[0]) > 0);
                }
            }
            ;
            return v;
        };
        /**
         * Blocking call that determines whether an entity is related to a query
         * entity.
         * @param {medicinejava.Entity} from Entity to start from - the entity to be queried
         * @param {medicinejava.Entity} to Entity to end at - the putative relative
         * @param {number} relations An integer representing which relations to follow, as a
         * binary 'OR' of Entity.CAUSE, Entity.EFFECT etc.
         * @param {number} maxRecursionDepth maximum number of items in causal chain,
         * including parents
         * @param {Array} excludeItems List of items to exclude in the search. This is
         * used in recursion to cumulate entities already visited. Can be null.
         * @return {boolean} whether or not the entity 'putativeRelative' can be reached
         * from queryEntity by traversing the specified relations. If specified
         * relations = 0, then this call returns false unless qureyEntity ==
         * putativeRelative.
         */
        Entities.isRelatedTo = function (from, to, relations, maxRecursionDepth, excludeItems) {
            if (excludeItems == null)
                excludeItems = ([]);
            if ((excludeItems.indexOf((from)) >= 0))
                return false;
            if (maxRecursionDepth <= 0)
                return false;
            if (from === to) {
                return true;
            }
            for (var i = 0; i < medicinejava.Entity.relationList_$LI$().length; i++) {
                {
                    if ((relations & medicinejava.Entity.relationList_$LI$()[i]) > 0) {
                        var v = Entity.fromJSON(from).listOf(medicinejava.Entity.relationList_$LI$()[i]);
                        for (var j = 0; j < v.length; j++) {
                            {
                                var e = v[j];
                                if (e === to)
                                    return true;
                                var newExcludeItems = (excludeItems.slice(0));
                                /* add */ (newExcludeItems.push(from) > 0);
                                if (Entities.isRelatedTo(e, to, relations, maxRecursionDepth - 1, newExcludeItems))
                                    return true;
                            }
                            ;
                        }
                    }
                }
                ;
            }
            return false;
        };
        /**
         * Blocking call that determines the list of ways in which an entity
         * is related to a query entity.
         * @param {medicinejava.Entity} from Entity to start from - the entity to be queried
         * @param {medicinejava.Entity} to Entity to end at - the putative relative
         * @param {number} relations An integer representing which relations to follow, as a
         * binary 'OR' of Entity.CAUSE, Entity.EFFECT etc.
         * @param {number} maxRecursionDepth maximum number of items in causal chain,
         * including parents
         * @param {Array} excludeItems List of items to exclude in the search. This is
         * used in recursion to cumulate entities already visited. Can be null.
         * @param {number} temporarilyAvoidDirections - a set of relations in which not
         * to travel on the next step. This is used to avoid back-traversal on
         * successive iterations.
         * @return {Array} The vector of vectors, each of which is a list of entities
         * traversed in order to go from 'from' to 'to'. Each item in the return
         * value is a vector which begins with 'from' and ends with 'to', containing
         * the relevant intermediate entities. If no routes are found, an empty
         * vector is returned.
         * @param {Array} currentSolutions
         * @param {Array} currentChain
         */
        Entities.findRelationChains = function (from, to, relations, maxRecursionDepth, excludeItems, currentSolutions, currentChain, temporarilyAvoidDirections) {
            if (excludeItems == null)
                excludeItems = ([]);
            if (currentChain == null)
                currentChain = ([]);
            if (currentSolutions == null)
                currentSolutions = ([]);
            if ((excludeItems.indexOf((from)) >= 0))
                return currentSolutions;
            if (maxRecursionDepth <= 0)
                return currentSolutions;
            currentChain = (function (o) { if (o.clone != undefined) {
                return o.clone();
            }
            else {
                var clone = Object.create(o);
                for (var p in o) {
                    if (o.hasOwnProperty(p))
                        clone[p] = o[p];
                }
                return clone;
            } })(currentChain);
            /* add */ (currentChain.push(from) > 0);
            if (from === to) {
                /* add */ (currentSolutions.push(currentChain) > 0);
                return currentSolutions;
            }
            for (var i = 0; i < medicinejava.Entity.relationList_$LI$().length; i++) {
                {
                    var currentRelation = medicinejava.Entity.relationList_$LI$()[i];
                    if ((currentRelation & temporarilyAvoidDirections) > 0)
                        continue;
                    if ((relations & currentRelation) > 0) {
                        var v = Entity.fromJSON(from).listOf(currentRelation);
                        for (var j = 0; j < v.length; j++) {
                            {
                                var e = v[j];
                                var newExcludeItems = (excludeItems.slice(0));
                                /* add */ (newExcludeItems.push(from) > 0);
                                Entities.findRelationChains(e, to, relations, maxRecursionDepth - 1, newExcludeItems, currentSolutions, currentChain, medicinejava.Entity.inverseOf(currentRelation));
                            }
                            ;
                        }
                    }
                }
                ;
            }
            return currentSolutions;
        };
        Entities.findRelationChainsSorted = function (from, to, relations, maxRecursionDepth, excludeItems, currentSolutions, currentChain, temporarilyAvoidDirections) {
            var solutions = Entities.findRelationChains(from, to, relations, maxRecursionDepth, excludeItems, currentSolutions, currentChain, temporarilyAvoidDirections);
            var sorter = function (o1, o2) {
                return o1.length - o2.length;
            };
            /* sort */ (function (l, c) { if (c.compare)
                l.sort(function (e1, e2) { return c.compare(e1, e2); });
            else
                l.sort(c); })(solutions, sorter);
            return solutions;
        };
        Entities.toLowerCase = function (e) {
            var n; /** SGM */
            if(typeof e !== "string"){   // entity object
              var n = e.name;
            }else{
              n = e;
            }
            var startword = true;
            for (var j = 0; j < n.length; j++) {
                {
                    if (startword && (j < n.length - 1) && (function (s) { return s.toUpperCase() === s; })(n.charAt(j)) && (function (s) { return s.toLowerCase() === s; })(n.charAt(j + 1))) {
                        n = n.substring(0, j) + n.charAt(j).toLowerCase() + n.substring(j + 1);
                    }
                    //startword = javaemul.internal.CharacterHelper.isWhitespace(n.charAt(j));
                    startword = /\s/.test(n.charAt(j)); /* SGM */
                }
                ;
            }
            return n;
        };
        /**
         * Convert a vector of connectivity  into a text
         * @param {Array} ch
         * @return {string}
         */
        Entities.chainText = function (ch) {
            var fr = ch[0];
            var out = fr.name;
            for (var i = 1; i < ch.length; i++) {
                {
                    var to = ch[i];
                    var found = false;
                    for (var j = 0; j < medicinejava.Entity.relationList_$LI$().length; j++) {
                        {
                            if ((fr.listOf(medicinejava.Entity.relationList_$LI$()[j]).indexOf((to)) >= 0)) {
                                var tmp = void 0;
                                if (i === 1)
                                    tmp = " is a ";
                                else
                                    tmp = ", which is a ";
                                if (medicinejava.Entity.inverseOf(medicinejava.Entity.relationList_$LI$()[j]) !== medicinejava.Entity.CHILD)
                                    out += tmp + Entities.getRelationNamesFromBits(medicinejava.Entity.inverseOf(medicinejava.Entity.relationList_$LI$()[j])) + " of " + 
                                     /*to.name.toLowerCase()*/   /* SGM  - not an entity now */
                                     to.toLowerCase();
                                else
                                  /*
                                    out += tmp + " " + to.name.toLowerCase();
                                  */  /* SGM */
                                    out += tmp + " " + to.toLowerCase();
                                found = true;
                                break;
                            }
                        }
                        ;
                    }
                    if (!found)
                        throw Object.defineProperty(new Error("Ill-formed chain, " + (function (a) { return a ? '[' + a.join(', ') + ']' : 'null'; })(ch)), '__classes', { configurable: true, value: ['java.lang.Throwable', 'java.lang.Object', 'java.lang.RuntimeException', 'java.lang.IllegalArgumentException', 'java.lang.Exception'] });
                    fr = to;
                }
                ;
            }
            return out + ".";
        };
        /**
         * Convert a Vector to a colloquial text list
         * (lower case with commas and 'and')
         * @param {Array} v
         * @return {string}
         */
        Entities.listToText = function (v) {
            var sb = { str: "", toString: function () { return this.str; } };
            var _loop_3 = function (i) {
                {
                    var e = v[i];
                    var n_1 = Entities.toLowerCase(e);
                    /* append */ (function (sb) { sb.str = sb.str.concat(n_1); return sb; })(sb);
                    if (i === v.length - 2)
                        (function (sb) { sb.str = sb.str.concat(" and "); return sb; })(sb);
                    else if (i < v.length - 2)
                        (function (sb) { sb.str = sb.str.concat(", "); return sb; })(sb);
                }
                ;
            };
            for (var i = 0; i < v.length; i++) {
                _loop_3(i);
            }
            if (sb.str.length > 0)
                return sb.str;
            else
                return null;
        };
        /**
         * Group a list according to their standard ultimate parents.
         * Returns a hashtable of sublists of entities.
         * @param {medicinejava.Entity[]} c
         * @param {number} i
         * @return {*}
         */
        Entities.groupedVectors = function (c, i) {
            var r = ({});
            for (var index18062 = 0; index18062 < c.length; index18062++) {
                var e = c[index18062];
                {
                    var pe = Entities.getUltimateParents(e);
                    var pn = void 0;
                    if (pe != null) {
                        pn = pe.name;
                    }
                    else {
                        pn = "Other";
                    }
                    var v = (function (m, k) { return m[k] === undefined ? null : m[k]; })(r, pn);
                    if (v == null) {
                        v = ([]);
                        /* put */ (r[pn] = v);
                    }
                    /* add */ (v.push(e) > 0);
                }
            }
            var modresult = (function (o) { var c = {}; for (var k in Object.keys(o)) {
                c[k] = o[k];
            } return c; })(r);
            {
                var array18064 = Object.keys(r);
                for (var index18063 = 0; index18063 < array18064.length; index18063++) {
                    var k = array18064[index18063];
                    {
                        var l = (function (m, k) { return m[k] === undefined ? null : m[k]; })(r, k);
                        if (l.length > Entities.MAX_LIST_SIZE) {
                            /* put */ (function (m, k, v) { if (m.entries == null)
                                m.entries = []; for (var i_11 = 0; i_11 < m.entries.length; i_11++)
                                if (m.entries[i_11].key.equals != null && m.entries[i_11].key.equals(k) || m.entries[i_11].key === k) {
                                    m.entries[i_11].value = v;
                                    return;
                                } m.entries.push({ key: k, value: v, getKey: function () { return this.key; }, getValue: function () { return this.value; } }); })(modresult, k, Entities.regroup(l));
                        }
                    }
                }
            }
            return modresult;
        };
        Entities.regroup = function (v) {
            var highestlevel = 0;
            var maxgrp = v.length;
            var hier = ([]);
            for (var index18065 = 0; index18065 < v.length; index18065++) {
                var e = v[index18065];
                {
                    var h = Entities.getChainOfFirstItem(e, medicinejava.Entity.PARENT);
                    /* reverse */ h.reverse();
                    /* add */ (hier.push(h) > 0);
                }
            }
            var uniques = null;
            var grpitems = null;
            while ((maxgrp > Entities.MAX_LIST_SIZE && highestlevel < 4)) {
                {
                    highestlevel++;
                    uniques = ([]);
                    var grpsize = ([]);
                    grpitems = ([]);
                    for (var index18066 = 0; index18066 < hier.length; index18066++) {
                        var h = hier[index18066];
                        {
                            var top_1 = h[Math.max(0, Math.min(highestlevel, /* size */ h.length - 2))];
                            if (!(uniques.indexOf((top_1)) >= 0)) {
                                /* add */ (uniques.push(top_1) > 0);
                                var le = ([]);
                                /* add */ (grpitems.push(le) > 0);
                                /* add */ (le.push(/* lastElement */ (function (s) { return s[s.length - 1]; })(h)) > 0);
                                /* add */ (grpsize.push(1) > 0);
                            }
                            else {
                                var ix = uniques.indexOf(top_1);
                                /* add */ (grpitems[ix].push(/* lastElement */ (function (s) { return s[s.length - 1]; })(h)) > 0);
                                /* set */ (grpsize[ix] = grpsize[ix] + 1);
                            }
                        }
                    }
                    maxgrp = 0;
                    for (var index18067 = 0; index18067 < grpsize.length; index18067++) {
                        var i = grpsize[index18067];
                        if (maxgrp < i) {
                            maxgrp = i;
                        }
                    }
                }
            }
            ;
            var result = ({});
            if (uniques == null) {
                return null;
            }
            var MIN_SIZE = 2;
            for (var index18068 = 0; index18068 < uniques.length; index18068++) {
                var u = uniques[index18068];
                {
                    var vi = grpitems[uniques.indexOf(u)];
                    if (vi.length >= MIN_SIZE)
                        (result[u.name] = vi);
                    else {
                        for (var index18069 = 0; index18069 < vi.length; index18069++) {
                            var ei = vi[index18069];
                            /* put */ (result[ei.name] = ei);
                        }
                    }
                }
            }
            return result;
        };
        return Entities;
    }());
    /**
     * bits representing which ultimate parent
     */
    Entities.E_DISEASE = 1;
    /**
     * bits representing which ultimate parent
     */
    Entities.E_PATHOLOGY = 2;
    /**
     * bits representing which ultimate parent
     */
    Entities.E_INVESTIGATION = 4;
    /**
     * bits representing which ultimate parent
     */
    Entities.E_SIGN = 8;
    /**
     * bits representing which ultimate parent
     */
    Entities.E_SYMPTOM = 16;
    /**
     * bits representing which ultimate parent
     */
    Entities.E_SUBSTANCE = 32;
    /**
     * bits representing which ultimate parent
     */
    Entities.E_TREATMENT = 64;
    /**
     * bits representing which ultimate parent
     */
    Entities.E_LIFESTYLE = 128;
    /**
     * If false, then the stream readers will only add the connections in
     * one direction, for each entity. This means it is possible to have
     * connections that only go one way (which is of course illegal),
     * so caution must be used that the file is valid. On the other hand
     * The order of the items is well specified by the file- the order will
     * be lost if two-directional adding is enabled by setting the value to
     * 'true'.
     */
    Entities.ENSURE_VALIIDTY_AT_EXPENSE_OF_ORDER = false;
    Entities.MAX_LIST_SIZE = 5;
    medicinejava.Entities = Entities;
    Entities["__class"] = "medicinejava.Entities";
    (function (Entities) {
        var EOF = (function () {
            function EOF() {
                Object.setPrototypeOf(this, EOF.prototype);
            }
            return EOF;
        }());
        Entities.EOF = EOF;
        EOF["__class"] = "medicinejava.Entities.EOF";
        EOF["__interfaces"] = ["java.io.Serializable"];
        var EOE = (function () {
            function EOE() {
                Object.setPrototypeOf(this, EOE.prototype);
            }
            return EOE;
        }());
        Entities.EOE = EOE;
        EOE["__class"] = "medicinejava.Entities.EOE";
        EOE["__interfaces"] = ["java.io.Serializable"];
        var AmbiguityException = (function (_super) {
            __extends(AmbiguityException, _super);
            function AmbiguityException(s) {
                var _this = this;
                if (((typeof s === 'string') || s === null)) {
                    var __args = arguments;
                    _this = _super.call(this, s) || this;
                    _this.message = s;
                    Object.setPrototypeOf(_this, AmbiguityException.prototype);
                }
                else if (s === undefined) {
                    var __args = arguments;
                    _this = _super.call(this) || this;
                    Object.setPrototypeOf(_this, AmbiguityException.prototype);
                }
                else
                    throw new Error('invalid overload');
                return _this;
            }
            return AmbiguityException;
        }(Error));
        Entities.AmbiguityException = AmbiguityException;
        AmbiguityException["__class"] = "medicinejava.Entities.AmbiguityException";
        AmbiguityException["__interfaces"] = ["java.io.Serializable"];
    })(Entities = medicinejava.Entities || (medicinejava.Entities = {}));
    var EntityNotFoundException = (function (_super) {
        __extends(EntityNotFoundException, _super);
        function EntityNotFoundException(s) {
            var _this = _super.call(this, s) || this;
            _this.message = s;
            Object.setPrototypeOf(_this, EntityNotFoundException.prototype);
            return _this;
        }
        return EntityNotFoundException;
    }(Error));
    medicinejava.EntityNotFoundException = EntityNotFoundException;
    EntityNotFoundException["__class"] = "medicinejava.EntityNotFoundException";
    EntityNotFoundException["__interfaces"] = ["java.io.Serializable"];
    var Stem = (function () {
        function Stem() {
            if (this.entity === undefined)
                this.entity = null;
            if (this.correct === undefined)
                this.correct = false;
            if (this.reasoning === undefined)
                this.reasoning = null;
        }
        return Stem;
    }());
    medicinejava.Stem = Stem;
    Stem["__class"] = "medicinejava.Stem";
    var Essay = (function () {
        function Essay(e) {
            this.text = "";
            if (this.e === undefined)
                this.e = null;
            this.e = e;
        }
        Essay.prototype.createText = function () {
            this.text = Essay.getText(this.e);
            return this.text;
        };
        Essay.getText = function (e) {
            var text;
            text = e.name;
            if (e.synonyms.length > 0) {
                text += ", also known as";
                for (var i = 0; i < e.synonyms.length; i++) {
                    {
                        text += " " + e.synonyms[i].toString() + ",";
                    }
                    ;
                }
            }
            var tmp = "";
            if (e.parents.length === 1) {
                text += " is a " + e.parents[0].name.toLowerCase() + ". ";
            }
            else {
                text += " is a " + medicinejava.Entities.listToText(e.parents) + ". ";
            }
            if (e.children.length > 0) {
                if (e.children.length === 1) {
                }
                else {
                    tmp = "Its subtypes include " + medicinejava.Entities.listToText(e.children);
                }
            }
            var causelist = medicinejava.Entities.listToText(e.causes);
            if (causelist != null)
                text = text + "It can be caused by " + causelist + ". ";
            var effectlist = medicinejava.Entities.listToText(e.effects);
            if (effectlist != null)
                text = text + "It is known to cause " + effectlist + ". ";
            var rxlist = medicinejava.Entities.listToText(e.treats);
            if (rxlist != null)
                text = text + "It is used to treat " + rxlist + ". ";
            rxlist = medicinejava.Entities.listToText(e.treatments);
            if (rxlist != null)
                text = text + "It can be treated with " + rxlist + ". ";
            text = text + " " + e.description;
            return text;
        };
        return Essay;
    }());
    medicinejava.Essay = Essay;
    Essay["__class"] = "medicinejava.Essay";
    var Question = (function () {
        function Question() {
            this.correctStem = ([]);
            this.errorStems = ([]);
            if (this.direction === undefined)
                this.direction = 0;
            if (this.root === undefined)
                this.root = null;
            if (this.head === undefined)
                this.head = null;
            if (this.mode === undefined)
                this.mode = 0;
            if (this.difficulty === undefined)
                this.difficulty = 0;
            if (this.status === undefined)
                this.status = 0;
        }
        Question.prototype.getCorrectStems = function () {
            return this.correctStem;
        };
        Question.prototype.getIncorrectStems = function () {
            return this.errorStems;
        };
        Question.prototype.toProps = function () {
            var p = new Object();
            for (var i = 0; i < this.correctStem.length; i++) {
                {
                    /* setProperty */ (function (m, k, v) { if (m.entries == null)
                        m.entries = []; for (var i_12 = 0; i_12 < m.entries.length; i_12++)
                        if (m.entries[i_12].key.equals != null && m.entries[i_12].key.equals(k) || m.entries[i_12].key === k) {
                            m.entries[i_12].value = v;
                            return;
                        } m.entries.push({ key: k, value: v, getKey: function () { return this.key; }, getValue: function () { return this.value; } }); })(p, "Correct" + i, /* get */ this.correctStem[i].entity.toString());
                    /* setProperty */ (function (m, k, v) { if (m.entries == null)
                        m.entries = []; for (var i_13 = 0; i_13 < m.entries.length; i_13++)
                        if (m.entries[i_13].key.equals != null && m.entries[i_13].key.equals(k) || m.entries[i_13].key === k) {
                            m.entries[i_13].value = v;
                            return;
                        } m.entries.push({ key: k, value: v, getKey: function () { return this.key; }, getValue: function () { return this.value; } }); })(p, "CorrectReasoning" + i, /* get */ this.correctStem[i].reasoning);
                }
                ;
            }
            for (var i = 0; i < this.errorStems.length; i++) {
                {
                    /* setProperty */ (function (m, k, v) { if (m.entries == null)
                        m.entries = []; for (var i_14 = 0; i_14 < m.entries.length; i_14++)
                        if (m.entries[i_14].key.equals != null && m.entries[i_14].key.equals(k) || m.entries[i_14].key === k) {
                            m.entries[i_14].value = v;
                            return;
                        } m.entries.push({ key: k, value: v, getKey: function () { return this.key; }, getValue: function () { return this.value; } }); })(p, "Incorrect" + i, /* get */ this.errorStems[i].entity.toString());
                    /* setProperty */ (function (m, k, v) { if (m.entries == null)
                        m.entries = []; for (var i_15 = 0; i_15 < m.entries.length; i_15++)
                        if (m.entries[i_15].key.equals != null && m.entries[i_15].key.equals(k) || m.entries[i_15].key === k) {
                            m.entries[i_15].value = v;
                            return;
                        } m.entries.push({ key: k, value: v, getKey: function () { return this.key; }, getValue: function () { return this.value; } }); })(p, "IncorrectReasoning" + i, /* get */ this.errorStems[i].reasoning);
                }
                ;
            }
            /* setProperty */ (function (m, k, v) { if (m.entries == null)
                m.entries = []; for (var i = 0; i < m.entries.length; i++)
                if (m.entries[i].key.equals != null && m.entries[i].key.equals(k) || m.entries[i].key === k) {
                    m.entries[i].value = v;
                    return;
                } m.entries.push({ key: k, value: v, getKey: function () { return this.key; }, getValue: function () { return this.value; } }); })(p, "Head", this.head);
            /* setProperty */ (function (m, k, v) { if (m.entries == null)
                m.entries = []; for (var i = 0; i < m.entries.length; i++)
                if (m.entries[i].key.equals != null && m.entries[i].key.equals(k) || m.entries[i].key === k) {
                    m.entries[i].value = v;
                    return;
                } m.entries.push({ key: k, value: v, getKey: function () { return this.key; }, getValue: function () { return this.value; } }); })(p, "Root", this.root.toString());
            /* setProperty */ (function (m, k, v) { if (m.entries == null)
                m.entries = []; for (var i = 0; i < m.entries.length; i++)
                if (m.entries[i].key.equals != null && m.entries[i].key.equals(k) || m.entries[i].key === k) {
                    m.entries[i].value = v;
                    return;
                } m.entries.push({ key: k, value: v, getKey: function () { return this.key; }, getValue: function () { return this.value; } }); })(p, "Direction", /* valueOf */ new String(this.direction).toString());
            /* setProperty */ (function (m, k, v) { if (m.entries == null)
                m.entries = []; for (var i = 0; i < m.entries.length; i++)
                if (m.entries[i].key.equals != null && m.entries[i].key.equals(k) || m.entries[i].key === k) {
                    m.entries[i].value = v;
                    return;
                } m.entries.push({ key: k, value: v, getKey: function () { return this.key; }, getValue: function () { return this.value; } }); })(p, "Mode", /* valueOf */ new String(this.mode).toString());
            /* setProperty */ (function (m, k, v) { if (m.entries == null)
                m.entries = []; for (var i = 0; i < m.entries.length; i++)
                if (m.entries[i].key.equals != null && m.entries[i].key.equals(k) || m.entries[i].key === k) {
                    m.entries[i].value = v;
                    return;
                } m.entries.push({ key: k, value: v, getKey: function () { return this.key; }, getValue: function () { return this.value; } }); })(p, "Difficulty", /* valueOf */ new String(this.difficulty).toString());
            return p;
        };
        Question.prototype.fromProps = function (p, ed) {
            var i = 0;
            var o;
            do {
                {
                    o = (function (m, k) { if (m.entries == null)
                        m.entries = []; for (var i_16 = 0; i_16 < m.entries.length; i_16++)
                        if (m.entries[i_16].key.equals != null && m.entries[i_16].key.equals(k) || m.entries[i_16].key === k) {
                            return m.entries[i_16].value;
                        } return null; })(p, "Correct" + i);
                    if (o != null) {
                        var s = new medicinejava.Stem();
                        s.correct = true;
                        s.entity = ed.findEntityExact(o);
                        if (s.entity == null)
                            s.entity = new Question.FakeEntity(o);
                        s.reasoning = (function (m, k) { if (m.entries == null)
                            m.entries = []; for (var i_17 = 0; i_17 < m.entries.length; i_17++)
                            if (m.entries[i_17].key.equals != null && m.entries[i_17].key.equals(k) || m.entries[i_17].key === k) {
                                return m.entries[i_17].value;
                            } return null; })(p, "CorrectReasoning" + i);
                        /* add */ (this.correctStem.push(s) > 0);
                    }
                    i++;
                }
            } while ((o != null));
            i = 0;
            o = null;
            do {
                {
                    o = (function (m, k) { if (m.entries == null)
                        m.entries = []; for (var i_18 = 0; i_18 < m.entries.length; i_18++)
                        if (m.entries[i_18].key.equals != null && m.entries[i_18].key.equals(k) || m.entries[i_18].key === k) {
                            return m.entries[i_18].value;
                        } return null; })(p, "Incorrect" + i);
                    if (o != null) {
                        var s = new medicinejava.Stem();
                        s.correct = false;
                        s.entity = ed.findEntityExact(o);
                        if (s.entity == null)
                            s.entity = new Question.FakeEntity(o);
                        s.reasoning = (function (m, k) { if (m.entries == null)
                            m.entries = []; for (var i_19 = 0; i_19 < m.entries.length; i_19++)
                            if (m.entries[i_19].key.equals != null && m.entries[i_19].key.equals(k) || m.entries[i_19].key === k) {
                                return m.entries[i_19].value;
                            } return null; })(p, "IncorrectReasoning" + i);
                        /* add */ (this.errorStems.push(s) > 0);
                    }
                    i++;
                }
            } while ((o != null));
            this.head = (function (m, k) { if (m.entries == null)
                m.entries = []; for (var i_20 = 0; i_20 < m.entries.length; i_20++)
                if (m.entries[i_20].key.equals != null && m.entries[i_20].key.equals(k) || m.entries[i_20].key === k) {
                    return m.entries[i_20].value;
                } return null; })(p, "Head");
            this.root = ed.findEntityExact(/* getProperty */ (function (m, k) { if (m.entries == null)
                m.entries = []; for (var i_21 = 0; i_21 < m.entries.length; i_21++)
                if (m.entries[i_21].key.equals != null && m.entries[i_21].key.equals(k) || m.entries[i_21].key === k) {
                    return m.entries[i_21].value;
                } return null; })(p, "Root"));
            this.direction = parseFloat(/* getProperty */ (function (m, k) { if (m.entries == null)
                m.entries = []; for (var i_22 = 0; i_22 < m.entries.length; i_22++)
                if (m.entries[i_22].key.equals != null && m.entries[i_22].key.equals(k) || m.entries[i_22].key === k) {
                    return m.entries[i_22].value;
                } return null; })(p, "Direction"));
            this.mode = parseFloat(/* getProperty */ (function (m, k) { if (m.entries == null)
                m.entries = []; for (var i_23 = 0; i_23 < m.entries.length; i_23++)
                if (m.entries[i_23].key.equals != null && m.entries[i_23].key.equals(k) || m.entries[i_23].key === k) {
                    return m.entries[i_23].value;
                } return null; })(p, "Mode"));
            this.difficulty = parseFloat(/* getProperty */ (function (m, k) { if (m.entries == null)
                m.entries = []; for (var i_24 = 0; i_24 < m.entries.length; i_24++)
                if (m.entries[i_24].key.equals != null && m.entries[i_24].key.equals(k) || m.entries[i_24].key === k) {
                    return m.entries[i_24].value;
                } return null; })(p, "Difficulty"));
        };
        return Question;
    }());
    /**
     * possible difficulty levels
     */
    Question.DIF1 = 1;
    /**
     * possible difficulty levels
     */
    Question.DIF2 = 2;
    /**
     * possible difficulty levels
     */
    Question.DIF3 = 3;
    /**
     * possible difficulty levels
     */
    Question.DIF4 = 4;
    /**
     * possible status values
     */
    Question.STAT_OK = 3;
    /**
     * possible status values
     */
    Question.STAT_CHECK = 2;
    /**
     * possible status values
     */
    Question.STAT_UNCHECKED = 1;
    medicinejava.Question = Question;
    Question["__class"] = "medicinejava.Question";
    Question["__interfaces"] = ["java.io.Serializable"];
    (function (Question) {
        var FakeEntity = (function (_super) {
            __extends(FakeEntity, _super);
            function FakeEntity(s) {
                var _this = _super.call(this, null, 0) || this;
                _this.name = s;
                return _this;
            }
            return FakeEntity;
        }(medicinejava.Entity));
        Question.FakeEntity = FakeEntity;
        FakeEntity["__class"] = "medicinejava.Question.FakeEntity";
        FakeEntity["__interfaces"] = ["java.io.Serializable"];
    })(Question = medicinejava.Question || (medicinejava.Question = {}));
})(medicinejava || (medicinejava = {}));
medicinejava.Entities.standardStrings_$LI$();
medicinejava.Entity.relationNameList_$LI$();
medicinejava.Entity.relationList_$LI$();
medicinejava.Logic.MODE_NAMES_$LI$();
