/* Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org */
namespace medicinejava {
    export class Logic {
        /**
         * Logic modes - how to choose alternatives!
         */
        static MODE_RANDOM_TYPED : number = 0;

        /**
         * Logic modes - how to choose alternatives!
         */
        static MODE_RANDOM_RELATED : number = 1;

        /**
         * Logic modes - how to choose alternatives!
         */
        static MODE_COMPLETELY_RANDOM : number = 2;

        /**
         * Logic modes - how to choose alternatives!
         */
        static MODE_SOUNDS_SIMILAR : number = 3;

        /**
         * Logic modes - how to choose alternatives!
         */
        static MODE_BROTHER_OF_CORRECT : number = 4;

        /**
         * Logic modes - how to choose alternatives!
         */
        static MODE_BROTHER_OF_ROOT : number = 5;

        static MODE_NAMES : string[]; public static MODE_NAMES_$LI$() : string[] { if(Logic.MODE_NAMES == null) Logic.MODE_NAMES = ["Random typed", "Random related", "Random.", "Looks similar", "Brother of correct", "Brother of root"]; return Logic.MODE_NAMES; };

        ed : medicinejava.EntityData;

        seed : medicinejava.Entity;

        /**
         * number of incorrect answers to generate
         */
        N : number = 4;

        /**
         * Choose a random item as the root
         */
        randomroot : boolean = false;

        /**
         * Restrict possible roots to items with proper ultimate parents
         */
        restrRoot : boolean = false;

        /**
         * Restrict possible stems to items with proper ultimate parents
         */
        restrChoice : boolean = false;

        /**
         * Include descriptions in the reasoning
         */
        INCLUDE_DESCRIPTION : boolean = true;

        /**
         * permitted direction for question
         */
        DIRECTIONS : number[] = [medicinejava.Entity.CAUSE, medicinejava.Entity.EFFECT, medicinejava.Entity.TREATMENTS, medicinejava.Entity.TREATS];

        /**
         * 
         * an array of pairs of strings that wrap the root entity;
         * currently one pair for each direction of questioning.
         */
        questionHead : string[][] = [["Which of the following is most likely to be the cause of ", "?"], ["Which of the following are commonly associated with ", "?"], ["Which of the following might be used to treat ", "?"], ["Which of the following is most likely to be treated with ", "?"]];

        /**
         * current question data:
         */
        incorrect : medicinejava.Entity[];

        infoText : string;

        infoIncor : string[];

        infoCorrect : string;

        /**
         * create a question, with new root, new correct, and store it in q.
         * @param {number} mode
         */
        newQuestion(mode : number) {
            this.q = new medicinejava.Question();
            if(this.randomroot) {
                let ok : boolean = false;
                while((!ok)) {{
                    this.q.root = this.ed.getRandomEntity();
                    ok = ((lhs, rhs) => lhs || rhs)(!this.restrRoot, medicinejava.Entities.hasAStandardUltimateParent(this.q.root));
                }};
            } else this.q.root = this.seed;
            this.seed = this.q.root;
            this.q.mode = mode;
            let d1 : number;
            let d2 : number;
            let attempt : number = 0;
            let numposs : number = 0;
            do {{
                this.q.direction = (<number>Math.floor(Math.random() * this.DIRECTIONS.length)|0);
                d1 = this.DIRECTIONS[this.q.direction];
                d2 = medicinejava.Entity.inverseOf(d1);
                this.q.head = this.questionHead[this.q.direction][0] + this.q.root + this.questionHead[this.q.direction][1];
                numposs = /* size */(<number>this.q.root.listOf(d1).length);
            }} while((numposs === 0 && attempt++ < 10));
            if(attempt >= 10) throw Object.defineProperty(new Error("Unable to find any questions for " + this.q.root), '__classes', { configurable: true, value: ['java.lang.Throwable','java.lang.IllegalStateException','java.lang.Object','java.lang.RuntimeException','java.lang.Exception'] });
            let corrStem : medicinejava.Stem = new medicinejava.Stem();
            /* add */(this.q.correctStem.push(corrStem)>0);
            corrStem.correct = true;
            let correct : medicinejava.Entity = <medicinejava.Entity>/* get */this.q.root.listOf(d1)[(<number>Math.floor(Math.random() * numposs)|0)];
            corrStem.entity = correct;
            let correctTypeT : medicinejava.Entity = medicinejava.Entities.getUltimateParents(correct);
            let corrD2 : Array<any> = correct.listOf(d2);
            /* remove */(a => { let index = a.indexOf(this.q.root); if(index>=0) { a.splice(index, 1); return true; } else { return false; }})(corrD2);
            let rel1 : string = d1 === medicinejava.Entity.CAUSE?"Causes":d1 === medicinejava.Entity.EFFECT?"Effects":d1 === medicinejava.Entity.TREATMENTS?"Treatments":d1 === medicinejava.Entity.TREATS?"Uses":"ERROR";
            let rel2 : string = d1 === medicinejava.Entity.CAUSE?"can cause":d1 === medicinejava.Entity.EFFECT?"can be caused by":d1 === medicinejava.Entity.TREATMENTS?"can treat":"can be treated by";
            let rel3 : string = d1 === medicinejava.Entity.CAUSE?"Effects":d1 === medicinejava.Entity.EFFECT?"Causes":d1 === medicinejava.Entity.TREATMENTS?"Uses":"Treatments";
            corrStem.reasoning = rel1 + " of " + this.q.root + " include " + medicinejava.Entities.listToText(this.q.root.listOf(d1)) + ". \n";
            if(/* size */(<number>corrD2.length) > 0) corrStem.reasoning += correct + " also " + rel2 + " " + medicinejava.Entities.listToText(corrD2) + ".";
            if(this.INCLUDE_DESCRIPTION) corrStem.reasoning += '\n' + this.q.root.description;
            this.incorrect = (s => { let a=[]; while(s-->0) a.push(null); return a; })(this.N);
            this.infoIncor = (s => { let a=[]; while(s-->0) a.push(null); return a; })(this.N);
            for(let i : number = 0; i < this.N; i++) {{
                let s : medicinejava.Stem = this.newIncorrect$medicinejava_Entity_A$medicinejava_Entity$medicinejava_Entity$int$int(this.incorrect, this.q.root, correct, this.q.direction, this.q.mode);
                /* add */(this.q.errorStems.push(s)>0);
                this.incorrect[i] = s.entity;
            };}
            this.infoText = "Incorrect answers are all " + this.infoText;
        }

        public newIncorrect$medicinejava_Entity_A$medicinejava_Entity$medicinejava_Entity$int$int(exclude : medicinejava.Entity[], root : medicinejava.Entity, correct : medicinejava.Entity, dirn : number, mode : number) : medicinejava.Stem {
            let attempt : number = 0;
            let isOK : boolean = false;
            let s : medicinejava.Stem = null;
            while((attempt++ < 100 && !isOK)) {{
                s = this.newIncorrect$medicinejava_Entity$medicinejava_Entity$int$int(root, correct, dirn, mode);
                isOK = true;
                for(let i : number = 0; i < exclude.length; i++) {{
                    if(s.entity === exclude[i]) isOK = false;
                };}
            }};
            if(!isOK) throw new Logic.TryAgain();
            return s;
        }

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
        public newIncorrect(exclude? : any, root? : any, correct? : any, dirn? : any, mode? : any) : any {
            if(((exclude != null && exclude instanceof <any>Array && (exclude.length==0 || exclude[0] == null ||(exclude[0] != null && exclude[0] instanceof <any>medicinejava.Entity))) || exclude === null) && ((root != null && root instanceof <any>medicinejava.Entity) || root === null) && ((correct != null && correct instanceof <any>medicinejava.Entity) || correct === null) && ((typeof dirn === 'number') || dirn === null) && ((typeof mode === 'number') || mode === null)) {
                return <any>this.newIncorrect$medicinejava_Entity_A$medicinejava_Entity$medicinejava_Entity$int$int(exclude, root, correct, dirn, mode);
            } else if(((exclude != null && exclude instanceof <any>medicinejava.Entity) || exclude === null) && ((root != null && root instanceof <any>medicinejava.Entity) || root === null) && ((typeof correct === 'number') || correct === null) && ((typeof dirn === 'number') || dirn === null) && mode === undefined) {
                return <any>this.newIncorrect$medicinejava_Entity$medicinejava_Entity$int$int(exclude, root, correct, dirn);
            } else throw new Error('invalid overload');
        }

        newIncorrect$medicinejava_Entity$medicinejava_Entity$int$int(root : medicinejava.Entity, correct : medicinejava.Entity, dirn : number, mode : number) : medicinejava.Stem {
            let stem : medicinejava.Stem = new medicinejava.Stem();
            stem.correct = false;
            let d1 : number = this.DIRECTIONS[dirn];
            let d2 : number = medicinejava.Entity.inverseOf(d1);
            let rel1 : string = d1 === medicinejava.Entity.CAUSE?"Causes":"Effects";
            let rel2 : string = d1 === medicinejava.Entity.CAUSE?"can cause":"can be caused by";
            let rel3 : string = d1 === medicinejava.Entity.CAUSE?"Effects":"Causes";
            let rel4 : string = d1 === medicinejava.Entity.CAUSE?"can be caused by":"can cause";
            if(mode === Logic.MODE_RANDOM_TYPED || mode === Logic.MODE_RANDOM_RELATED || mode === Logic.MODE_COMPLETELY_RANDOM) {
                if(/* size */(<number>correct.parents.length) === 0) throw new Logic.TryAgain();
                let correctType1 : medicinejava.Entity = <medicinejava.Entity>/* get */correct.parents[0];
                let correctType2 : medicinejava.Entity = null;
                if(/* size */(<number>correctType1.parents.length) > 0 && Math.random() > 0.5) correctType2 = <medicinejava.Entity>/* get */correctType1.parents[0];
                let correctType0 : medicinejava.Entity = <medicinejava.Entity>medicinejava.Entities.getUltimateParents(correct);
                let tmp : medicinejava.Entity;
                let attempt : number = 0;
                let sametype : boolean = false;
                do {{
                    tmp = this.ed.getRandomEntity();
                    if(mode === Logic.MODE_RANDOM_RELATED) {
                        if(/* size */(<number>tmp.parents.length) === 0) sametype = false; else {
                            let tmpp : medicinejava.Entity = <medicinejava.Entity>/* get */tmp.parents[0];
                            sametype = tmpp === correctType1;
                        }
                        stem.reasoning = tmp + " is related to " + correct + " by being a type of " + correctType1;
                    } else if(mode === Logic.MODE_RANDOM_TYPED) {
                        sametype = medicinejava.Entities.getUltimateParents(tmp) === correctType0;
                        stem.reasoning = tmp + " is a " + correctType0;
                    } else if(mode === Logic.MODE_COMPLETELY_RANDOM) {
                        sametype = true;
                        stem.reasoning = "";
                    }
                }} while(((!sametype || medicinejava.Entities.isRelatedTo(root, tmp, d2 | medicinejava.Entity.PARENT | medicinejava.Entity.CHILD, 3, null) || correct === tmp) && attempt++ < 5000));
                if(attempt >= 5000) throw Object.defineProperty(new Error("Unable to find an unrelated (" + d1 + ") item to " + root + ", of type " + correctType1), '__classes', { configurable: true, value: ['java.lang.Throwable','java.lang.IllegalStateException','java.lang.Object','java.lang.RuntimeException','java.lang.Exception'] });
                this.infoText = "randomly related";
                stem.entity = tmp;
                if(/* size */(<number>stem.entity.listOf(d1).length) > 0) stem.reasoning += " It " + rel4 + " " + medicinejava.Entities.listToText(stem.entity.listOf(d1)) + ".";
                if(/* size */(<number>stem.entity.listOf(d2).length) > 0) stem.reasoning += " It " + rel2 + " " + medicinejava.Entities.listToText(stem.entity.listOf(d2)) + ".";
            } else if(mode === Logic.MODE_SOUNDS_SIMILAR) {
                let NS : number = 7;
                let es : Array<any> = this.ed.getAllEntities();
                let score : number[] = (s => { let a=[]; while(s-->0) a.push(0); return a; })(/* size */(<number>es.length));
                let hiscore : number[] = (s => { let a=[]; while(s-->0) a.push(0); return a; })(NS);
                let hient : medicinejava.Entity[] = (s => { let a=[]; while(s-->0) a.push(null); return a; })(NS);
                let idx : number = 0;
                for(let i : number = 0; i < NS; i++) {hiscore[i] = 4.9E-324;}
                for(let i : any = /* iterator */((a) => { var i = 0; return { next: function() { return i<a.length?a[i++]:null; }, hasNext: function() { return i<a.length; }}})(es); i.hasNext(); idx++) {{
                    let ei : medicinejava.Entity = <medicinejava.Entity>i.next();
                    if(ei === correct || medicinejava.Entities.isRelatedTo(ei, correct, medicinejava.Entity.PARENT | medicinejava.Entity.CHILD | d1, 2, null)) continue;
                    score[idx] = Logic.compareStrings(ei.name, correct.name);
                    if(score[idx] > hiscore[0]) {
                        let inspos : number = 0;
                        while((inspos < NS - 1 && score[idx] > hiscore[inspos + 1])) {inspos++};
                        for(let j : number = 0; j < inspos; j++) {{
                            hiscore[j] = hiscore[j + 1];
                            hient[j] = hient[j + 1];
                        };}
                        hiscore[inspos] = score[idx];
                        hient[inspos] = ei;
                    }
                    this.infoText = "Lexically similar to " + correct;
                };}
                for(let i : number = 0; i < NS; i++) {{
                };}
                for(let i : number = 0; i < 5; i++) {if(hiscore[i] < 0.5) throw new Logic.TryAgain();;}
                this.currentBank = <any>(/* asList */hient.slice(0).slice(0));
                let i : number = (<number>(NS * Math.random())|0);
                stem.entity = hient[i];
                stem.reasoning = hient[i] + " could be confused with " + correct + ".";
                if(/* size */(<number>stem.entity.listOf(d1).length) > 0) stem.reasoning += " It " + rel4 + " " + medicinejava.Entities.listToText(stem.entity.listOf(d1)) + ".";
                if(/* size */(<number>stem.entity.listOf(d2).length) > 0) stem.reasoning += " It " + rel2 + " " + medicinejava.Entities.listToText(stem.entity.listOf(d2)) + ".";
            } else if(mode === Logic.MODE_BROTHER_OF_CORRECT) {
                if(/* size */(<number>correct.parents.length) === 0) throw new Logic.TryAgain();
                let p : medicinejava.Entity = <medicinejava.Entity>/* get */correct.parents[0];
                let s : Array<any> = <any>(medicinejava.Entities.getExtensiveListOf$int$medicinejava_Entity$int(medicinejava.Entity.CHILD, p, 10).slice(0));
                this.filterOutRelations(s, root, d2 | medicinejava.Entity.CHILD, 3);
                /* remove */(a => { let index = a.indexOf(correct); if(index>=0) { a.splice(index, 1); return true; } else { return false; }})(s);
                this.infoText = "Brothers of " + correct;
                if(/* size */(<number>s.length) < this.N) {
                    if(/* size */(<number>p.parents.length) > 0) p = <medicinejava.Entity>/* get */p.parents[0];
                    /* addAll */((l1, l2) => l1.push.apply(l1, l2))(s, medicinejava.Entities.getExtensiveListOf$int$medicinejava_Entity$int(medicinejava.Entity.CHILD, p, 10));
                    this.filterOutRelations(s, root, d2 | medicinejava.Entity.CHILD, 3);
                    /* remove */(a => { let index = a.indexOf(correct); if(index>=0) { a.splice(index, 1); return true; } else { return false; }})(s);
                    if(/* size */(<number>s.length) < this.N) throw new Logic.TryAgain();
                    this.infoText = "Cousins of " + correct;
                }
                this.currentBank = s;
                let i : number = (<number>(/* size */(<number>s.length) * Math.random())|0);
                stem.entity = <medicinejava.Entity>/* get */s[i];
                stem.reasoning = stem.entity + " is a type of " + p + ".";
                if(/* size */(<number>stem.entity.listOf(d1).length) > 0) stem.reasoning += " It " + rel4 + " " + medicinejava.Entities.listToText(stem.entity.listOf(d1)) + ".";
                if(/* size */(<number>stem.entity.listOf(d2).length) > 0) stem.reasoning += " It " + rel2 + " " + medicinejava.Entities.listToText(stem.entity.listOf(d2)) + ".";
            } else if(mode === Logic.MODE_BROTHER_OF_ROOT) {
                if(/* size */(<number>root.parents.length) === 0) throw new Logic.TryAgain();
                let p : medicinejava.Entity = <medicinejava.Entity>/* get */root.parents[0];
                let exclude : Array<any> = <any>([]);
                /* add */((s, e) => { if(s.indexOf(e)==-1) { s.push(e); return true; } else { return false; } })(exclude, root);
                let brothrs : Array<any> = medicinejava.Entities.getExtensiveListOf$int$medicinejava_Entity$int$java_util_Set(medicinejava.Entity.CHILD, p, 2, exclude);
                let rels : Array<any> = <any>([]);
                for(let i : any = /* iterator */((a) => { var i = 0; return { next: function() { return i<a.length?a[i++]:null; }, hasNext: function() { return i<a.length; }}})(brothrs); i.hasNext(); ) {{
                    let b : medicinejava.Entity = <medicinejava.Entity>i.next();
                    exclude = <any>([]);
                    /* add */((s, e) => { if(s.indexOf(e)==-1) { s.push(e); return true; } else { return false; } })(exclude, root);
                    /* addAll */((l1, l2) => l1.push.apply(l1, l2))(rels, medicinejava.Entities.getExtensiveListOf$int$medicinejava_Entity$int$java_util_Set(d1, b, 1, exclude));
                };}
                /* removeAll */((a, r) => { let b=false; for(let i=0;i<r.length;i++) { let ndx=a.indexOf(r[i]); if(ndx>=0) { a.splice(ndx, 1); b=true; } } return b; })(rels,brothrs);
                let v : Array<any> = <any>(rels.slice(0));
                this.filterOutRelations(v, root, d2, 3);
                if(/* size */(<number>v.length) === 0) throw new Logic.TryAgain();
                this.currentBank = v;
                let i : number = (<number>(/* size */(<number>v.length) * Math.random())|0);
                stem.entity = <medicinejava.Entity>/* get */v[i];
                let ch : Array<any> = medicinejava.Entities.findRelationChains(p, stem.entity, medicinejava.Entity.CHILD | d1, 4, null, null, null, 0);
                if(/* size */(<number>ch.length) === 0) throw Object.defineProperty(new Error("Could not find chain for brother of root: " + p + "\'s children\'s " + medicinejava.Entities.getRelationNamesFromBits(d1) + " don\'t include " + stem.entity), '__classes', { configurable: true, value: ['java.lang.Throwable','java.lang.IllegalStateException','java.lang.Object','java.lang.RuntimeException','java.lang.Exception'] });
                let shortest : number = 0;
                let shortlen : number = 100;
                let tmp : number;
                for(let j : number = 0; j < /* size */(<number>ch.length); j++) {if((tmp = /* size */(<number>(<Array<any>>/* get */ch[j]).length)) < shortlen) {
                    shortest = j;
                    shortlen = tmp;
                };}
                let inf : Array<any> = <Array<any>>/* get */ch[shortest];
                /* reverse */inf.reverse();
                try {
                    stem.reasoning = medicinejava.Entities.chainText(inf);
                } catch(x) {
                    console.error(x.message, x);
                };
                if(/* size */(<number>stem.entity.listOf(d1).length) > 0) stem.reasoning += " It " + rel4 + " " + medicinejava.Entities.listToText(stem.entity.listOf(d1)) + ".";
                if(/* size */(<number>stem.entity.listOf(d2).length) > 0) stem.reasoning += " It " + rel2 + " " + medicinejava.Entities.listToText(stem.entity.listOf(d2)) + ".";
            }
            if(this.INCLUDE_DESCRIPTION) stem.reasoning += '\n' + stem.entity.description;
            return stem;
        }

        /**
         * set of entities that could be used as incorrect answers
         */
        currentBank : Array<any> = <any>([]);

        /**
         * is any of the items in a[0 to N-1] equal to e?
         * @param {Array} a
         * @param {number} N
         * @param {medicinejava.Entity} e
         * @return {boolean}
         */
        anyarrayequal(a : medicinejava.Entity[], N : number, e : medicinejava.Entity) : boolean {
            let f : boolean = false;
            for(let i : number = 0; i < N; i++) {if(a[i] === e) f = true;;}
            return f;
        }

        /**
         * randomly choose n items from c into a vector
         * @param {Array} s
         * @param {number} n
         * @return {Array}
         */
        choose(s : Array<any>, n : number) : Array<any> {
            let ns : number = /* size */(<number>s.length);
            let result : Array<any> = <any>([]);
            if(ns < n) throw Object.defineProperty(new Error("Cannot choose " + n + " items from a set " + /* implicit toString */ (a => a?'['+a.join(', ')+']':'null')(s) + " of " + ns), '__classes', { configurable: true, value: ['java.lang.Throwable','java.lang.IllegalStateException','java.lang.Object','java.lang.RuntimeException','java.lang.Exception'] });
            let r : Array<number> = <any>([]);
            for(let i : number = 0; i < ns; i++) {{
                /* add */(r.push(new Number(i).valueOf())>0);
            };}
            console.info("Collections.shuffle(r);");
            let it : any = /* iterator */((a) => { var i = 0; return { next: function() { return i<a.length?a[i++]:null; }, hasNext: function() { return i<a.length; }}})(s);
            let un : number = 0;
            for(let i : number = 0; i < ns; i++) {{
                let o : any = it.next();
                for(let j : number = 0; j < n; j++) {if(/* intValue */((<number>/* get */r[j])|0) === i) {
                    /* add */(result.push(o)>0);
                    un++;
                };}
                if(un >= n) break;
            };}
            return result;
        }

        /**
         * remove any items from v which are related to 'relative' by relations 'relations'
         * to a depth 'depth'
         * @param {Array} v
         * @param {medicinejava.Entity} relative
         * @param {number} relations
         * @param {number} depth
         */
        filterOutRelations(v : Array<any>, relative : medicinejava.Entity, relations : number, depth : number) {
            let rm : Array<any> = <any>([]);
            for(let i : number = 0; i < /* size */(<number>v.length); i++) {{
                if(medicinejava.Entities.isRelatedTo(<medicinejava.Entity>/* get */v[i], relative, relations, depth, null)) /* add */(rm.push(/* get */v[i])>0);
            };}
            /* removeAll */((a, r) => { let b=false; for(let i=0;i<r.length;i++) { let ndx=a.indexOf(r[i]); if(ndx>=0) { a.splice(ndx, 1); b=true; } } return b; })(v,rm);
        }

        /**
         * @return {number} lexical similarity value in the range [0,1]
         * @param {string} str1
         * @param {string} str2
         */
        public static compareStrings(str1 : string, str2 : string) : number {
            let pairs1 : Array<any> = Logic.wordLetterPairs(str1.toUpperCase());
            let pairs2 : Array<any> = Logic.wordLetterPairs(str2.toUpperCase());
            let intersection : number = 0;
            let union : number = /* size */(<number>pairs1.length) + /* size */(<number>pairs2.length);
            for(let i : number = 0; i < /* size */(<number>pairs1.length); i++) {{
                let pair1 : any = /* get */pairs1[i];
                for(let j : number = 0; j < /* size */(<number>pairs2.length); j++) {{
                    let pair2 : any = /* get */pairs2[j];
                    if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(pair1,pair2))) {
                        intersection++;
                        /* remove */pairs2.splice(j, 1)[0];
                        break;
                    }
                };}
            };}
            return (2.0 * intersection) / union;
        }

        /**
         * @return {Array} an ArrayList of 2-character Strings.
         * @param {string} str
         * @private
         */
        static wordLetterPairs(str : string) : Array<any> {
            let allPairs : Array<any> = <any>([]);
            let words : string[] = str.split("\\s");
            for(let w : number = 0; w < words.length; w++) {{
                let pairsInWord : string[] = Logic.letterPairs(words[w]);
                for(let p : number = 0; p < pairsInWord.length; p++) {{
                    /* add */(allPairs.push(pairsInWord[p])>0);
                };}
            };}
            return allPairs;
        }

        /**
         * @return {Array} an array of adjacent letter pairs contained in the input string
         * @param {string} str
         * @private
         */
        static letterPairs(str : string) : string[] {
            let numPairs : number = str.length - 1;
            if(numPairs < 1) return [];
            let pairs : string[] = (s => { let a=[]; while(s-->0) a.push(null); return a; })(numPairs);
            for(let i : number = 0; i < numPairs; i++) {{
                pairs[i] = str.substring(i, i + 2);
            };}
            return pairs;
        }

        q : medicinejava.Question;

        /**
         * Call newQuestion() then
         * Create a question structure from the current logic
         * @param {number} mode
         * @return {medicinejava.Question}
         */
        getNewQuestion(mode : number) : medicinejava.Question {
            this.newQuestion(mode);
            return this.q;
        }

        /**
         * generate a single new Stem according to the current logic and current
         * question's root, correct, direction and mode.
         * @return {medicinejava.Stem}
         */
        generateNewStem() : medicinejava.Stem {
            return this.newIncorrect$medicinejava_Entity_A$medicinejava_Entity$medicinejava_Entity$int$int(this.incorrect, this.q.root, /* get */this.q.correctStem[0].entity, this.q.direction, this.q.mode);
        }

        setQuestion(qu : medicinejava.Question) {
            qu = qu;
        }

        public setStem(stem : medicinejava.Stem, newItem : medicinejava.Entity) {
            stem.entity = newItem;
            stem.reasoning = medicinejava.Essay.getText(newItem);
        }

        constructor() {
            if(this.ed===undefined) this.ed = null;
            if(this.seed===undefined) this.seed = null;
            if(this.incorrect===undefined) this.incorrect = null;
            if(this.infoText===undefined) this.infoText = null;
            if(this.infoIncor===undefined) this.infoIncor = null;
            if(this.infoCorrect===undefined) this.infoCorrect = null;
            if(this.q===undefined) this.q = null;
        }
    }
    Logic["__class"] = "medicinejava.Logic";


    export namespace Logic {

        export class TryAgain extends Error {
            constructor() {
                super();
                (<any>Object).setPrototypeOf(this, TryAgain.prototype);
            }
        }
        TryAgain["__class"] = "medicinejava.Logic.TryAgain";
        TryAgain["__interfaces"] = ["java.io.Serializable"];


    }


    export class Entity {
        static serial : number = 0;

        public static PARENT : number = 1;

        public static CHILD : number = 2;

        public static CAUSE : number = 4;

        public static EFFECT : number = 8;

        public static TREATS : number = 16;

        public static TREATMENTS : number = 32;

        public static relationList : number[]; public static relationList_$LI$() : number[] { if(Entity.relationList == null) Entity.relationList = [Entity.CAUSE, Entity.EFFECT, Entity.PARENT, Entity.CHILD, Entity.TREATS, Entity.TREATMENTS]; return Entity.relationList; };

        public static relationNameList : string[]; public static relationNameList_$LI$() : string[] { if(Entity.relationNameList == null) Entity.relationNameList = ["Causes", "Effects", "Supertypes", "Subtypes", "Treats", "Treatments"]; return Entity.relationNameList; };

        probs : number[][];

        public constructor(from : Entity, connection : number) {
            if(this.probs===undefined) this.probs = null;
            if(this.children===undefined) this.children = null;
            if(this.parents===undefined) this.parents = null;
            if(this.causes===undefined) this.causes = null;
            if(this.effects===undefined) this.effects = null;
            if(this.synonyms===undefined) this.synonyms = null;
            if(this.name===undefined) this.name = null;
            if(this.description===undefined) this.description = null;
            if(this.treats===undefined) this.treats = null;
            if(this.treatments===undefined) this.treatments = null;
            if(this.pChildren===undefined) this.pChildren = null;
            if(this.pCauses===undefined) this.pCauses = null;
            if(this.pEffects===undefined) this.pEffects = null;
            this.children = <any>([]);
            this.parents = <any>([]);
            this.causes = <any>([]);
            this.effects = <any>([]);
            this.treats = <any>([]);
            this.treatments = <any>([]);
            if(from != null) {
                this.connect(from, connection);
            }
            this.synonyms = <any>([]);
            this.name = "Entity" + Entity.serial++;
            this.description = "";
        }

        /**
         * eg. listOf(PARENT) returns parent.
         * @param {number} relation
         * @return {Array}
         */
        public listOf(relation : number) : Array<any> {
            switch((relation)) {
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
        }

        /**
         * List the probabilities of the entities related to this entity.
         * return null if not set.
         * @param {number} relation
         * @return {Array}
         */
        public probsOf(relation : number) : number[] {
            if(this.probs == null) return null;
            for(let i : number = 0; i < Entity.relationList_$LI$().length; i++) {{
                if((Entity.relationList_$LI$()[i] & relation) > 0) {
                    let v : number[] = this.probs[i];
                    if(v == null) continue;
                    if(v.length !== /* size */(<number>this.listOf(relation).length)) {
                        this.ensureConnectionProbs(relation);
                    }
                    return v;
                }
            };}
            return null;
        }

        /*private*/ static probidxOfRel(rel : number) : number {
            for(let i : number = 0; i < Entity.relationList_$LI$().length; i++) {{
                if((Entity.relationList_$LI$()[i] & rel) > 0) {
                    return i;
                }
            };}
            throw Object.defineProperty(new Error(rel + " is not a relation."), '__classes', { configurable: true, value: ['java.lang.Throwable','java.lang.Object','java.lang.RuntimeException','java.lang.IllegalArgumentException','java.lang.Exception'] });
        }

        /**
         * return the name of the first relation in the bitwise flags 'rel'
         * @param {number} rel
         * @return {string}
         */
        public static nameOfRelation(rel : number) : string {
            return Entity.relationNameList_$LI$()[Entity.probidxOfRel(rel)];
        }

        /**
         * return the bitwise flags for a given relation string. return 0  if not a valid string.
         * @param {string} s
         * @return {number}
         */
        public static getRelationForName(s : string) : number {
            for(let i : number = 0; i < Entity.relationNameList_$LI$().length; i++) {{
                if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(Entity.relationNameList_$LI$()[i].toLowerCase(),s.toLowerCase()))) return Entity.relationList_$LI$()[i];
            };}
            return 0;
        }

        /*private*/ removeProb(rel : number, idx : number) {
            if(this.probs != null) {
                let op : number[] = this.probs[Entity.probidxOfRel(rel)];
                if(op != null) {
                    let np : number[] = (s => { let a=[]; while(s-->0) a.push(0); return a; })(op.length - 1);
                    /* arraycopy */((srcPts, srcOff, dstPts, dstOff, size) => { if(srcPts !== dstPts || dstOff >= srcOff + size) { while (--size >= 0) dstPts[dstOff++] = srcPts[srcOff++];} else { let tmp = srcPts.slice(srcOff, srcOff + size); for (let i = 0; i < size; i++) dstPts[dstOff++] = tmp[i]; }})(op, 0, np, 0, idx);
                    /* arraycopy */((srcPts, srcOff, dstPts, dstOff, size) => { if(srcPts !== dstPts || dstOff >= srcOff + size) { while (--size >= 0) dstPts[dstOff++] = srcPts[srcOff++];} else { let tmp = srcPts.slice(srcOff, srcOff + size); for (let i = 0; i < size; i++) dstPts[dstOff++] = tmp[i]; }})(op, idx + 1, np, idx, op.length - idx - 1);
                    this.probs[Entity.probidxOfRel(rel)] = np;
                }
            }
        }

        public moveListItem(rel : number, idx1 : number, idx2 : number) {
            let o : any = /* get */this.listOf(rel)[idx1];
            if(idx1 === idx2) return;
            let dest : number = idx2;
            if(idx1 < idx2) {
                dest--;
            }
            /* remove */this.listOf(rel).splice(idx1, 1)[0];
            let v : Array<any> = this.listOf(rel);
            console.info("v.insertElementAt(o,dest)");
            let p : number[] = this.probsOf(rel);
            if(p != null) {
                let tmp : number = p[idx1];
                if(idx2 > idx1) for(let i : number = idx1; i < dest; i++) {p[i] = p[i + 1];} else for(let i : number = idx1; i > dest; i--) {p[i] = p[i - 1];}
                p[dest] = tmp;
            }
        }

        /**
         * remove a probability list if all NaN
         */
        public checkIfProbsClear() {
            if(this.probs != null) {
                for(let i : number = 0; i < this.probs.length; i++) {{
                    if(this.probs[i] == null) continue;
                    let empty : boolean = true;
                    for(let j : number = 0; j < this.probs[i].length; j++) {{
                        if(!/* isNaN */isNaN(this.probs[i][j])) empty = false;
                    };}
                    if(empty) this.probs[i] = null;
                };}
            }
        }

        /**
         * Set the probabilities of the entities related to this entity.
         * the probabilities x must have name size as number of related items.
         * @param {number} relation
         * @param {number} idx
         * @param {number} x
         */
        public setProbOf(relation : number, idx : number, x : number) {
            if(this.probs == null) this.probs = (s => { let a=[]; while(s-->0) a.push(null); return a; })(Entity.relationList_$LI$().length);
            for(let i : number = 0; i < Entity.relationList_$LI$().length; i++) {{
                if((Entity.relationList_$LI$()[i] & relation) > 0) {
                    if(this.probs[i] == null) {
                        let nrel : number = /* size */(<number>this.listOf(relation).length);
                        this.probs[i] = (s => { let a=[]; while(s-->0) a.push(0); return a; })(nrel);
                        for(let j : number = 0; j < nrel; j++) {this.probs[i][j] = NaN;}
                    } else if(this.probs[i].length <= idx) {
                        let nrel : number = /* size */(<number>this.listOf(relation).length);
                        let npr : number[] = (s => { let a=[]; while(s-->0) a.push(0); return a; })(nrel);
                        for(let j : number = 0; j < this.probs[i].length; j++) {npr[j] = this.probs[i][j];}
                        for(let j : number = this.probs[i].length; j < nrel; j++) {npr[j] = NaN;}
                        this.probs[i] = npr;
                    }
                    this.probs[i][idx] = x;
                }
            };}
        }

        public static inverseOf(reciprocalRelation : number) : number {
            switch((reciprocalRelation)) {
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
        }

        /**
         * e.g. A.connect(B, PARENT) means
         * A.parents.add(B);  B.children.add(A)
         * @param {medicinejava.Entity} to
         * @param {number} connectAs
         */
        public connect(to : Entity, connectAs : number) {
            let mylist : Array<any> = this.listOf(connectAs);
            if(mylist.indexOf(to) >= 0) return;
            /* add */(this.listOf(connectAs).push(to)>0);
            this.ensureConnectionProbs(connectAs);
            /* add */(to.listOf(Entity.inverseOf(connectAs)).push(this)>0);
            to.ensureConnectionProbs(Entity.inverseOf(connectAs));
        }

        /**
         * expand the probabilities list to the correct size after adding a connection
         * @param {number} rel
         */
        public ensureConnectionProbs(rel : number) {
            let error : boolean = false;
            if(this.probs != null) {
                let r : number = Entity.probidxOfRel(rel);
                if(this.probs[r] != null) {
                    let n : number = /* size */(<number>this.listOf(rel).length);
                    let nn : number = this.probs[r].length;
                    if(nn === n) return;
                    let np : number[] = (s => { let a=[]; while(s-->0) a.push(0); return a; })(n);
                    if(n < nn) {
                        nn = n;
                        error = true;
                    }
                    /* arraycopy */((srcPts, srcOff, dstPts, dstOff, size) => { if(srcPts !== dstPts || dstOff >= srcOff + size) { while (--size >= 0) dstPts[dstOff++] = srcPts[srcOff++];} else { let tmp = srcPts.slice(srcOff, srcOff + size); for (let i = 0; i < size; i++) dstPts[dstOff++] = tmp[i]; }})(this.probs[r], 0, np, 0, nn);
                    for(let j : number = this.probs[r].length; j < np.length; j++) {np[j] = NaN;}
                    this.probs[r] = np;
                }
            }
            if(error) {
                throw Object.defineProperty(new Error("The list " + this + "." + Entity.relationNameList_$LI$()[rel] + " has too many probabilities. I am truncating the list, possible losing data."), '__classes', { configurable: true, value: ['java.lang.Throwable','java.lang.IllegalStateException','java.lang.Object','java.lang.RuntimeException','java.lang.Exception'] });
            }
        }

        public disconnect(from : Entity, relation : number) {
            if(this.numConnections() < 2) {
                console.info("Cannot delete last connection");
                return;
            }
            if(/* contains */(this.listOf(relation).indexOf(<any>(from)) >= 0)) {
                let idx : number = this.listOf(relation).indexOf(from);
                /* remove */(a => { let index = a.indexOf(from); if(index>=0) { a.splice(index, 1); return true; } else { return false; }})(this.listOf(relation));
                this.removeProb(relation, idx);
                let idx2 : number = from.listOf(Entity.inverseOf(relation)).indexOf(this);
                /* remove */(a => { let index = a.indexOf(this); if(index>=0) { a.splice(index, 1); return true; } else { return false; }})(from.listOf(Entity.inverseOf(relation)));
                from.removeProb(Entity.inverseOf(relation), idx2);
            }
        }

        public toString() : string {
            return this.name;
        }

        public children : Array<any>;

        public parents : Array<any>;

        public causes : Array<any>;

        public effects : Array<any>;

        public synonyms : Array<any>;

        public name : string;

        public description : string;

        public treats : Array<any>;

        public treatments : Array<any>;

        public pChildren : Array<any>;

        public pCauses : Array<any>;

        public pEffects : Array<any>;

        /**
         * Check if equal to name or any of the synonyms
         * @param {string} s
         * @return {boolean}
         */
        public equals(s : string) : boolean {
            if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(this.name,s))) return true;
            for(let i : number = 0; i < /* size */(<number>this.synonyms.length); i++) {{
                if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(s,<string>/* get */this.synonyms[i]))) return true;
            };}
            return false;
        }

        public equalsIgnoreCase(s : string) : boolean {
            if(/* equalsIgnoreCase */((o1, o2) => o1.toUpperCase() === (o2===null?o2:o2.toUpperCase()))(this.name, s)) return true;
            for(let i : number = 0; i < /* size */(<number>this.synonyms.length); i++) {{
                if(/* equalsIgnoreCase */((o1, o2) => o1.toUpperCase() === (o2===null?o2:o2.toUpperCase()))(s, <string>/* get */this.synonyms[i])) return true;
            };}
            return false;
        }

        public contains(s : string) : boolean {
            if(this.name.indexOf(s) >= 0) return true;
            for(let i : number = 0; i < /* size */(<number>this.synonyms.length); i++) {{
                if((<string>/* get */this.synonyms[i]).indexOf(s) >= 0) return true;
            };}
            return false;
        }

        public containsIgnoreCase(s : string) : boolean {
            if(this.indexOfIgnoreCase(this.name, s) >= 0) return true;
            for(let i : number = 0; i < /* size */(<number>this.synonyms.length); i++) {{
                if(this.indexOfIgnoreCase(<string>/* get */this.synonyms[i], s) >= 0) return true;
            };}
            return false;
        }

        indexOfIgnoreCase(main : string, sub : string) : number {
            for(let k : number = 0; k <= main.length - sub.length; k++) {{
                if(/* equalsIgnoreCase */((o1, o2) => o1.toUpperCase() === (o2===null?o2:o2.toUpperCase()))(main.substring(k, k + sub.length), sub)) return k;
            };}
            return -1;
        }

        /**
         * Is the object blank -- i.e. does it have connections other than its
         * original one?
         * @return {boolean}
         */
        public isBlank() : boolean {
            return /* isEmpty */(this.synonyms.length == 0) && this.numConnections() < 2 && /* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(this.description,""));
        }

        /**
         * Replaces any uses of the current entry with the replacement entry,
         * leaving this entry disconnected & henceforth discardable
         * @param {medicinejava.Entity} replacement
         */
        public replaceAllWith(replacement : Entity) {
            for(let i : number = 0; i < Entity.relationList_$LI$().length; i++) {{
                let rel : number = Entity.relationList_$LI$()[i];
                let v : Array<any> = this.listOf(rel);
                for(let j : number = 0; j < /* size */(<number>v.length); j++) {{
                    let dest : Entity = <Entity>/* get */v[j];
                    replacement.connect(dest, rel);
                    dest.disconnect(this, Entity.inverseOf(rel));
                };}
            };}
        }

        /**
         * Count total number of links this object has with other objects
         * @return {number}
         */
        numConnections() : number {
            let n : number = /* size */(<number>this.causes.length) + /* size */(<number>this.effects.length) + /* size */(<number>this.parents.length) + /* size */(<number>this.children.length);
            n += /* size */(<number>this.treatments.length) + /* size */(<number>this.treats.length);
            return n;
        }
    }
    Entity["__class"] = "medicinejava.Entity";
    Entity["__interfaces"] = ["java.io.Serializable"];



    export class EntityData {
        /*private*/ namesToEntities : any = <any>({});

        public constructor() {
            if(this.saveTime===undefined) this.saveTime = 0;
            if(this.lastRead===undefined) this.lastRead = 0;
        }

        /**
         * Collection of entities backed by the hashtable of names
         * @return {Array}
         */
        public getAllEntities() : Array<any> {
            return /* values */((m) => { let r=[]; if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) r.push(m.entries[i].value); return r; })(<any>this.namesToEntities);
        }

        public saveTime : number;

        public lastRead : number;

        public addNewEntity$java_lang_String(name : string) : medicinejava.Entity {
            let e : medicinejava.Entity = new medicinejava.Entity(null, 0);
            e.name = name;
            let o : any = /* put */((m,k,v) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { m.entries[i].value=v; return; } m.entries.push({key:k,value:v,getKey: function() { return this.key }, getValue: function() { return this.value }}); })(<any>this.namesToEntities, name, e);
            if(o != null) throw Object.defineProperty(new Error("Two entites with key " + name), '__classes', { configurable: true, value: ['java.lang.Throwable','java.lang.IllegalStateException','java.lang.Object','java.lang.RuntimeException','java.lang.Exception'] });
            return e;
        }

        public addNewEntity$medicinejava_Entity$int(from : medicinejava.Entity, relation : number) : medicinejava.Entity {
            let e : medicinejava.Entity = new medicinejava.Entity(from, relation);
            let o : any = /* put */((m,k,v) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { m.entries[i].value=v; return; } m.entries.push({key:k,value:v,getKey: function() { return this.key }, getValue: function() { return this.value }}); })(<any>this.namesToEntities, e.name, e);
            if(o != null) throw Object.defineProperty(new Error("Two entites with key " + e.name), '__classes', { configurable: true, value: ['java.lang.Throwable','java.lang.IllegalStateException','java.lang.Object','java.lang.RuntimeException','java.lang.Exception'] });
            return e;
        }

        public addNewEntity(from? : any, relation? : any) : any {
            if(((from != null && from instanceof <any>medicinejava.Entity) || from === null) && ((typeof relation === 'number') || relation === null)) {
                return <any>this.addNewEntity$medicinejava_Entity$int(from, relation);
            } else if(((typeof from === 'string') || from === null) && relation === undefined) {
                return <any>this.addNewEntity$java_lang_String(from);
            } else throw new Error('invalid overload');
        }

        public removeEntity(r : medicinejava.Entity) {
            /* remove */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries.splice(i,1)[0]; } })(<any>this.namesToEntities, r.name);
        }

        public removeAllOf(e : Array<any>) {
            for(let i : any = /* iterator */((a) => { var i = 0; return { next: function() { return i<a.length?a[i++]:null; }, hasNext: function() { return i<a.length; }}})(e); i.hasNext(); ) {{
                this.removeEntity(<medicinejava.Entity>i.next());
            };}
        }

        /**
         * update the name hash table
         */
        refreshNames() {
            let es : Array<any> = /* values */((m) => { let r=[]; if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) r.push(m.entries[i].value); return r; })(<any>this.namesToEntities);
            let nht : any = <any>({});
            for(let i : any = /* iterator */((a) => { var i = 0; return { next: function() { return i<a.length?a[i++]:null; }, hasNext: function() { return i<a.length; }}})(es); i.hasNext(); ) {{
                let e : medicinejava.Entity = <medicinejava.Entity>i.next();
                /* put */((m,k,v) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { m.entries[i].value=v; return; } m.entries.push({key:k,value:v,getKey: function() { return this.key }, getValue: function() { return this.value }}); })(<any>nht, e.name, e);
            };}
            this.namesToEntities = nht;
        }

        /**
         * Check that all entities are found in the data
         */
        public checkIntegrity() {
            let c : Array<any> = /* values */((m) => { let r=[]; if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) r.push(m.entries[i].value); return r; })(<any>this.namesToEntities);
            for(let it : any = /* iterator */((a) => { var i = 0; return { next: function() { return i<a.length?a[i++]:null; }, hasNext: function() { return i<a.length; }}})(c); it.hasNext(); ) {{
                let e : medicinejava.Entity = <medicinejava.Entity>it.next();
                for(let i : number = 1; i < medicinejava.Entity.relationList_$LI$().length; i++) {{
                    let v : Array<any> = e.listOf(medicinejava.Entity.relationList_$LI$()[i]);
                    for(let it2 : any = /* iterator */((a) => { var i = 0; return { next: function() { return i<a.length?a[i++]:null; }, hasNext: function() { return i<a.length; }}})(v); it2.hasNext(); ) {{
                        let e2 : medicinejava.Entity = <medicinejava.Entity>it2.next();
                        if(!/* contains */(c.indexOf(<any>(e2)) >= 0)) {
                            throw new medicinejava.DataIntegrityException(e2.name + " not found in data.");
                        }
                    };}
                };}
            };}
        }

        public size() : number {
            return /* size */((m) => { if(m.entries==null) m.entries=[]; return m.entries.length; })(<any>this.namesToEntities);
        }

        public findEntityExact(name : string) : medicinejava.Entity {
            return <medicinejava.Entity>/* get */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries[i].value; } return null; })(<any>this.namesToEntities, name);
        }

        public findEntities(text : string, contains : boolean, csensitive : boolean) : Array<any> {
            let res : Array<any> = <any>([]);
            for(let k : any = this.namesToEntities.elements(); k.hasMoreElements(); ) {{
                let c : medicinejava.Entity = <medicinejava.Entity>k.nextElement();
                let s : string = c.name;
                let textlc : string = text.toLowerCase();
                if(contains) {
                    if(csensitive) {
                        if(s.indexOf(text) >= 0) {
                            /* addElement */(res.push(/* get */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries[i].value; } return null; })(<any>this.namesToEntities, s))>0);
                            continue;
                        }
                    } else {
                        if(s.toLowerCase().indexOf(textlc) >= 0) {
                            /* addElement */(res.push(/* get */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries[i].value; } return null; })(<any>this.namesToEntities, s))>0);
                            continue;
                        }
                    }
                    for(let i : number = 0; i < /* size */(<number>c.synonyms.length); i++) {{
                        let syn : string = <string>/* elementAt */c.synonyms[i];
                        if(csensitive) {
                            if(syn.indexOf(text) >= 0) {
                                /* addElement */(res.push(/* get */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries[i].value; } return null; })(<any>this.namesToEntities, s))>0);
                                break;
                            }
                        } else {
                            if(syn.toLowerCase().indexOf(textlc) >= 0) {
                                /* addElement */(res.push(/* get */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries[i].value; } return null; })(<any>this.namesToEntities, s))>0);
                                break;
                            }
                        }
                    };}
                } else {
                    if(csensitive) {
                        if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(s,text))) /* addElement */(res.push(/* get */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries[i].value; } return null; })(<any>this.namesToEntities, s))>0);
                    } else {
                        if(/* equalsIgnoreCase */((o1, o2) => o1.toUpperCase() === (o2===null?o2:o2.toUpperCase()))(s, text)) /* addElement */(res.push(/* get */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries[i].value; } return null; })(<any>this.namesToEntities, s))>0);
                    }
                }
            };}
            return res;
        }

        /**
         * @deprecated never crawl entities: the stack trace gets too deep.
         * @return {medicinejava.Entity}
         */
        public getFirstEntity() : medicinejava.Entity {
            return <medicinejava.Entity>/* iterator */((a) => { var i = 0; return { next: function() { return i<a.length?a[i++]:null; }, hasNext: function() { return i<a.length; }}})(/* values */((m) => { let r=[]; if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) r.push(m.entries[i].value); return r; })(<any>this.namesToEntities)).next();
        }

        /**
         * this is a silly method that returns an entity by its serial index.
         * This serial index changes all the time, so don't use it except to generate
         * a random entity.
         * It is also slow, as it iterates through N entities!
         * @param {number} n
         * @return {medicinejava.Entity}
         * @private
         */
        getItemAtIndex(n : number) : medicinejava.Entity {
            let index : number = 0;
            for(let i : any = /* iterator */((a) => { var i = 0; return { next: function() { return i<a.length?a[i++]:null; }, hasNext: function() { return i<a.length; }}})(/* values */((m) => { let r=[]; if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) r.push(m.entries[i].value); return r; })(<any>this.namesToEntities)); i.hasNext(); index++) {{
                let o : any = i.next();
                if(index === n) return <medicinejava.Entity>o;
            };}
            throw Object.defineProperty(new Error("can\'t get entity at index " + n), '__classes', { configurable: true, value: ['java.lang.Throwable','java.lang.IndexOutOfBoundsException','java.lang.Object','java.lang.ArrayIndexOutOfBoundsException','java.lang.RuntimeException','java.lang.Exception'] });
        }

        public getRandomEntity() : medicinejava.Entity {
            return this.getItemAtIndex((<number>Math.floor(Math.random() * /* size */(<number>this.getAllEntities().length))|0));
        }

        /**
         * Parse an edit string
         * return: true if an edit was made
         * dispatches to the relevant implementEdit... functions
         * @param {string} editString
         * @return {boolean}
         */
        public implementEdit(editString : string) : boolean {
            let s : string[] = editString.split("\t");
            let i : number = 0;
            while((s[i].length === 0)) {i++};
            let cmd : string = s[i].toLowerCase().trim();
            let rel : number = medicinejava.Entity.getRelationForName(s[2].trim());
            let e1 : medicinejava.Entity = this.findEntityExact(s[1].trim());
            let e2 : medicinejava.Entity = this.findEntityExact(s[3].trim());
            if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(cmd,"remove"))) {
                if(/* equalsIgnoreCase */((o1, o2) => o1.toUpperCase() === (o2===null?o2:o2.toUpperCase()))(s[2], "Synonyms")) {
                    if(e1 == null) throw new EntityData.MedicineEditException("no entity for synonym in " + editString);
                    return this.implementEditRemoveSynonym(e1, s[3]);
                } else {
                    if(e1 == null || rel === 0 || e2 == null) throw new EntityData.MedicineEditException("no such link in " + editString);
                    return this.implementEditDelete(e1, rel, e2);
                }
            } else if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(cmd,"add"))) {
                if(/* equalsIgnoreCase */((o1, o2) => o1.toUpperCase() === (o2===null?o2:o2.toUpperCase()))(s[2], "Synonym")) {
                    if(e1 == null) throw new EntityData.MedicineEditException("no entity for synonym in " + editString);
                    return this.implementEditAddSynonym(e1, s[3]);
                } else {
                    if(e1 == null || rel === 0) throw new EntityData.MedicineEditException("invalid new link in " + editString);
                    if(e2 == null) e2 = this.addNewEntity$java_lang_String(s[3]);
                    return this.implementEditAdd(e1, rel, e2);
                }
            } else if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(cmd,"edit"))) {
                if(/* equalsIgnoreCase */((o1, o2) => o1.toUpperCase() === (o2===null?o2:o2.toUpperCase()))(s[2], "Name")) {
                    let newname : string = s[3].trim();
                    if(e1 == null || newname.length === 0) throw new EntityData.MedicineEditException("invalid name edit: " + editString);
                    return this.implementEditName(e1, s[3]);
                } else if(/* equalsIgnoreCase */((o1, o2) => o1.toUpperCase() === (o2===null?o2:o2.toUpperCase()))(s[2], "Description")) {
                    let desc : string = s[3];
                    if(e1 == null) throw new EntityData.MedicineEditException("no entity for description in " + editString);
                    return this.implementEditDescription(e1, desc);
                } else throw new EntityData.MedicineEditException("unknown edit: " + s[2] + " in " + editString);
            } else if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(cmd,"updatepercent"))) {
                if(e1 == null || rel === 0 || e2 == null) throw new EntityData.MedicineEditException("invalid link for percentage in " + editString);
                let percent : number;
                try {
                    percent = /* parseDouble */parseFloat(s[4]);
                } catch(e) {
                    throw new EntityData.MedicineEditException("Not a valid percentage: " + s[4] + " in " + editString);
                };
                return this.implementEditUpdatePercent(e1, medicinejava.Entity.getRelationForName(s[2]), e2, percent);
            } else if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(cmd,"comment"))) {
                return true;
            } else throw new EntityData.MedicineEditException("unknown command: " + cmd + " in " + editString);
        }

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
        public static createEditString(command : string, entity : medicinejava.Entity, relation : string, item : string, value : string) : string {
            let cmd : string = command.toLowerCase();
            let string : string;
            if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(cmd,"remove"))) {
                string = cmd + "\t" + entity.name + "\t" + relation + "\t" + item;
            } else if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(cmd,"add"))) {
                string = cmd + "\t" + entity.name + "\t" + relation + "\t" + item;
            } else if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(cmd,"edit"))) {
                string = cmd + "\t" + entity.name + "\t" + relation + "\t" + item;
            } else if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(cmd,"updatepercent"))) {
                string = cmd + "\t" + entity.name + "\t" + relation + "\t" + item + "\t" + value;
            } else if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(cmd,"comment"))) {
                string = cmd + "\t" + value;
            } else {
                throw new EntityData.MedicineEditException("unknown command: " + cmd);
            }
            return string;
        }

        implementEditRemoveSynonym(e : medicinejava.Entity, syn : string) : boolean {
            if(/* contains */(e.synonyms.indexOf(<any>(syn)) >= 0)) {
                /* removeElement */(a => { let index = a.indexOf(syn); if(index>=0) { a.splice(index, 1); return true; } else { return false; }})(e.synonyms);
                return true;
            } else return false;
        }

        implementEditAddSynonym(e : medicinejava.Entity, syn : string) : boolean {
            return true;
        }

        implementEditDelete(e : medicinejava.Entity, rel : number, item : medicinejava.Entity) : boolean {
            if(/* contains */(e.listOf(rel).indexOf(<any>(item)) >= 0)) {
                e.disconnect(item, rel);
                return true;
            } else return false;
        }

        implementEditAdd(e : medicinejava.Entity, rel : number, item : medicinejava.Entity) : boolean {
            e.connect(item, rel);
            return true;
        }

        implementEditName(e : medicinejava.Entity, n : string) : boolean {
            let legalchars : string = "ABCDEFGHIJKLMNOPQRTSUVWXYZabcdefghijklmnopqrtsuvwxyz\' -";
            for(let i : number = 0; i < n.length; i++) {if(legalchars.indexOf(n.charAt(i)) < 0) throw new EntityData.MedicineEditException("Illegal character " + n.charAt(i) + " in new name for " + e + ", " + n);;}
            /* remove */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries.splice(i,1)[0]; } })(<any>this.namesToEntities, e.name);
            e.name = n;
            /* put */((m,k,v) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { m.entries[i].value=v; return; } m.entries.push({key:k,value:v,getKey: function() { return this.key }, getValue: function() { return this.value }}); })(<any>this.namesToEntities, e.name, e);
            return true;
        }

        implementEditDescription(e : medicinejava.Entity, d : string) : boolean {
            e.description = d;
            return true;
        }

        implementEditUpdatePercent(e : medicinejava.Entity, rel : number, item : medicinejava.Entity, p : number) : boolean {
            let ix : number = e.listOf(rel).indexOf(item);
            if(ix >= 0) {
                e.setProbOf(rel, ix, p);
                return true;
            } else return false;
        }
    }
    EntityData["__class"] = "medicinejava.EntityData";


    export namespace EntityData {

        export class MedicineEditException extends Error {
            public constructor(c : string) {
                super(c); this.message=c;
                (<any>Object).setPrototypeOf(this, MedicineEditException.prototype);
            }
        }
        MedicineEditException["__class"] = "medicinejava.EntityData.MedicineEditException";
        MedicineEditException["__interfaces"] = ["java.io.Serializable"];


    }


    export class DataIntegrityException {
        public constructor(s : string) {
            (<any>Object).setPrototypeOf(this, DataIntegrityException.prototype);
        }
    }
    DataIntegrityException["__class"] = "medicinejava.DataIntegrityException";
    DataIntegrityException["__interfaces"] = ["java.io.Serializable"];



    /**
     * General utilities for use with tht class Entity
     * @class
     */
    export class Entities {
        public constructor() {
            if(this.entityData===undefined) this.entityData = null;
            if(this.data===undefined) this.data = null;
        }

        entityData : medicinejava.EntityData;

        public static standardStrings : string[]; public static standardStrings_$LI$() : string[] { if(Entities.standardStrings == null) Entities.standardStrings = ["Disease", "Pathology", "Investigation", "Sign", "Symptom", "Substance", "Treatment", "Lifestyle"]; return Entities.standardStrings; };

        /**
         * bits representing which ultimate parent
         */
        public static E_DISEASE : number = 1;

        /**
         * bits representing which ultimate parent
         */
        public static E_PATHOLOGY : number = 2;

        /**
         * bits representing which ultimate parent
         */
        public static E_INVESTIGATION : number = 4;

        /**
         * bits representing which ultimate parent
         */
        public static E_SIGN : number = 8;

        /**
         * bits representing which ultimate parent
         */
        public static E_SYMPTOM : number = 16;

        /**
         * bits representing which ultimate parent
         */
        public static E_SUBSTANCE : number = 32;

        /**
         * bits representing which ultimate parent
         */
        public static E_TREATMENT : number = 64;

        /**
         * bits representing which ultimate parent
         */
        public static E_LIFESTYLE : number = 128;

        public static isStandardUltimateParent(e : medicinejava.Entity) : boolean {
            if(e == null) return false;
            for(let i : number = 0; i < Entities.standardStrings_$LI$().length; i++) {if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(e.name,Entities.standardStrings_$LI$()[i]))) return true;;}
            return false;
        }

        public static hasAStandardUltimateParent(e : medicinejava.Entity) : boolean {
            let l : Array<any> = Entities.getExtensiveListOf$int$medicinejava_Entity$int(medicinejava.Entity.PARENT, e, 15);
            for(let i : any = /* iterator */((a) => { var i = 0; return { next: function() { return i<a.length?a[i++]:null; }, hasNext: function() { return i<a.length; }}})(l); i.hasNext(); ) {if(Entities.isStandardUltimateParent(<medicinejava.Entity>i.next())) return true;;}
            return false;
        }

        /**
         * modify the vector to contain only entities which have a standard ultimate parent
         * @param {Array} v
         */
        public filterVectorForStandardParents(v : Array<any>) {
            let rm : Array<any> = <any>([]);
            for(let i : number = 0; i < /* size */(<number>v.length); i++) {if(Entities.isStandardUltimateParent(Entities.getUltimateParents(<medicinejava.Entity>/* get */v[i]))) /* add */(rm.push(/* get */v[i])>0);;}
            /* removeAll */((a, r) => { let b=false; for(let i=0;i<r.length;i++) { let ndx=a.indexOf(r[i]); if(ndx>=0) { a.splice(ndx, 1); b=true; } } return b; })(v,rm);
        }

        /**
         * 
         * modify the vector to contain only entities which have the specified ultimate parent
         * (specify a combination of the bits E_DISEASE E_PATHOLOGY etc)
         * @param {Array} v
         * @param {number} ultimateParent
         */
        public static filterVectorForStandardParents(v : Array<any>, ultimateParent : number) {
            let rm : Array<any> = <any>([]);
            for(let i : number = 0; i < /* size */(<number>v.length); i++) {{
                let e : medicinejava.Entity = <medicinejava.Entity>/* get */v[i];
                let ultP : medicinejava.Entity = Entities.getUltimateParents(e);
                let ok : boolean = false;
                if(ultP != null) {
                    for(let b : number = 0; b < 8; b++) {{
                        if((ultimateParent & (1 << b)) > 0 && /* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(ultP.name,Entities.standardStrings_$LI$()[b]))) ok = true;
                    };}
                }
                if(!ok) /* add */(rm.push(/* get */v[i])>0);
            };}
            /* removeAll */((a, r) => { let b=false; for(let i=0;i<r.length;i++) { let ndx=a.indexOf(r[i]); if(ndx>=0) { a.splice(ndx, 1); b=true; } } return b; })(v,rm);
        }

        public setData(e : medicinejava.EntityData) {
            let toremove : Array<any> = <any>([]);
            for(let i : any = /* iterator */((a) => { var i = 0; return { next: function() { return i<a.length?a[i++]:null; }, hasNext: function() { return i<a.length; }}})(e.getAllEntities()); i.hasNext(); ) {{
                let en : medicinejava.Entity = <medicinejava.Entity>i.next();
                let nconn : number = 0;
                for(let j : number = 0; j < medicinejava.Entity.relationList_$LI$().length; j++) {{
                    let v : Array<any> = en.listOf(medicinejava.Entity.relationList_$LI$()[j]);
                    nconn += /* size */(<number>v.length);
                };}
                if(nconn === 0) {
                    /* add */(toremove.push(en)>0);
                }
                let nsyn : number = /* size */(<number>en.synonyms.length);
                for(let j : number = 0; j < nsyn; j++) {{
                    for(let k : number = j + 1; k < nsyn; k++) {{
                        if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(/* get */en.synonyms[j],/* get */en.synonyms[k]))) {
                            /* set */(en.synonyms[k] = "");
                        }
                    };}
                };}
                for(let j : number = 0; j < /* size */(<number>en.synonyms.length); j++) {if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(/* get */en.synonyms[j],""))) {
                    /* remove */en.synonyms.splice(j--, 1)[0];
                };}
            };}
            e.removeAllOf(toremove);
            this.entityData = e;
        }

        public getData() : medicinejava.EntityData {
            return this.entityData;
        }

        public writeTextForm$java_io_OutputStream(os : java.io.OutputStream) {
            let out : java.io.PrintStream = new java.io.PrintStream(os);
            {
                for(let i : any = /* iterator */((a) => { var i = 0; return { next: function() { return i<a.length?a[i++]:null; }, hasNext: function() { return i<a.length; }}})(this.entityData.getAllEntities()); i.hasNext(); ) {{
                    let ent : medicinejava.Entity = <medicinejava.Entity>i.next();
                    this.writeTextForm$java_io_PrintStream$medicinejava_Entity(out, ent);
                };}
                this.writeTimeToStream(out, new Date().getTime());
            };
        }

        writeTimeToStream(pw : java.io.PrintStream, time : number) {
            pw.println("_SAVED_TIME " + time);
        }

        public writeTextForm$java_io_PrintStream$medicinejava_Entity(out : java.io.PrintStream, e : medicinejava.Entity) {
            out.println(e.name + " {");
            if(/* size */(<number>e.synonyms.length) > 0) out.println("\tSynonyms {" + Entities.getDelimitedNames(e.synonyms, ", ") + "}");
            if(/* size */(<number>e.causes.length) > 0) out.println("\tCauses {" + Entities.getDelimitedEntities(e, medicinejava.Entity.CAUSE, ", ") + "}");
            if(/* size */(<number>e.effects.length) > 0) out.println("\tEffects {" + Entities.getDelimitedEntities(e, medicinejava.Entity.EFFECT, ", ") + "}");
            if(/* size */(<number>e.parents.length) > 0) out.println("\tParents {" + Entities.getDelimitedEntities(e, medicinejava.Entity.PARENT, ", ") + "}");
            if(/* size */(<number>e.children.length) > 0) out.println("\tChildren {" + Entities.getDelimitedEntities(e, medicinejava.Entity.CHILD, ", ") + "}");
            if(/* size */(<number>e.treats.length) > 0) out.println("\tTreats {" + Entities.getDelimitedEntities(e, medicinejava.Entity.TREATS, ", ") + "}");
            if(/* size */(<number>e.treatments.length) > 0) out.println("\tTreatments {" + Entities.getDelimitedEntities(e, medicinejava.Entity.TREATMENTS, ", ") + "}");
            if(!/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(e.description,""))) out.println("\tDescription {\"" + /* replace *//* replace */e.description.split('{').join('(').split('}').join(')') + "\"}");
            out.println("}");
        }

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
        public writeTextForm(out? : any, e? : any) : any {
            if(((out != null && out instanceof <any>java.io.PrintStream) || out === null) && ((e != null && e instanceof <any>medicinejava.Entity) || e === null)) {
                return <any>this.writeTextForm$java_io_PrintStream$medicinejava_Entity(out, e);
            } else if(((out != null && out instanceof <any>java.io.OutputStream) || out === null) && e === undefined) {
                return <any>this.writeTextForm$java_io_OutputStream(out);
            } else throw new Error('invalid overload');
        }

        public static readTextForm(is : { str: string, cursor: number }) : medicinejava.EntityData {
            let fr : { str: string, cursor: number } = null;
            let data : medicinejava.EntityData = null;
            try {
                fr = is;
                data = new medicinejava.EntityData();
                while((true)) {{
                    Entities.readEntity(data, fr);
                }};
            } catch(e) {
            };
            if(fr != null) {
                /* close */;
            }
            if(data == null) return null;
            if(data.size() === 0) return null;
            Entities.validateConnections(data);
            return data;
        }

        /**
         * Merge two input streams in text format
         * @deprecated - use the single-stream version to merge with a dataset
         * @param {{ str: string, cursor: number }} is
         * @param {{ str: string, cursor: number }} is2
         * @return {medicinejava.Entity}
         */
        public static mergeTextFromStreams(is : { str: string, cursor: number }, is2 : { str: string, cursor: number }) : medicinejava.Entity {
            let fr : { str: string, cursor: number } = null;
            let data : medicinejava.EntityData = null;
            try {
                fr = is;
                data = new medicinejava.EntityData();
                while((true)) {{
                    Entities.readEntity(data, fr);
                }};
            } catch(e) {
            };
            if(fr != null) {
                /* close */;
                fr = null;
            }
            if(data == null) data = new medicinejava.EntityData();
            try {
                fr = is2;
                while((true)) {{
                    Entities.readEntity(data, fr);
                }};
            } catch(e) {
            };
            if(fr != null) {
                /* close */;
            }
            if(data == null) return null;
            if(data.size() === 0) return null;
            return data.getFirstEntity();
        }

        public static mergeTextFromStream(d : medicinejava.EntityData, is : { str: string, cursor: number }) : medicinejava.EntityData {
            let fr : { str: string, cursor: number } = null;
            try {
                fr = is;
                while((true)) {{
                    Entities.readEntity(d, fr);
                }};
            } catch(e) {
            };
            if(fr != null) {
                /* close */;
            }
            Entities.validateConnections(d);
            return d;
        }

        /**
         * readEntity - reads an entity form the stream into the EntityData.
         * 
         * @param {medicinejava.EntityData} data EntityData
         * @param fr FileReader
         * @param {{ str: string, cursor: number }} r
         * @private
         */
        static readEntity(data : medicinejava.EntityData, r : { str: string, cursor: number }) {
            let nameb : { str: string, toString: Function } = { str: "", toString: function() { return this.str; } };
            let ch : number;
            while(((ch = /* read */(r => r.str.charCodeAt(r.cursor++))(r)) != '{'.charCodeAt(0) && ch !== -1)) {/* append */(sb => { sb.str = sb.str.concat(<any>String.fromCharCode(ch)); return sb; })(nameb)};
            if(ch === -1) throw new Entities.EOF();
            let name : string = /* toString */nameb.str.trim();
            if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(nameb,"_SAVED_TIME"))) {
                data.saveTime = Entities.readTimeFromStream(r);
                return;
            }
            let e : medicinejava.Entity = data.findEntityExact(name);
            if(e == null) {
                e = data.addNewEntity$java_lang_String(name);
            }
            try {
                while((true)) {Entities.readSection(e, data, r)};
            } catch(ex) {
            };
        }

        static readTimeFromStream(r : { str: string, cursor: number }) : number {
            let ch : number;
            let d : { str: string, toString: Function } = { str: "", toString: function() { return this.str; } };
            while((!javaemul.internal.CharacterHelper.isWhitespace(String.fromCharCode((ch = /* read */(r => r.str.charCodeAt(r.cursor++))(r)))))) {/* append */(sb => { sb.str = sb.str.concat(<any>ch); return sb; })(d)};
            if(ch === -1) throw new Entities.EOF();
            return /* parseLong */parseInt(/* toString */d.str);
        }

        /**
         * readSection -reads a list of causes, effects, synonyms etc. from an entity
         * 
         * @param {medicinejava.Entity} e Entity
         * @param {medicinejava.EntityData} data EntityData
         * @param {{ str: string, cursor: number }} r
         * @private
         */
        static readSection(e : medicinejava.Entity, data : medicinejava.EntityData, r : { str: string, cursor: number }) {
            let nameb : { str: string, toString: Function } = { str: "", toString: function() { return this.str; } };
            let ch : number;
            while(((ch = /* read */(r => r.str.charCodeAt(r.cursor++))(r)) != '{'.charCodeAt(0) && ch != '}'.charCodeAt(0) && ch !== -1)) {/* append */(sb => { sb.str = sb.str.concat(<any>String.fromCharCode(ch)); return sb; })(nameb)};
            if(ch == '}'.charCodeAt(0)) throw new Entities.EOE();
            if(ch === -1) throw new Entities.EOF();
            let name : string = /* toString */nameb.str.trim();
            if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(name,"Causes"))) Entities.readListTillCloseBracket(e, medicinejava.Entity.CAUSE, data, r, true);
            if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(name,"Effects"))) Entities.readListTillCloseBracket(e, medicinejava.Entity.EFFECT, data, r, true);
            if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(name,"Parents"))) Entities.readListTillCloseBracket(e, medicinejava.Entity.PARENT, data, r, true);
            if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(name,"Children"))) Entities.readListTillCloseBracket(e, medicinejava.Entity.CHILD, data, r, true);
            if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(name,"Synonyms"))) Entities.readStringListTillCloseBracket(e.synonyms, data, r);
            if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(name,"Treats"))) Entities.readListTillCloseBracket(e, medicinejava.Entity.TREATS, data, r, true);
            if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(name,"Treatments"))) Entities.readListTillCloseBracket(e, medicinejava.Entity.TREATMENTS, data, r, true);
            if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(name,"Description"))) {
                let desc : { str: string, toString: Function } = { str: "", toString: function() { return this.str; } };
                while(((ch = /* read */(r => r.str.charCodeAt(r.cursor++))(r)) != '}'.charCodeAt(0) && ch !== -1)) {/* append */(sb => { sb.str = sb.str.concat(<any>String.fromCharCode(ch)); return sb; })(desc)};
                if(ch === -1) throw new Entities.EOF();
                let d : string = /* toString */desc.str.trim();
                if(/* startsWith */((str, searchString, position = 0) => str.substr(position, searchString.length) === searchString)(d, "\"")) d = d.substring(1, d.length - 1);
                Entities.mergeDescriptions(e, d);
            }
        }

        /**
         * If false, then the stream readers will only add the connections in
         * one direction, for each entity. This means it is possible to have
         * connections that only go one way (which is of course illegal),
         * so caution must be used that the file is valid. On the other hand
         * The order of the items is well specified by the file- the order will
         * be lost if two-directional adding is enabled by setting the value to
         * 'true'.
         */
        static ENSURE_VALIIDTY_AT_EXPENSE_OF_ORDER : boolean = false;

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
        static readListTillCloseBracket(from : medicinejava.Entity, relation : number, data : medicinejava.EntityData, r : { str: string, cursor: number }, convertToEntity : boolean) {
            let s : { str: string, toString: Function } = { str: "", toString: function() { return this.str; } };
            let ch : number;
            while(((ch = /* read */(r => r.str.charCodeAt(r.cursor++))(r)) != '}'.charCodeAt(0))) {{
                if(ch === -1) throw new Entities.EOF();
                if(ch == ','.charCodeAt(0)) {
                    Entities.storeEntity(from, s, relation, data, convertToEntity);
                } else {
                    if(ch == '`'.charCodeAt(0)) ch = (',').charCodeAt(0);
                    /* append */(sb => { sb.str = sb.str.concat(<any>String.fromCharCode(ch)); return sb; })(s);
                }
            }};
            Entities.storeEntity(from, s, relation, data, convertToEntity);
        }

        /**
         * scan the stream for comma delimited strings, into vector v.
         * @param {Array} v
         * @param {medicinejava.EntityData} d
         * @param {{ str: string, cursor: number }} r
         * @private
         */
        static readStringListTillCloseBracket(v : Array<any>, d : medicinejava.EntityData, r : { str: string, cursor: number }) {
            let s : { str: string, toString: Function } = { str: "", toString: function() { return this.str; } };
            let ch : number;
            while(((ch = /* read */(r => r.str.charCodeAt(r.cursor++))(r)) != '}'.charCodeAt(0))) {{
                if(ch === -1) throw new Entities.EOF();
                if(ch == ','.charCodeAt(0)) {
                    if(!/* contains */(v.indexOf(<any>(/* toString */s.str)) >= 0)) {
                        /* addElement */(v.push(/* toString */s.str.trim())>0);
                    }
                    /* setLength */((sb, length) => sb.str = sb.str.substring(0, length))(s, 0);
                } else {
                    if(ch == '`'.charCodeAt(0)) ch = (',').charCodeAt(0);
                    /* append */(sb => { sb.str = sb.str.concat(<any>String.fromCharCode(ch)); return sb; })(s);
                }
            }};
            if(!/* contains */(v.indexOf(<any>(/* toString */s.str)) >= 0)) {
                /* addElement */(v.push(/* toString */s.str.trim())>0);
            }
            /* setLength */((sb, length) => sb.str = sb.str.substring(0, length))(s, 0);
        }

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
        static storeEntity(from : medicinejava.Entity, s : { str: string, toString: Function }, relation : number, d : medicinejava.EntityData, convertToEntity : boolean) {
            let n : string = /* toString */s.str.trim();
            let v : Array<any> = from.listOf(relation);
            if(convertToEntity) {
                let p : number = NaN;
                if(/* endsWith */((str, searchString) => { let pos = str.length - searchString.length; let lastIndex = str.indexOf(searchString, pos); return lastIndex !== -1 && lastIndex === pos; })(n, "%")) {
                    let i : number = n.length - 2;
                    while((!javaemul.internal.CharacterHelper.isWhitespace(n.charAt(i)))) {i = i - 1};
                    try {
                        p = /* parseDouble */parseFloat(n.substring(i + 1, n.length - 1));
                    } catch(e) {
                        throw Object.defineProperty(new Error("Illegal percentage in " + from.name + ": " + n), '__classes', { configurable: true, value: ['java.lang.Throwable','java.io.IOException','java.lang.Object','java.lang.Exception'] });
                    };
                    n = n.substring(0, i);
                }
                let e : medicinejava.Entity = d.findEntityExact(n);
                if(e == null) {
                    e = d.addNewEntity$java_lang_String(n);
                    /* addElement */(v.push(e)>0);
                    if(Entities.ENSURE_VALIIDTY_AT_EXPENSE_OF_ORDER) /* addElement */(e.listOf(medicinejava.Entity.inverseOf(relation)).push(from)>0);
                } else {
                    if(!/* contains */(v.indexOf(<any>(e)) >= 0)) {
                        /* addElement */(v.push(e)>0);
                        if(Entities.ENSURE_VALIIDTY_AT_EXPENSE_OF_ORDER) /* addElement */(e.listOf(medicinejava.Entity.inverseOf(relation)).push(from)>0);
                    }
                }
                if(!/* isNaN */isNaN(p)) {
                    from.setProbOf(relation, v.indexOf(e), p);
                }
                /* setLength */((sb, length) => sb.str = sb.str.substring(0, length))(s, 0);
            } else {
                if(!/* contains */(v.indexOf(<any>(/* toString */s.str)) >= 0)) {
                    /* addElement */(v.push(/* toString */s.str.trim())>0);
                }
                /* setLength */((sb, length) => sb.str = sb.str.substring(0, length))(s, 0);
            }
        }

        static mergeDescriptions(e : medicinejava.Entity, d : string) {
            if(/* equals */(<any>((o1: any, o2: any) => { if(o1 && o1.equals) { return o1.equals(o2); } else { return o1 === o2; } })(e.description,d))) return;
            if(/* startsWith */((str, searchString, position = 0) => str.substr(position, searchString.length) === searchString)(e.description, d)) return;
            if(/* startsWith */((str, searchString, position = 0) => str.substr(position, searchString.length) === searchString)(d, e.description)) {
                e.description = d;
                return;
            } else e.description += '\n' + d;
        }

        /**
         * Convert a Vector to a string as a delimited list - for serialisation!
         * @param {Array} v
         * @param {string} delimiter
         * @return {string}
         */
        public static getDelimitedNames(v : Array<any>, delimiter : string) : string {
            let list : { str: string, toString: Function } = { str: "", toString: function() { return this.str; } };
            for(let i : number = 0; i < /* size */(<number>v.length); i++) {{
                let o : any = /* get */v[i];
                let s : string = o.toString();
                s = /* replace *//* replace *//* replace */s.split('{').join('(').split('}').join(')').split(',').join('`');
                /* append */(sb => { sb.str = sb.str.concat(<any>s.toString()); return sb; })(list);
                if(i < /* size */(<number>v.length) - 1) /* append */(sb => { sb.str = sb.str.concat(<any>delimiter); return sb; })(list);
            };}
            return /* toString */list.str;
        }

        /**
         * Get the list for a particular direction - for serialisation
         * @param {medicinejava.Entity} e
         * @param {number} relation
         * @param {string} delimiter
         * @return {string}
         */
        public static getDelimitedEntities(e : medicinejava.Entity, relation : number, delimiter : string) : string {
            let list : { str: string, toString: Function } = { str: "", toString: function() { return this.str; } };
            let v : Array<any> = e.listOf(relation);
            let p : number[] = e.probsOf(relation);
            for(let i : number = 0; i < /* size */(<number>v.length); i++) {{
                let o : any = /* get */v[i];
                let s : string = o.toString();
                s = /* replace *//* replace *//* replace */s.split('{').join('(').split('}').join(')').split(',').join('`');
                /* append */(sb => { sb.str = sb.str.concat(<any>s.toString()); return sb; })(list);
                if(p != null && p.length > i && !/* isNaN */isNaN(p[i])) {
                    /* append */(sb => { sb.str = sb.str.concat(<any>' '); return sb; })(list);
                    /* append */(sb => { sb.str = sb.str.concat(<any>p[i]); return sb; })(list);
                    /* append */(sb => { sb.str = sb.str.concat(<any>'%'); return sb; })(list);
                }
                if(i < /* size */(<number>v.length) - 1) /* append */(sb => { sb.str = sb.str.concat(<any>delimiter); return sb; })(list);
            };}
            return /* toString */list.str;
        }

        /**
         * Blocking call that checks each entity in the set
         * and ensures that every connection has a reciprocal.
         * If not, one is created.
         * Returns the number of extra connections created.
         * @param {medicinejava.EntityData} d
         * @return {number}
         */
        public static validateConnections(d : medicinejava.EntityData) : number {
            let errors : number = 0;
            for(let i : any = /* iterator */((a) => { var i = 0; return { next: function() { return i<a.length?a[i++]:null; }, hasNext: function() { return i<a.length; }}})(d.getAllEntities()); i.hasNext(); ) {{
                let e : medicinejava.Entity = <medicinejava.Entity>i.next();
                for(let j : number = 1; j < medicinejava.Entity.relationList_$LI$().length; j++) {{
                    let r : number = medicinejava.Entity.relationList_$LI$()[j];
                    let ri : number = medicinejava.Entity.inverseOf(r);
                    for(let k : any = /* iterator */((a) => { var i = 0; return { next: function() { return i<a.length?a[i++]:null; }, hasNext: function() { return i<a.length; }}})(e.listOf(r)); k.hasNext(); ) {{
                        let f : medicinejava.Entity = <medicinejava.Entity>k.next();
                        if(!/* contains */(f.listOf(ri).indexOf(<any>(e)) >= 0)) {
                            /* add */(f.listOf(ri).push(e)>0);
                            errors++;
                        }
                    };}
                };}
            };}
            return errors;
        }

        /**
         * Lists all causes of an entity
         * Use: Vector v=getAllCauses(currentEntity, null);
         * @param {medicinejava.Entity} entity
         * @param {Array} except
         * @return {Array}
         */
        public static getAllCauses(entity : medicinejava.Entity, except : Array<any>) : Array<any> {
            if(except != null && /* contains */(except.indexOf(<any>(entity)) >= 0)) return null;
            if(except == null) except = <any>([]);
            let v : Array<any> = <any>([]);
            /* add */(except.push(entity)>0);
            for(let i : number = 0; i < /* size */(<number>entity.causes.length); i++) {{
                let e : medicinejava.Entity = <medicinejava.Entity>/* get */entity.causes[i];
                if(except == null || !/* contains */(except.indexOf(<any>(e)) >= 0)) {
                    let ve : Array<any> = Entities.getAllCauses(e, v);
                    if(ve != null) {
                        if(/* size */(<number>ve.length) > 0) /* addAll */((l1, l2) => l1.push.apply(l1, l2))(v, ve); else /* add */(ve.push(e)>0);
                    }
                }
            };}
            return v;
        }

        public static getRelationNamesFromBits(b : number) : string {
            let s : string = "";
            for(let i : number = 0; i < medicinejava.Entity.relationList_$LI$().length; i++) {{
                if((b & medicinejava.Entity.relationList_$LI$()[i]) > 0) s += medicinejava.Entity.relationNameList_$LI$()[i];
            };}
            if(/* endsWith */((str, searchString) => { let pos = str.length - searchString.length; let lastIndex = str.indexOf(searchString, pos); return lastIndex !== -1 && lastIndex === pos; })(s, "s")) s = s.substring(0, s.length - 1);
            return s.toLowerCase();
        }

        public static getExtensiveListOf$int$medicinejava_Entity$int(relations : number, entity : medicinejava.Entity, depth : number) : Array<any> {
            return Entities.getExtensiveListOf$int$medicinejava_Entity$int$java_util_Set(relations, entity, depth, null);
        }

        public static getExtensiveListOf$int$medicinejava_Entity$int$java_util_Set(relations : number, entity : medicinejava.Entity, depth : number, except : Array<any>) : Array<any> {
            let v : Array<any> = except;
            if(depth < 0) return v;
            if(v == null) v = <any>([]);
            if(/* contains */(v.indexOf(<any>(entity)) >= 0)) return v;
            /* add */((s, e) => { if(s.indexOf(e)==-1) { s.push(e); return true; } else { return false; } })(v, entity);
            for(let i : number = 0; i < medicinejava.Entity.relationList_$LI$().length; i++) {{
                if((relations & medicinejava.Entity.relationList_$LI$()[i]) > 0) {
                    let ve : Array<any> = entity.listOf(medicinejava.Entity.relationList_$LI$()[i]);
                    if(ve != null) for(let j : number = 0; j < /* size */(<number>ve.length); j++) {{
                        let e : medicinejava.Entity = <medicinejava.Entity>/* get */ve[j];
                        let vf : Array<any> = Entities.getExtensiveListOf$int$medicinejava_Entity$int$java_util_Set(relations, e, depth - 1, v);
                        /* addAll */((l1, l2) => l1.push.apply(l1, l2))(v, vf);
                    };}
                }
            };}
            return v;
        }

        public static getExtensiveListOf(relations? : any, entity? : any, depth? : any, except? : any) : any {
            if(((typeof relations === 'number') || relations === null) && ((entity != null && entity instanceof <any>medicinejava.Entity) || entity === null) && ((typeof depth === 'number') || depth === null) && ((except != null && (except instanceof Array)) || except === null)) {
                return <any>medicinejava.Entities.getExtensiveListOf$int$medicinejava_Entity$int$java_util_Set(relations, entity, depth, except);
            } else if(((typeof relations === 'number') || relations === null) && ((entity != null && entity instanceof <any>medicinejava.Entity) || entity === null) && ((typeof depth === 'number') || depth === null) && except === undefined) {
                return <any>medicinejava.Entities.getExtensiveListOf$int$medicinejava_Entity$int(relations, entity, depth);
            } else throw new Error('invalid overload');
        }

        public static getDirectionalListOf$int$medicinejava_Entity$int(relations : number, entity : medicinejava.Entity, depth : number) : Array<any> {
            let s : Array<any> = Entities.getDirectionalListOf$int$medicinejava_Entity$int$java_util_Set(relations, entity, depth, null);
            let rm : Array<medicinejava.Entity> = <any>([]);
            {
                let array18061 = <Array<medicinejava.Entity>><any>s;
                for(let index18060=0; index18060 < array18061.length; index18060++) {
                    let e = array18061[index18060];
                    {
                        if(Entities.isChildOf(e, entity) || Entities.isChildOf(entity, e) || entity === e) {
                            /* add */((s, e) => { if(s.indexOf(e)==-1) { s.push(e); return true; } else { return false; } })(rm, e);
                        }
                    }
                }
            }
            /* removeAll */((a, r) => { let b=false; for(let i=0;i<r.length;i++) { let ndx=a.indexOf(r[i]); if(ndx>=0) { a.splice(ndx, 1); b=true; } } return b; })(s,rm);
            return s;
        }

        public static getDirectionalListOf$int$medicinejava_Entity$int$java_util_Set(relations : number, entity : medicinejava.Entity, depth : number, except : Array<any>) : Array<any> {
            let v : Array<any> = except;
            if(depth < 0) return v;
            let first : boolean = v == null;
            if(first) v = <any>([]);
            if(/* contains */(v.indexOf(<any>(entity)) >= 0)) return v;
            /* add */((s, e) => { if(s.indexOf(e)==-1) { s.push(e); return true; } else { return false; } })(v, entity);
            for(let i : number = 0; i < medicinejava.Entity.relationList_$LI$().length; i++) {{
                if((relations & medicinejava.Entity.relationList_$LI$()[i]) > 0) {
                    let ve : Array<any> = entity.listOf(medicinejava.Entity.relationList_$LI$()[i]);
                    if(ve != null) for(let j : number = 0; j < /* size */(<number>ve.length); j++) {{
                        let e : medicinejava.Entity = <medicinejava.Entity>/* get */ve[j];
                        let newrelations : number = relations & ~medicinejava.Entity.inverseOf(medicinejava.Entity.relationList_$LI$()[i]);
                        let vf : Array<any> = Entities.getDirectionalListOf$int$medicinejava_Entity$int$java_util_Set(newrelations, e, depth - 1, v);
                        /* addAll */((l1, l2) => l1.push.apply(l1, l2))(v, vf);
                    };}
                }
            };}
            return v;
        }

        /**
         * This implements recursive getDirectionalListOf
         * @param {number} relations
         * @param {medicinejava.Entity} entity
         * @param {number} depth
         * @param {Array} except
         * @return {Array}
         */
        public static getDirectionalListOf(relations? : any, entity? : any, depth? : any, except? : any) : any {
            if(((typeof relations === 'number') || relations === null) && ((entity != null && entity instanceof <any>medicinejava.Entity) || entity === null) && ((typeof depth === 'number') || depth === null) && ((except != null && (except instanceof Array)) || except === null)) {
                return <any>medicinejava.Entities.getDirectionalListOf$int$medicinejava_Entity$int$java_util_Set(relations, entity, depth, except);
            } else if(((typeof relations === 'number') || relations === null) && ((entity != null && entity instanceof <any>medicinejava.Entity) || entity === null) && ((typeof depth === 'number') || depth === null) && except === undefined) {
                return <any>medicinejava.Entities.getDirectionalListOf$int$medicinejava_Entity$int(relations, entity, depth);
            } else throw new Error('invalid overload');
        }

        public static getCauseHierarchy(entity : medicinejava.Entity, complete : Array<any>) : Array<any> {
            if(complete != null && /* contains */(complete.indexOf(<any>(entity)) >= 0)) return null;
            if(complete == null) complete = <any>([]);
            let v : Array<any> = <any>([]);
            /* add */(complete.push(entity)>0);
            for(let i : number = 0; i < /* size */(<number>entity.causes.length); i++) {{
                let e : medicinejava.Entity = <medicinejava.Entity>/* get */entity.causes[i];
                if(complete == null || !/* contains */(complete.indexOf(<any>(e)) >= 0)) {
                    let add : Array<any> = Entities.getCauseHierarchy(e, complete);
                    if(add != null) /* add */(v.push(add)>0);
                }
            };}
            return v;
        }

        public static numConnections(e : medicinejava.Entity) : number {
            return /* size */(<number>e.causes.length) + /* size */(<number>e.effects.length) + /* size */(<number>e.parents.length) + /* size */(<number>e.children.length);
        }

        /**
         * Recursively find whether the given queryItem is a child of 'parent'.
         * @param {medicinejava.Entity} queryItem
         * @param {medicinejava.Entity} parent
         * @return {boolean}
         */
        public static isChildOf(queryItem : medicinejava.Entity, parent : medicinejava.Entity) : boolean {
            return Entities.isChildOfRecursive(queryItem, parent, <any>([]));
        }

        public static isChildOfRecursive(queryItem : medicinejava.Entity, parent : medicinejava.Entity, avoid : Array<any>) : boolean {
            if(/* contains */(avoid.indexOf(<any>(queryItem)) >= 0)) return false;
            /* add */(avoid.push(queryItem)>0);
            let p : Array<any> = queryItem.parents;
            if(p.indexOf(parent) >= 0) return true;
            for(let i : number = 0; i < /* size */(<number>p.length); i++) {{
                let nquery : medicinejava.Entity = <medicinejava.Entity>/* get */p[i];
                if(Entities.isChildOfRecursive(nquery, parent, avoid)) return true;
            };}
            return false;
        }

        public data : medicinejava.EntityData;

        /**
         * Get an entity by name. This call is slow and blocking.
         * @param any a node to start searching from.
         * @param {string} name
         * @param {medicinejava.EntityData} data
         * @return {medicinejava.Entity}
         */
        public static getSpecificNamedEntity(name : string, data : medicinejava.EntityData) : medicinejava.Entity {
            let v : Array<any> = data.findEntities(name, false, true);
            if(/* size */(<number>v.length) === 1) return <medicinejava.Entity>/* get */v[1]; else throw new medicinejava.EntityNotFoundException("Can\'t find entity " + name);
        }

        /**
         * Traverse the parents, using only the first element in the list of
         * parents on each level; and return the topmost entity
         * @param {medicinejava.Entity} e
         * @return {medicinejava.Entity}
         */
        public static getUltimateParents(e : medicinejava.Entity) : medicinejava.Entity {
            if(/* size */(<number>e.parents.length) === 0) return null;
            let p : medicinejava.Entity = <medicinejava.Entity>/* elementAt */e.parents[0];
            while((/* size */(<number>p.parents.length) > 0)) {{
                p = <medicinejava.Entity>/* elementAt */p.parents[0];
            }};
            return p;
        }

        /**
         * traverse along a particular direction, getting the top item on each list
         * in that direction.
         * @param {medicinejava.Entity} e
         * @param {number} direction
         * @return {medicinejava.Entity[]}
         */
        public static getChainOfFirstItem(e : medicinejava.Entity, direction : number) : Array<medicinejava.Entity> {
            let v : Array<medicinejava.Entity> = <any>([]);
            /* add */(v.push(e)>0);
            while((!/* isEmpty */(e.listOf(direction).length == 0))) {{
                /* add */(v.push(e = <medicinejava.Entity>/* get */e.listOf(direction)[0])>0);
            }};
            return v;
        }

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
        public static isRelatedTo(from : medicinejava.Entity, to : medicinejava.Entity, relations : number, maxRecursionDepth : number, excludeItems : Array<any>) : boolean {
            if(excludeItems == null) excludeItems = <any>([]);
            if(/* contains */(excludeItems.indexOf(<any>(from)) >= 0)) return false;
            if(maxRecursionDepth <= 0) return false;
            if(from === to) {
                return true;
            }
            for(let i : number = 0; i < medicinejava.Entity.relationList_$LI$().length; i++) {{
                if((relations & medicinejava.Entity.relationList_$LI$()[i]) > 0) {
                    let v : Array<any> = from.listOf(medicinejava.Entity.relationList_$LI$()[i]);
                    for(let j : number = 0; j < /* size */(<number>v.length); j++) {{
                        let e : medicinejava.Entity = <medicinejava.Entity>/* get */v[j];
                        if(e === to) return true;
                        let newExcludeItems : Array<any> = <any>(excludeItems.slice(0));
                        /* add */(newExcludeItems.push(from)>0);
                        if(Entities.isRelatedTo(e, to, relations, maxRecursionDepth - 1, newExcludeItems)) return true;
                    };}
                }
            };}
            return false;
        }

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
        public static findRelationChains(from : medicinejava.Entity, to : medicinejava.Entity, relations : number, maxRecursionDepth : number, excludeItems : Array<any>, currentSolutions : Array<any>, currentChain : Array<any>, temporarilyAvoidDirections : number) : Array<any> {
            if(excludeItems == null) excludeItems = <any>([]);
            if(currentChain == null) currentChain = <any>([]);
            if(currentSolutions == null) currentSolutions = <any>([]);
            if(/* contains */(excludeItems.indexOf(<any>(from)) >= 0)) return currentSolutions;
            if(maxRecursionDepth <= 0) return currentSolutions;
            currentChain = <Array<any>>/* clone *//* clone */((o:any) => { if(o.clone!=undefined) { return (<any>o).clone(); } else { let clone = Object.create(o); for(let p in o) { if (o.hasOwnProperty(p)) clone[p] = o[p]; } return clone; } })(currentChain);
            /* add */(currentChain.push(from)>0);
            if(from === to) {
                /* add */(currentSolutions.push(currentChain)>0);
                return currentSolutions;
            }
            for(let i : number = 0; i < medicinejava.Entity.relationList_$LI$().length; i++) {{
                let currentRelation : number = medicinejava.Entity.relationList_$LI$()[i];
                if((currentRelation & temporarilyAvoidDirections) > 0) continue;
                if((relations & currentRelation) > 0) {
                    let v : Array<any> = from.listOf(currentRelation);
                    for(let j : number = 0; j < /* size */(<number>v.length); j++) {{
                        let e : medicinejava.Entity = <medicinejava.Entity>/* get */v[j];
                        let newExcludeItems : Array<any> = <any>(excludeItems.slice(0));
                        /* add */(newExcludeItems.push(from)>0);
                        Entities.findRelationChains(e, to, relations, maxRecursionDepth - 1, newExcludeItems, currentSolutions, currentChain, medicinejava.Entity.inverseOf(currentRelation));
                    };}
                }
            };}
            return currentSolutions;
        }

        public static findRelationChainsSorted(from : medicinejava.Entity, to : medicinejava.Entity, relations : number, maxRecursionDepth : number, excludeItems : Array<any>, currentSolutions : Array<any>, currentChain : Array<any>, temporarilyAvoidDirections : number) : Array<any> {
            let solutions : Array<any> = Entities.findRelationChains(from, to, relations, maxRecursionDepth, excludeItems, currentSolutions, currentChain, temporarilyAvoidDirections);
            let sorter : any = (o1 : any, o2 : any) => {
                return /* size */(<number>(<Array<any>>o1).length) - /* size */(<number>(<Array<any>>o2).length);
            };
            /* sort */((l,c) => { if((<any>c).compare) l.sort((e1,e2)=>(<any>c).compare(e1,e2)); else l.sort(<any>c); })(solutions,sorter);
            return solutions;
        }

        public static toLowerCase(e : medicinejava.Entity) : string {
            let n : string = e.name;
            let startword : boolean = true;
            for(let j : number = 0; j < n.length; j++) {{
                if(startword && (j < n.length - 1) && /* isUpperCase */(s => s.toUpperCase() === s)(n.charAt(j)) && /* isLowerCase */(s => s.toLowerCase() === s)(n.charAt(j + 1))) {
                    n = n.substring(0, j) + /* toLowerCase */n.charAt(j).toLowerCase() + n.substring(j + 1);
                }
                startword = javaemul.internal.CharacterHelper.isWhitespace(n.charAt(j));
            };}
            return n;
        }

        /**
         * Convert a vector of connectivity  into a text
         * @param {Array} ch
         * @return {string}
         */
        public static chainText(ch : Array<any>) : string {
            let fr : medicinejava.Entity = <medicinejava.Entity>/* get */ch[0];
            let out : string = fr.name;
            for(let i : number = 1; i < /* size */(<number>ch.length); i++) {{
                let to : medicinejava.Entity = <medicinejava.Entity>/* get */ch[i];
                let found : boolean = false;
                for(let j : number = 0; j < medicinejava.Entity.relationList_$LI$().length; j++) {{
                    if(/* contains */(fr.listOf(medicinejava.Entity.relationList_$LI$()[j]).indexOf(<any>(to)) >= 0)) {
                        let tmp : string;
                        if(i === 1) tmp = " is a "; else tmp = ", which is a ";
                        if(medicinejava.Entity.inverseOf(medicinejava.Entity.relationList_$LI$()[j]) !== medicinejava.Entity.CHILD) out += tmp + Entities.getRelationNamesFromBits(medicinejava.Entity.inverseOf(medicinejava.Entity.relationList_$LI$()[j])) + " of " + to.name.toLowerCase(); else out += tmp + " " + to.name.toLowerCase();
                        found = true;
                        break;
                    }
                };}
                if(!found) throw Object.defineProperty(new Error("Ill-formed chain, " + /* implicit toString */ (a => a?'['+a.join(', ')+']':'null')(ch)), '__classes', { configurable: true, value: ['java.lang.Throwable','java.lang.Object','java.lang.RuntimeException','java.lang.IllegalArgumentException','java.lang.Exception'] });
                fr = to;
            };}
            return out + ".";
        }

        /**
         * Convert a Vector to a colloquial text list
         * (lower case with commas and 'and')
         * @param {Array} v
         * @return {string}
         */
        public static listToText(v : Array<any>) : string {
            let sb : { str: string, toString: Function } = { str: "", toString: function() { return this.str; } };
            for(let i : number = 0; i < /* size */(<number>v.length); i++) {{
                let e : medicinejava.Entity = (<medicinejava.Entity>/* get */v[i]);
                let n : string = Entities.toLowerCase(e);
                /* append */(sb => { sb.str = sb.str.concat(<any>n); return sb; })(sb);
                if(i === /* size */(<number>v.length) - 2) /* append */(sb => { sb.str = sb.str.concat(<any>" and "); return sb; })(sb); else if(i < /* size */(<number>v.length) - 2) /* append */(sb => { sb.str = sb.str.concat(<any>", "); return sb; })(sb);
            };}
            if(/* length */sb.str.length > 0) return /* toString */sb.str; else return null;
        }

        /**
         * Group a list according to their standard ultimate parents.
         * Returns a hashtable of sublists of entities.
         * @param {medicinejava.Entity[]} c
         * @param {number} i
         * @return {*}
         */
        public static groupedVectors(c : Array<medicinejava.Entity>, i : number) : any {
            let r : any = <any>({});
            for(let index18062=0; index18062 < c.length; index18062++) {
                let e = c[index18062];
                {
                    let pe : medicinejava.Entity = Entities.getUltimateParents(e);
                    let pn : string;
                    if(pe != null) {
                        pn = pe.name;
                    } else {
                        pn = "Other";
                    }
                    let v : Array<medicinejava.Entity> = <Array<medicinejava.Entity>>/* get */((m,k) => m[k]===undefined?null:m[k])(r, pn);
                    if(v == null) {
                        v = <any>([]);
                        /* put */(r[pn] = v);
                    }
                    /* add */(v.push(e)>0);
                }
            }
            let modresult : any = <any>/* clone */(o => { let c = {}; for (let k in Object.keys(o)){ c[k] = o[k] } return c; })(r);
            {
                let array18064 = /* keySet */Object.keys(r);
                for(let index18063=0; index18063 < array18064.length; index18063++) {
                    let k = array18064[index18063];
                    {
                        let l : Array<medicinejava.Entity> = <Array<medicinejava.Entity>>/* get */((m,k) => m[k]===undefined?null:m[k])(r, k);
                        if(/* size */(<number>l.length) > Entities.MAX_LIST_SIZE) {
                            /* put */((m,k,v) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { m.entries[i].value=v; return; } m.entries.push({key:k,value:v,getKey: function() { return this.key }, getValue: function() { return this.value }}); })(<any>modresult, k, Entities.regroup(l));
                        }
                    }
                }
            }
            return modresult;
        }

        static MAX_LIST_SIZE : number = 5;

        static regroup(v : Array<medicinejava.Entity>) : any {
            let highestlevel : number = 0;
            let maxgrp : number = /* size */(<number>v.length);
            let hier : Array<Array<medicinejava.Entity>> = <any>([]);
            for(let index18065=0; index18065 < v.length; index18065++) {
                let e = v[index18065];
                {
                    let h : Array<any> = Entities.getChainOfFirstItem(e, medicinejava.Entity.PARENT);
                    /* reverse */h.reverse();
                    /* add */(hier.push(h)>0);
                }
            }
            let uniques : Array<medicinejava.Entity> = null;
            let grpitems : Array<Array<medicinejava.Entity>> = null;
            while((maxgrp > Entities.MAX_LIST_SIZE && highestlevel < 4)) {{
                highestlevel++;
                uniques = <any>([]);
                let grpsize : Array<number> = <any>([]);
                grpitems = <any>([]);
                for(let index18066=0; index18066 < hier.length; index18066++) {
                    let h = hier[index18066];
                    {
                        let top : medicinejava.Entity = /* get */h[Math.max(0, Math.min(highestlevel, /* size */(<number>h.length) - 2))];
                        if(!/* contains */(uniques.indexOf(<any>(top)) >= 0)) {
                            /* add */(uniques.push(top)>0);
                            let le : Array<any> = <any>([]);
                            /* add */(grpitems.push(le)>0);
                            /* add */(le.push(/* lastElement */((s) => { return s[s.length-1]; })(h))>0);
                            /* add */(grpsize.push(1)>0);
                        } else {
                            let ix : number = uniques.indexOf(top);
                            /* add */(/* get */grpitems[ix].push(/* lastElement */((s) => { return s[s.length-1]; })(h))>0);
                            /* set */(grpsize[ix] = /* get */grpsize[ix] + 1);
                        }
                    }
                }
                maxgrp = 0;
                for(let index18067=0; index18067 < grpsize.length; index18067++) {
                    let i = grpsize[index18067];
                    if(maxgrp < i) {
                        maxgrp = i;
                    }
                }
            }};
            let result : any = <any>({});
            if(uniques == null) {
                return null;
            }
            let MIN_SIZE : number = 2;
            for(let index18068=0; index18068 < uniques.length; index18068++) {
                let u = uniques[index18068];
                {
                    let vi : Array<medicinejava.Entity> = /* get */grpitems[uniques.indexOf(u)];
                    if(/* size */(<number>vi.length) >= MIN_SIZE) /* put */(result[u.name] = vi); else {
                        for(let index18069=0; index18069 < vi.length; index18069++) {
                            let ei = vi[index18069];
                            /* put */(result[ei.name] = ei)
                        }
                    }
                }
            }
            return result;
        }
    }
    Entities["__class"] = "medicinejava.Entities";


    export namespace Entities {

        export class EOF {
            constructor() {
                (<any>Object).setPrototypeOf(this, EOF.prototype);
            }
        }
        EOF["__class"] = "medicinejava.Entities.EOF";
        EOF["__interfaces"] = ["java.io.Serializable"];



        export class EOE {
            constructor() {
                (<any>Object).setPrototypeOf(this, EOE.prototype);
            }
        }
        EOE["__class"] = "medicinejava.Entities.EOE";
        EOE["__interfaces"] = ["java.io.Serializable"];



        export class AmbiguityException extends Error {
            public constructor(s? : any) {
                if(((typeof s === 'string') || s === null)) {
                    let __args = arguments;
                    super(s); this.message=s;
                    (<any>Object).setPrototypeOf(this, AmbiguityException.prototype);
                } else if(s === undefined) {
                    let __args = arguments;
                    super();
                    (<any>Object).setPrototypeOf(this, AmbiguityException.prototype);
                } else throw new Error('invalid overload');
            }
        }
        AmbiguityException["__class"] = "medicinejava.Entities.AmbiguityException";
        AmbiguityException["__interfaces"] = ["java.io.Serializable"];


    }


    export class EntityNotFoundException extends Error {
        constructor(s : string) {
            super(s); this.message=s;
            (<any>Object).setPrototypeOf(this, EntityNotFoundException.prototype);
        }
    }
    EntityNotFoundException["__class"] = "medicinejava.EntityNotFoundException";
    EntityNotFoundException["__interfaces"] = ["java.io.Serializable"];



    export class Stem {
        entity : medicinejava.Entity;

        correct : boolean;

        reasoning : string;

        constructor() {
            if(this.entity===undefined) this.entity = null;
            if(this.correct===undefined) this.correct = false;
            if(this.reasoning===undefined) this.reasoning = null;
        }
    }
    Stem["__class"] = "medicinejava.Stem";


    export class Essay {
        e : medicinejava.Entity;

        public constructor(e : medicinejava.Entity) {
            if(this.e===undefined) this.e = null;
            this.e = e;
        }

        text : string = "";

        public createText() : string {
            this.text = Essay.getText(this.e);
            return this.text;
        }

        public static getText(e : medicinejava.Entity) : string {
            let text : string;
            text = e.name;
            if(/* size */(<number>e.synonyms.length) > 0) {
                text += ", also known as";
                for(let i : number = 0; i < /* size */(<number>e.synonyms.length); i++) {{
                    text += " " + /* elementAt */e.synonyms[i].toString() + ",";
                };}
            }
            let tmp : string = "";
            if(/* size */(<number>e.parents.length) === 1) {
                text += " is a " + (<medicinejava.Entity>/* get */e.parents[0]).name.toLowerCase() + ". ";
            } else {
                text += " is a " + medicinejava.Entities.listToText(e.parents) + ". ";
            }
            if(/* size */(<number>e.children.length) > 0) {
                if(/* size */(<number>e.children.length) === 1) {
                } else {
                    tmp = "Its subtypes include " + medicinejava.Entities.listToText(e.children);
                }
            }
            let causelist : string = medicinejava.Entities.listToText(e.causes);
            if(causelist != null) text = text + "It can be caused by " + causelist + ". ";
            let effectlist : string = medicinejava.Entities.listToText(e.effects);
            if(effectlist != null) text = text + "It is known to cause " + effectlist + ". ";
            let rxlist : string = medicinejava.Entities.listToText(e.treats);
            if(rxlist != null) text = text + "It is used to treat " + rxlist + ". ";
            rxlist = medicinejava.Entities.listToText(e.treatments);
            if(rxlist != null) text = text + "It can be treated with " + rxlist + ". ";
            text = text + " " + e.description;
            return text;
        }
    }
    Essay["__class"] = "medicinejava.Essay";


    export class Question {
        getCorrectStems() : Array<medicinejava.Stem> {
            return this.correctStem;
        }

        getIncorrectStems() : Array<medicinejava.Stem> {
            return this.errorStems;
        }

        correctStem : Array<medicinejava.Stem> = <any>([]);

        errorStems : Array<medicinejava.Stem> = <any>([]);

        /**
         * The direction which the mode uses - Enitity.DIRECTIONS
         */
        direction : number;

        /**
         * the root entity that appears in the question head
         */
        root : medicinejava.Entity;

        /**
         * the actual text of the head
         */
        head : string;

        /**
         * the mode of questioning used to generate this question, from Logic.MODE_XXX
         */
        mode : number;

        /**
         * the difficulty category of the question
         */
        difficulty : number;

        /**
         * possible difficulty levels
         */
        static DIF1 : number = 1;

        /**
         * possible difficulty levels
         */
        static DIF2 : number = 2;

        /**
         * possible difficulty levels
         */
        static DIF3 : number = 3;

        /**
         * possible difficulty levels
         */
        static DIF4 : number = 4;

        /**
         * status of question
         */
        status : number;

        /**
         * possible status values
         */
        static STAT_OK : number = 3;

        /**
         * possible status values
         */
        static STAT_CHECK : number = 2;

        /**
         * possible status values
         */
        static STAT_UNCHECKED : number = 1;

        toProps() : any {
            let p : any = <any>new Object();
            for(let i : number = 0; i < /* size */(<number>this.correctStem.length); i++) {{
                /* setProperty */((m,k,v) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { m.entries[i].value=v; return; } m.entries.push({key:k,value:v,getKey: function() { return this.key }, getValue: function() { return this.value }}); })(<any>p, "Correct" + i, /* get */this.correctStem[i].entity.toString());
                /* setProperty */((m,k,v) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { m.entries[i].value=v; return; } m.entries.push({key:k,value:v,getKey: function() { return this.key }, getValue: function() { return this.value }}); })(<any>p, "CorrectReasoning" + i, /* get */this.correctStem[i].reasoning);
            };}
            for(let i : number = 0; i < /* size */(<number>this.errorStems.length); i++) {{
                /* setProperty */((m,k,v) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { m.entries[i].value=v; return; } m.entries.push({key:k,value:v,getKey: function() { return this.key }, getValue: function() { return this.value }}); })(<any>p, "Incorrect" + i, /* get */this.errorStems[i].entity.toString());
                /* setProperty */((m,k,v) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { m.entries[i].value=v; return; } m.entries.push({key:k,value:v,getKey: function() { return this.key }, getValue: function() { return this.value }}); })(<any>p, "IncorrectReasoning" + i, /* get */this.errorStems[i].reasoning);
            };}
            /* setProperty */((m,k,v) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { m.entries[i].value=v; return; } m.entries.push({key:k,value:v,getKey: function() { return this.key }, getValue: function() { return this.value }}); })(<any>p, "Head", this.head);
            /* setProperty */((m,k,v) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { m.entries[i].value=v; return; } m.entries.push({key:k,value:v,getKey: function() { return this.key }, getValue: function() { return this.value }}); })(<any>p, "Root", this.root.toString());
            /* setProperty */((m,k,v) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { m.entries[i].value=v; return; } m.entries.push({key:k,value:v,getKey: function() { return this.key }, getValue: function() { return this.value }}); })(<any>p, "Direction", /* valueOf */new String(this.direction).toString());
            /* setProperty */((m,k,v) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { m.entries[i].value=v; return; } m.entries.push({key:k,value:v,getKey: function() { return this.key }, getValue: function() { return this.value }}); })(<any>p, "Mode", /* valueOf */new String(this.mode).toString());
            /* setProperty */((m,k,v) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { m.entries[i].value=v; return; } m.entries.push({key:k,value:v,getKey: function() { return this.key }, getValue: function() { return this.value }}); })(<any>p, "Difficulty", /* valueOf */new String(this.difficulty).toString());
            return p;
        }

        fromProps(p : any, ed : medicinejava.EntityData) {
            let i : number = 0;
            let o : any;
            do {{
                o = /* getProperty */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries[i].value; } return null; })(<any>p, "Correct" + i);
                if(o != null) {
                    let s : medicinejava.Stem = new medicinejava.Stem();
                    s.correct = true;
                    s.entity = ed.findEntityExact(<string>o);
                    if(s.entity == null) s.entity = new Question.FakeEntity(<string>o);
                    s.reasoning = /* getProperty */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries[i].value; } return null; })(<any>p, "CorrectReasoning" + i);
                    /* add */(this.correctStem.push(s)>0);
                }
                i++;
            }} while((o != null));
            i = 0;
            o = null;
            do {{
                o = /* getProperty */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries[i].value; } return null; })(<any>p, "Incorrect" + i);
                if(o != null) {
                    let s : medicinejava.Stem = new medicinejava.Stem();
                    s.correct = false;
                    s.entity = ed.findEntityExact(<string>o);
                    if(s.entity == null) s.entity = new Question.FakeEntity(<string>o);
                    s.reasoning = /* getProperty */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries[i].value; } return null; })(<any>p, "IncorrectReasoning" + i);
                    /* add */(this.errorStems.push(s)>0);
                }
                i++;
            }} while((o != null));
            this.head = /* getProperty */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries[i].value; } return null; })(<any>p, "Head");
            this.root = ed.findEntityExact(/* getProperty */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries[i].value; } return null; })(<any>p, "Root"));
            this.direction = parseFloat(/* getProperty */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries[i].value; } return null; })(<any>p, "Direction"));
            this.mode = parseFloat(/* getProperty */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries[i].value; } return null; })(<any>p, "Mode"));
            this.difficulty = parseFloat(/* getProperty */((m,k) => { if(m.entries==null) m.entries=[]; for(let i=0;i<m.entries.length;i++) if(m.entries[i].key.equals!=null && m.entries[i].key.equals(k) || m.entries[i].key===k) { return m.entries[i].value; } return null; })(<any>p, "Difficulty"));
        }

        constructor() {
            if(this.direction===undefined) this.direction = 0;
            if(this.root===undefined) this.root = null;
            if(this.head===undefined) this.head = null;
            if(this.mode===undefined) this.mode = 0;
            if(this.difficulty===undefined) this.difficulty = 0;
            if(this.status===undefined) this.status = 0;
        }
    }
    Question["__class"] = "medicinejava.Question";
    Question["__interfaces"] = ["java.io.Serializable"];



    export namespace Question {

        export class FakeEntity extends medicinejava.Entity {
            constructor(s : string) {
                super(null, 0);
                this.name = s;
            }
        }
        FakeEntity["__class"] = "medicinejava.Question.FakeEntity";
        FakeEntity["__interfaces"] = ["java.io.Serializable"];


    }

}


medicinejava.Entities.standardStrings_$LI$();

medicinejava.Entity.relationNameList_$LI$();

medicinejava.Entity.relationList_$LI$();

medicinejava.Logic.MODE_NAMES_$LI$();
