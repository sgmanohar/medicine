package org.jsweet;

import static def.dom.Globals.*;
import java.io.*;
import java.util.*;

public class Logic{
  /** Logic modes - how to choose alternatives! */
  static final int MODE_RANDOM_TYPED=0, 
      MODE_RANDOM_RELATED=1, MODE_COMPLETELY_RANDOM=2,
      MODE_SOUNDS_SIMILAR=3,
      MODE_BROTHER_OF_CORRECT=4, 
      MODE_BROTHER_OF_ROOT=5;
  
  static final String[] MODE_NAMES = {"Random typed", "Random related", "Random.", "Looks similar", "Brother of correct", "Brother of root"};
  

  EntityData ed;
  Entity seed;
  
  /** number of incorrect answers to generate */
  int N=4; 
  /** Choose a random item as the root   */
  boolean randomroot = false;
  /** Restrict possible roots to items with proper ultimate parents */
  boolean restrRoot = false;
  /** Restrict possible stems to items with proper ultimate parents */
  boolean restrChoice = false;
  /** Include descriptions in the reasoning  */
  boolean INCLUDE_DESCRIPTION=true;
  
  /** permitted direction for question */
  int[] DIRECTIONS = { Entity.CAUSE, Entity.EFFECT, Entity.TREATMENTS, Entity.TREATS };
  /** 
   * an array of pairs of strings that wrap the root entity; 
   * currently one pair for each direction of questioning. 
   */
  String[][] questionHead ={ 
      {"Which of the following is most likely to be the cause of " , "?"},
      {"Which of the following are commonly associated with ", "?"},
      {"Which of the following might be used to treat ", "?"},
      {"Which of the following is most likely to be treated with ", "?"}
  };

  /** current question data: */

  Entity[] incorrect;  // incorrect options
  String infoText;     // info bout the question
  String[] infoIncor;  // info about the incorrect options
  String infoCorrect;  // info about the correct option
  
  /** create a question, with new root, new correct, and store it in q. */
  void newQuestion(int mode) {
    q=new Question();
    // the root entity is the one that appears in the question.
    if(randomroot)  { // select root randomly if user wants
      boolean ok=false;
      while(!ok) {      
        q.root=ed.getRandomEntity();
        // ensure that is descends from a standard root node. 
        // This could be removed for more general questions.
        ok=!restrRoot | Entities.hasAStandardUltimateParent(q.root); 
      }
    }
    else  q.root=seed;
    seed=q.root;   // hold the last root?
    q.mode=mode;   // set the questioning mode of this question
    
    int d1,d2; // direction forward and backwards
    // construct the question text from the root entity
    int attempt=0, numposs=0;
    do {
      q.direction = (int)Math.floor(Math.random()*DIRECTIONS.length); // choose a random direction
      d1=DIRECTIONS[q.direction]; d2=Entity.inverseOf(d1);        // and calculate its inverse
      q.head = questionHead[q.direction][0] +  q.root  + questionHead[q.direction][1]; 
      numposs=q.root.listOf(d1).size();
    }while (numposs==0 && attempt++<10); if(attempt>=10) throw new IllegalStateException("Unable to find any questions for "+q.root);
    
    
    // selet a random entity in the direction d1, as the correct answer.
    Stem corrStem = new Stem();
    q.correctStem.add(corrStem);
    corrStem.correct=true;
    Entity correct = (Entity)q.root.listOf(d1).get( (int)Math.floor(Math.random() * numposs) );
    corrStem.entity=correct;
    Entity correctTypeT = Entities.getUltimateParents(correct); // the type of the correct answer
    Vector corrD2=correct.listOf(d2); corrD2.remove(q.root);
    // generate some stock text for relations. 
    String rel1= d1==Entity.CAUSE?"Causes": d1==Entity.EFFECT ? "Effects" : d1==Entity.TREATMENTS?"Treatments":d1==Entity.TREATS?"Uses":"ERROR", 
        rel2=d1==Entity.CAUSE?"can cause":d1==Entity.EFFECT?"can be caused by":d1==Entity.TREATMENTS?"can treat":"can be treated by",
        rel3= d1==Entity.CAUSE?"Effects":d1==Entity.EFFECT?"Causes":d1==Entity.TREATMENTS?"Uses":"Treatments";
    corrStem.reasoning = rel1 +" of "+q.root+" include "+Entities.listToText(q.root.listOf(d1))+". \n";
    if(corrD2.size()>0) corrStem.reasoning+= correct +" also "+ rel2 + " " + Entities.listToText(corrD2)+".";
    if(INCLUDE_DESCRIPTION) corrStem.reasoning+='\n'+q.root.description;

    incorrect=new Entity[N];      // create array of incorrect responses
    infoIncor = new String[N];
    for(int i=0;i<N;i++) {        // generate the incorrects
      Stem s=newIncorrect(incorrect, q.root, correct, q.direction, q.mode);
      q.errorStems.add(s);
      incorrect[i]=s.entity;
    }
    infoText="Incorrect answers are all "+infoText;
  }
  /**
   *  choose a single new incorrect item that isn't in Exclude. 
   *  dirn is the direction to move from the root entity in order to find alternatives.
   *  mode is an index of the MODE_NAMES above 
   */
  Stem newIncorrect(Entity[] exclude, Entity root, Entity correct, int dirn, int mode ) {
    int attempt=0; boolean isOK=false;
    Stem s=null;
    while(attempt++<100 && !isOK) { //stop if >100 iterations or found an ok item
      s=newIncorrect(root, correct, dirn, mode); isOK=true;
      for(int i=0;i<exclude.length;i++) {
        if(s.entity==exclude[i]) isOK=false;
      }
    }
    if(!isOK) throw new TryAgain();
    return s;
  }
  /** choose a single new incorrect stem */ 
  Stem newIncorrect(Entity root, Entity correct, int dirn, int mode) {
    Stem stem=new Stem();
    stem.correct=false;
    int d1=DIRECTIONS[dirn], d2=Entity.inverseOf(d1);

    String rel1= d1==Entity.CAUSE?"Causes":"Effects", rel2=d1==Entity.CAUSE?"can cause":"can be caused by",
           rel3= d1==Entity.CAUSE?"Effects":"Causes", rel4=d1==Entity.CAUSE?"can be caused by":"can cause";

    if(mode==MODE_RANDOM_TYPED || mode==MODE_RANDOM_RELATED || mode==MODE_COMPLETELY_RANDOM) {
      
      /**
       * Choose random items, filter by criteria:
       *  * parent equals correct items' parent (or grandparents equivalent)
       *  * not related by the same relation as the correct answer, to the root item.
       */
      if(correct.parents.size()==0) throw new TryAgain();
      Entity correctType1=(Entity)correct.parents.get(0), correctType2=null;
      if(correctType1.parents.size()>0 && Math.random()>0.5 ) correctType2=(Entity)correctType1.parents.get(0);
      Entity correctType0=(Entity)Entities.getUltimateParents(correct);
      Entity tmp; int attempt=0; boolean sametype=false;
      do {
        tmp  = ed.getRandomEntity();
        //sametype = Entities.getUltimateParents(tmp) == correctTypeT;
        if(mode==MODE_RANDOM_RELATED) {
          if(tmp.parents.size()==0) sametype=false;
          else { 
            Entity tmpp=(Entity)tmp.parents.get(0);
            sametype = tmpp==correctType1   ;// || tmpp==correctType2; 
            // if(!sametype && tmpp.parents.size()>0) sametype=tmpp.parents.get(0)==correctType1 || tmpp.parents.get(0)==correctType2;
          }
          stem.reasoning = tmp+" is related to "+correct+" by being a type of "+correctType1;
        }else if(mode==MODE_RANDOM_TYPED) {
          sametype = Entities.getUltimateParents(tmp)==correctType0;
          stem.reasoning = tmp+" is a "+correctType0; // random subtype
        }else if(mode==MODE_COMPLETELY_RANDOM) {
          sametype=true;
          stem.reasoning = ""; // completely random!
        }
      } while ( ( !sametype  // ensure of same generic type
                    || Entities.isRelatedTo(root, tmp, d2 | Entity.PARENT | Entity.CHILD, 3, null) // ensure unrelated in the 'correct' direction
                    || correct==tmp // ensure not the correct item (!) (should be subsumed by the prev check) 
                  ) && attempt++<5000 ); 
      if(attempt>=5000) throw new IllegalStateException("Unable to find an unrelated ("+d1+") item to "+root+", of type "+correctType1);
      infoText="randomly related";
      stem.entity = tmp; 
      if(stem.entity.listOf(d1).size()>0) stem.reasoning+=" It "+rel4+" "+Entities.listToText(stem.entity.listOf(d1))+".";
      if(stem.entity.listOf(d2).size()>0) stem.reasoning+=" It "+rel2+" "+Entities.listToText(stem.entity.listOf(d2))+".";
    }else if(mode == MODE_SOUNDS_SIMILAR) { // choose unrelated items that sound similar 
      int NS=7;
      Collection es = ed.getAllEntities();
      double score[]=new double[es.size()], 
           hiscore[]=new double[NS];
      Entity[] hient =new Entity[NS];
      int idx=0;
      for(int i=0;i<NS;i++) hiscore[i]=Double.MIN_VALUE;    // clear hi-scores
      for(Iterator i=es.iterator(); i.hasNext(); idx++) {
        Entity ei=(Entity)i.next(); // for each entity,
        // exclude if semantically close to the correct answer,
        if(ei==correct || Entities.isRelatedTo(ei, correct, Entity.PARENT | Entity.CHILD | d1, 2, null)) continue;
        
        score[idx] = compareStrings( ei.name, correct.name );
        if(score[idx]>hiscore[0]) { // if it scores higher than any of the hi-choices,
          int inspos=0;             
          while(inspos<NS-1 && score[idx]>hiscore[inspos+1]) inspos++; // find the appropriate position,
          for(int j=0; j<inspos;j++) { // shift the lower elements down one place,
            hiscore[j] = hiscore[j+1]; hient[j]=hient[j+1];
          }
          hiscore[inspos]=score[idx]; hient[inspos]=ei; // and insert it in the ascending list
        }  
        infoText="Lexically similar to "+correct;
      }
      for(int i=0;i<NS;i++) { 
        //incorrect[i] = hient[i];
        //infoIncor[i] = hient[i]+" looks similar to "+correct;
      }
      for(int i=0;i<5;i++)if(hiscore[i]<0.5) throw new TryAgain(); // disallow low similarity entities.
      currentBank = new Vector(Arrays.asList( hient ));
      int i=(int)(NS*Math.random());
      stem.entity=hient[i];
      stem.reasoning= hient[i]+" could be confused with "+correct+"."; // +hiscore[i]; 
      if(stem.entity.listOf(d1).size()>0) stem.reasoning+=" It "+rel4+" "+Entities.listToText(stem.entity.listOf(d1))+".";
      if(stem.entity.listOf(d2).size()>0) stem.reasoning+=" It "+rel2+" "+Entities.listToText(stem.entity.listOf(d2))+".";
    }else if(mode==MODE_BROTHER_OF_CORRECT) {
      /**
       * Incorrect answers are brothers of the correct answer, that do not
       * have the specified relation with the root element.
       */
      if(correct.parents.size()==0) throw new TryAgain();
      Entity p =(Entity)correct.parents.get(0);
      Vector s=new Vector(Entities.getExtensiveListOf(Entity.CHILD, p, 10));
      filterOutRelations(s, root, d2 | Entity.CHILD, 3);
      s.remove(correct);
      infoText="Brothers of "+correct;
      if(s.size()<N) {
         if(p.parents.size()>0) p=(Entity)p.parents.get(0);
         s.addAll(Entities.getExtensiveListOf(Entity.CHILD, p, 10));
         filterOutRelations(s, root, d2 | Entity.CHILD , 3);
         s.remove(correct);
         if(s.size()<N) throw new TryAgain(); // not enough brothers...
         infoText="Cousins of "+correct;
      }
      //Vector r=choose(s,N);
      //for(int i=0;i<N;i++) { incorrect[i] = (Entity)r.get(i); infoIncor[i]=r.get(i)+" is a type of "+p; }
      currentBank=s;
      int i=(int)(s.size()*Math.random());
      stem.entity=(Entity)s.get(i);
      stem.reasoning=stem.entity+" is a type of "+p+"."; 
      if(stem.entity.listOf(d1).size()>0) stem.reasoning+=" It "+rel4+" "+Entities.listToText(stem.entity.listOf(d1))+".";
      if(stem.entity.listOf(d2).size()>0) stem.reasoning+=" It "+rel2+" "+Entities.listToText(stem.entity.listOf(d2))+".";
    }else if(mode==MODE_BROTHER_OF_ROOT) {
      /**
       * Incorrects are related to a brother of the root in the same way as the
       * answer is related to the root.
       */
      if(root.parents.size()==0) throw new TryAgain();
      Entity p=(Entity)root.parents.get(0);
      Set exclude = new HashSet(); exclude.add(root); // exclude the root from the children set
      Set brothrs = Entities.getExtensiveListOf(Entity.CHILD, p, 2, exclude); // these are the eligible brothers
      Set rels = new HashSet(); // use this to collate the items related in the same way as the correct answer
      for(Iterator i=brothrs.iterator(); i.hasNext();) {
        Entity b=(Entity)i.next();
        exclude = new HashSet(); exclude.add(root); // exclude the root from the children set
        rels.addAll(Entities.getExtensiveListOf(d1, b, 1, exclude));
      }
      rels.removeAll(brothrs);// eliminate degree zero!
      Vector v=new Vector(rels); // eliminate items that actually do relate.
      filterOutRelations(v, root, d2 /* | Entity.CHILD */, 3);
      /*
      v=choose(v,N);
      infoText=Entities.getRelationNamesFromBits(d1)+"s of the brothers (& nephews) of "+root;
      for(int i=0;i<N;i++) {
        incorrect[i]=(Entity)v.get(i);
        Vector ch=Entities.findRelationChains(p, incorrect[i], Entity.CHILD | d1, 4, null, null, null, 0);
        if(ch.size()==0) throw new IllegalStateException("Could not find chain for brother of root: "+p+"'s children's "+Entities.getRelationNamesFromBits(d1)+ " don't include "+incorrect[i]);
        int shortest=0, shortlen=100, tmp;for(int j=0;j<ch.size();j++) if((tmp=((Vector)ch.get(j)).size())<shortlen) {shortest=j; shortlen=tmp;} // find shortest chain 
        Vector inf=(Vector)ch.get(shortest); Collections.reverse(inf);
        infoIncor[i]=Entities.chainText(inf);
      }
      */
      if(v.size()==0)throw new TryAgain();
      currentBank=v;
      int i=(int)(v.size()*Math.random());
      stem.entity=(Entity)v.get(i);
      // create the causal chain
      Vector ch=Entities.findRelationChains(p, stem.entity, Entity.CHILD | d1, 4, null, null, null, 0);
      if(ch.size()==0) throw new IllegalStateException("Could not find chain for brother of root: "+p+"'s children's "+Entities.getRelationNamesFromBits(d1)+ " don't include "+stem.entity);
      int shortest=0, shortlen=100, tmp;for(int j=0;j<ch.size();j++) if((tmp=((Vector)ch.get(j)).size())<shortlen) {shortest=j; shortlen=tmp;} // find shortest chain 
      Vector inf=(Vector)ch.get(shortest); Collections.reverse(inf);
      try {
        stem.reasoning = Entities.chainText(inf);
      }catch(IllegalArgumentException x) {x.printStackTrace();}
      if(stem.entity.listOf(d1).size()>0) stem.reasoning+=" It "+rel4+" "+Entities.listToText(stem.entity.listOf(d1))+".";
      if(stem.entity.listOf(d2).size()>0) stem.reasoning+=" It "+rel2+" "+Entities.listToText(stem.entity.listOf(d2))+".";
    }
    if(INCLUDE_DESCRIPTION) stem.reasoning+='\n'+stem.entity.description;
    return stem;
  }
  /** set of entities that could be used as incorrect answers */
  Vector currentBank=new Vector();
  
  /** is any of the items in a[0 to N-1] equal to e? */
  boolean anyarrayequal(Entity[] a, int N, Entity e) { boolean f=false; 
    for(int i=0;i<N;i++) if (a[i]==e) f=true;
    return f;
  }
  /** randomly choose n items from c into a vector */ 
  Vector choose(Collection s, int n) {
    int ns = s.size(); Vector result= new Vector();
    if(ns<n) throw new IllegalStateException("Cannot choose "+n+" items from a set "+s+" of "+ns);
    Vector<Integer> r=new Vector<Integer>(); 
	for(int i=0;i<ns;i++){r.add(new Integer(i));} // fill r with integers up to the set size
    Collections.shuffle(r);  // shuffle, then select the first N from the shuffled list  
    Iterator it=s.iterator(); int un=0; // number stored so far?
    for(int i=0;i<ns;i++) { // go through each possible item
      Object o=it.next();
      for(int j=0;j<n;j++) if(((Integer)r.get(j)).intValue() == i ) 
        {result.add(o); un++;} // and if it was chosen (in r), add it.
      if(un>=n) break; // complete?
    }
    return result;  
  }
  /** remove any items from v which are related to 'relative' by relations 'relations'
   * to a depth 'depth'
   */
  void filterOutRelations(Vector v, Entity relative, int relations, int depth) {
    Vector rm=new Vector();
    for(int i=0;i<v.size();i++) {
      if(Entities.isRelatedTo((Entity)v.get(i), relative, relations, depth, null)) 
        rm.add(v.get(i));
    }
    v.removeAll(rm);
  }
  
  /** @return lexical similarity value in the range [0,1] */
  public static double compareStrings(String str1, String str2) {
      ArrayList pairs1 = wordLetterPairs(str1.toUpperCase());
      ArrayList pairs2 = wordLetterPairs(str2.toUpperCase());
      int intersection = 0;
      int union = pairs1.size() + pairs2.size();
      for (int i=0; i<pairs1.size(); i++) {
          Object pair1=pairs1.get(i);
          for(int j=0; j<pairs2.size(); j++) {
              Object pair2=pairs2.get(j);
              if (pair1.equals(pair2)) {
                  intersection++;
                  pairs2.remove(j);
                  break;
              }
          }
      }
      return (2.0*intersection)/union;
  }
  /** @return an ArrayList of 2-character Strings. */
  private static ArrayList wordLetterPairs(String str) {
      ArrayList allPairs = new ArrayList();
      // Tokenize the string and put the tokens/words into an array
      String[] words = str.split("\\s");
      // For each word
      for (int w=0; w < words.length; w++) {
          // Find the pairs of characters
          String[] pairsInWord = letterPairs(words[w]);
          for (int p=0; p < pairsInWord.length; p++) {
              allPairs.add(pairsInWord[p]);
          }
      }
      return allPairs;
  }
  /** @return an array of adjacent letter pairs contained in the input string */
  private static String[] letterPairs(String str) {
      int numPairs = str.length()-1;
      if(numPairs<1) return new String[0];
      String[] pairs = new String[numPairs];
      for (int i=0; i<numPairs; i++) {
          pairs[i] = str.substring(i,i+2);
      }
      return pairs;
  }

  static class TryAgain extends RuntimeException{};
  
  Question q;
  /**
   * Call newQuestion() then 
   * Create a question structure from the current logic
   */
  Question getNewQuestion(int mode) {
    /** create 4 wrong and 1 right options */
    newQuestion(mode);
    return q;
  }
  
  /**
   * generate a single new Stem according to the current logic and current 
   * question's root, correct, direction and mode.
   */
  Stem generateNewStem() {
    return newIncorrect(incorrect, q.root, q.correctStem.get(0).entity, q.direction, q.mode);
  }
  void setQuestion(Question qu) {
    qu=qu;
    
  }
  public void setStem(Stem stem, Entity newItem){
    // Auto-generate stem contents from an entity 
    stem.entity=newItem;
    stem.reasoning = Essay.getText(newItem);
  }
  
}














public class Entity implements Serializable{

	static int serial=0;
	public static final int PARENT=1, CHILD=2, CAUSE=4, EFFECT=8, TREATS=16,
            TREATMENTS=32;
	public static int relationList[]= new int[]{CAUSE, EFFECT, PARENT, CHILD, TREATS, TREATMENTS};
        public static String[] relationNameList =
            {"Causes", "Effects", "Supertypes", "Subtypes", "Treats", "Treatments"};


        
  double[] probs[];
	public Entity(Entity from, int connection) {
		children=new Vector();
		parents=new Vector();
		causes=new Vector();
		effects=new Vector();
                treats=new Vector();
                treatments=new Vector();

		if(from!=null){
			connect(from, connection);
		}

		synonyms=new Vector();
		name="Entity"+serial++;
		description="";
  	}

	/**
		eg. listOf(PARENT) returns parent.
	*/
	public Vector listOf(int relation){
		switch(relation){
                  case PARENT: return parents;
                  case CHILD:  return children;
                  case CAUSE:  return causes;
                  case EFFECT: return effects;
                  case TREATS: return treats;
                  case TREATMENTS: return treatments;
		}
		return null;
	}
	/**
	 * List the probabilities of the entities related to this entity.
	 * return null if not set. 
	 */
	public double[] probsOf(int relation){
	  if(probs==null) return null;
	  for(int i=0;i<relationList.length;i++){ 
	    if((relationList[i]&relation)>0){
	      double[] v=probs[i];
	      if(v==null)continue;
	      if(v.length!=listOf(relation).size()){
	        ensureConnectionProbs(relation);
	      }
	      return v;
	    }
	  } return null;
	}
	private static int probidxOfRel(int rel){
    for(int i=0;i<relationList.length;i++){ 
      if((relationList[i]&rel)>0){
        return i;
      }
    }throw new IllegalArgumentException(rel+" is not a relation.");
	}
	/** return the name of the first relation in the bitwise flags 'rel' */
	public static String nameOfRelation(int rel){
	  return relationNameList[probidxOfRel(rel)];
	}
	/** return the bitwise flags for a given relation string. return 0  if not a valid string. */
	public static int getRelationForName(String s){
	  for(int i=0;i<relationNameList.length;i++){
	    if(relationNameList[i].toLowerCase().equals(s.toLowerCase())) return relationList[i];
	  }
	  return 0;
	}
	private void removeProb(int rel, int idx){
	  if(probs!=null){
	    double[] op=probs[probidxOfRel(rel)];
	    if(op!=null){
	      double[] np=new double[op.length-1];
	      System.arraycopy(op, 0, np, 0, idx);
	      System.arraycopy(op, idx+1, np, idx, op.length-idx-1);
	      probs[probidxOfRel(rel)] = np;
 	    }
	  }
	}
	public void moveListItem(int rel, int idx1, int idx2){
	  Object o=listOf(rel).get(idx1);
	  if(idx1==idx2)return;
	  int dest=idx2;
	  if (idx1 < idx2) {
      dest--;
    }
	  listOf(rel).remove(idx1); 
		Vector<Object> v= listOf(rel);
	  v.insertElementAt(o, dest);
	  double p[]=probsOf(rel);
	  if(p!=null){
	    double tmp=p[idx1]; 
	    if(idx2>idx1) for(int i=idx1; i<dest; i++) p[i]=p[i+1];
	    else          for(int i=idx1; i>dest; i--) p[i]=p[i-1];
	    p[dest]=tmp;
	  }
	}
	/** remove a probability list if all NaN */
	public void checkIfProbsClear(){
	  if(probs!=null){
	    for(int i=0;i<probs.length;i++){
	      if(probs[i]==null) continue;
	      boolean empty=true;
	      for(int j=0;j<probs[i].length;j++){
	        if(!Double.isNaN(probs[i][j])) empty=false;
	      }
	      if(empty) probs[i]=null;
	    }
	  }
	}
	/**
	 * Set the probabilities of the entities related to this entity.
	 * the probabilities x must have name size as number of related items.
	 */
	public void setProbOf(int relation, int idx, double x){
	  if(probs==null) probs=new double[relationList.length] [];
    for(int i=0;i<relationList.length;i++){ 
      if((relationList[i]&relation)>0){
        if(probs[i]==null){
          int nrel=listOf(relation).size();
          probs[i]=new double[nrel];
          for(int j=0;j<nrel;j++) probs[i][j]=Double.NaN;
        }else if(probs[i].length<=idx){
          int nrel=listOf(relation).size();
          double[] npr=new double[nrel];
          for(int j=0;j<probs[i].length;j++) npr[j]=probs[i][j];
          for(int j=probs[i].length; j<nrel; j++) npr[j]=Double.NaN;
          probs[i]=npr;
        }
        probs[i][idx]=x;
      }
    }
	}
	
	public static int inverseOf(int reciprocalRelation){
		switch(reciprocalRelation){
                  case PARENT: return CHILD;
                  case CHILD:  return PARENT;
                  case CAUSE:  return EFFECT;
                  case EFFECT: return CAUSE;
                  case TREATS: return TREATMENTS;
                  case TREATMENTS: return TREATS;
		}
		return 0;
	}
	/**
	 e.g. A.connect(B, PARENT) means
	 A.parents.add(B);  B.children.add(A)
	*/
	public void connect(Entity to, int connectAs){
		Vector mylist=listOf(connectAs);
		if(mylist.indexOf(to)>=0)return;	//already connected!
		listOf(connectAs).add(to);
		ensureConnectionProbs(connectAs);
		to.listOf(inverseOf(connectAs)).add(this);
		to.ensureConnectionProbs(inverseOf(connectAs));
	}
	/** expand the probabilities list to the correct size after adding a connection*/
	public void ensureConnectionProbs(int rel){
	  boolean error=false;
	   if(probs!=null){
	     int r=probidxOfRel(rel);
	     if(probs[r]!=null){
	       int n=listOf(rel).size(); // length of entities
	       int nn = probs[r].length; // length of probs list
	       if(nn==n) return; // OK
	       double[] np=new double[n];
	       if( n < nn) { // there are too many probs!
	         nn=n; // remove some probs
	         error=true;
	       }
	       System.arraycopy(probs[r], 0, np, 0, nn);
	       for(int j=probs[r].length; j<np.length;j++)
	         np[j]=Double.NaN;  
	       probs[r]=np;
	    }
	  }
	   if (error) {
	     throw new IllegalStateException("The list "+this+"."+relationNameList[rel]+" has too many probabilities. I am truncating the list, possible losing data.");
	   }

	}
	public void disconnect(Entity from, int relation){
		//check that this is not the only connection!
		if(numConnections()<2){System.out.println("Cannot delete last connection");return;}
		if(listOf(relation).contains(from)){
		  int idx=listOf(relation).indexOf(from);
		  listOf(relation).remove(from);
		  removeProb(relation, idx);
		  int idx2=from.listOf(inverseOf(relation)).indexOf(this);
		  from.listOf(inverseOf(relation)).remove(this);
		  from.removeProb(inverseOf(relation),idx2 );
		}
	}
	public String toString(){return name;}

	

		//SERIALISED MEMBERS

	public Vector children, parents, causes, effects,
		synonyms;
	public String name;
	public String description;
        public Vector treats, treatments;
        public Vector pChildren, pCauses, pEffects; // the probabilities


	/**
	 * Check if equal to name or any of the synonyms
	 */
	public boolean equals(String s){
		if(name.equals(s))return true;
		for(int i=0;i<synonyms.size();i++){
			if(s.equals((String)synonyms.get(i)))return true;
		}
		return false;
	}
	public boolean equalsIgnoreCase(String s){
		if(name.equalsIgnoreCase(s))return true;
		for(int i=0;i<synonyms.size();i++){
			if(s.equalsIgnoreCase((String)synonyms.get(i)))return true;
		}
		return false;
	}
	public boolean contains(String s){
		if(name.indexOf(s)>=0) return true;
		for(int i=0;i<synonyms.size();i++){
			if(((String)synonyms.get(i)).indexOf(s)>=0)return true;
		}
		return false;
	}
	public boolean containsIgnoreCase(String s){
		if(indexOfIgnoreCase(name,s)>=0)return true;
		for(int i=0;i<synonyms.size();i++){
			if(indexOfIgnoreCase( (String)synonyms.get(i), s )>=0) return true;
		}
		return false;
	}

	int indexOfIgnoreCase(String main, String sub){
		for(int k=0;k<=main.length()-sub.length();k++){
			if(main.substring(k, k + sub.length()).equalsIgnoreCase(sub))
				return k;
		}
		return -1;
	}


	/**
	 * Is the object blank -- i.e. does it have connections other than its
	 * original one?
	 */
	public boolean isBlank(){
		return synonyms.isEmpty() && numConnections()<2 && description.equals("") ;
	}



	/**
	 * Replaces any uses of the current entry with the replacement entry,
	 * leaving this entry disconnected & henceforth discardable
	 */
	public void replaceAllWith(Entity replacement){
		for(int i=0;i<relationList.length;i++){
			int rel=relationList[i];
			Vector v=listOf(rel);
			for(int j=0;j<v.size();j++){
				Entity dest=(Entity)v.get(j);
				replacement.connect(dest, rel);
				dest.disconnect(this, inverseOf(rel));
			}
		}
	}

	/**
	 * Count total number of links this object has with other objects
	 */
	int numConnections(){
		int n=causes.size()+effects.size()+parents.size()+children.size();
                n+=treatments.size() + treats.size();
                return n;
	}



}












public class EntityData {
  private Hashtable namesToEntities=new Hashtable();
  public EntityData() {
  }
  /** Collection of entities backed by the hashtable of names */
  public Collection getAllEntities(){
    return namesToEntities.values();
  }
  
  public long saveTime;
  public long lastRead;
  
  /** Create new entity with given name and no connections */
  public Entity addNewEntity(String name){
    Entity e=new Entity(null,0);
    e.name=name;
    Object o=namesToEntities.put(name,e);
    if(o!=null) throw new IllegalStateException("Two entites with key "+name);
    return e;
  }

  public Entity addNewEntity(Entity from, int relation){
    Entity e=new Entity(from, relation);
    Object o=namesToEntities.put(e.name,e);
    if(o!=null) throw new IllegalStateException("Two entites with key "+e.name);
    return e;    
  }
  
  public void removeEntity(Entity r){
    namesToEntities.remove(r.name);
  }
  public void removeAllOf(Collection e){
    for(Iterator i=e.iterator();i.hasNext();){
      removeEntity((Entity)i.next());
    }
  }
  
  /** update the name hash table */
  void refreshNames(){
    Collection es=namesToEntities.values();
    Hashtable nht=new Hashtable();
    for(Iterator i=es.iterator();i.hasNext();){
      Entity e=(Entity)i.next();
      nht.put(e.name, e) ;
    }
    namesToEntities=nht;
  }
  
  /** Check that all entities are found in the data */
  public void checkIntegrity() throws DataIntegrityException{
    Collection c=namesToEntities.values();
    for(Iterator it=c.iterator();it.hasNext();){
      Entity e=(Entity)it.next();
      for(int i=1;i<Entity.relationList.length;i++){
        Vector v=e.listOf(Entity.relationList[i]);
        for(Iterator it2=v.iterator();it2.hasNext();){
          Entity e2=(Entity)it2.next();
          if(!c.contains(e2)){
            throw new DataIntegrityException(e2.name + " not found in data.");
          }
        }
      }
    }
  }

  
  public int size(){return namesToEntities.size();}
  public Entity findEntityExact(String name){
    return (Entity)namesToEntities.get(name);
  }
  public Vector findEntities(String text,boolean contains, boolean csensitive){
    Vector res = new Vector();
    for(Enumeration k=namesToEntities.elements();k.hasMoreElements();){
      Entity c=(Entity)k.nextElement();
      String s=c.name;
      String textlc=text.toLowerCase();
      if(contains){
        if(csensitive){
          if (s.indexOf(text)>=0) {res.addElement(namesToEntities.get(s));continue;}
        }else{
          if (s.toLowerCase().indexOf(textlc) >= 0) {
            res.addElement(namesToEntities.get(s));
            continue;
          }
        }
        for(int i=0;i<c.synonyms.size();i++){
          String syn=(String)c.synonyms.elementAt(i);
          if(csensitive){
            if (syn.indexOf(text)>=0) {res.addElement(namesToEntities.get(s));break;}
          }else{
            if (syn.toLowerCase().indexOf(textlc) >= 0) {
              res.addElement(namesToEntities.get(s));
              break;
            }
          }
        }
      }else{
        if(csensitive){
          if (s.equals(text)) res.addElement(namesToEntities.get(s));
        }else{
          if (s.equalsIgnoreCase(text)) res.addElement(namesToEntities.get(s));
        }
      }
    }
    return res;
  }
  
  /** @deprecated never crawl entities: the stack trace gets too deep. */
  @Deprecated public Entity getFirstEntity() {
    return (Entity)namesToEntities.values().iterator().next();
  }
  /**
   * this is a silly method that returns an entity by its serial index.
   * This serial index changes all the time, so don't use it except to generate
   * a random entity.
   * It is also slow, as it iterates through N entities!
   */
  private Entity getItemAtIndex(int n){
    int index=0;
    for(Iterator i=namesToEntities.values().iterator(); i.hasNext();index++) {
      Object o=i.next();
      if(index==n) return (Entity)o;
    }
    throw new ArrayIndexOutOfBoundsException("can't get entity at index "+n);
  }
  public Entity getRandomEntity(){
    return getItemAtIndex((int)Math.floor(Math.random() * getAllEntities().size()));
  }
  /**
   * Parse an edit string 
   * return: true if an edit was made
   * dispatches to the relevant implementEdit... functions
   */
  public boolean implementEdit(String editString) throws MedicineEditException{
    String[] s=editString.split("\t"); // split on tabs
    int i=0; 
    while(s[i].length()==0) i++;
    String cmd=s[i].toLowerCase().trim();
    int rel=Entity.getRelationForName(s[2].trim());
    Entity e1=findEntityExact(s[1].trim()), e2=findEntityExact(s[3].trim());
    // dispatch to implementEdit functions
    if(cmd.equals("remove")){
      if(s[2].equalsIgnoreCase("Synonyms")){ // remove synonym
        if(e1==null) throw new MedicineEditException("no entity for synonym in "+editString);
        return implementEditRemoveSynonym(e1, s[3]);
      }else{ // remove an entity link
        if(e1==null || rel==0 || e2==null) throw new MedicineEditException("no such link in "+editString);
        return implementEditDelete(e1, rel,e2);
      }
    }else if(cmd.equals("add")){
      if(s[2].equalsIgnoreCase("Synonym")){ // add a synonym
        if(e1==null) throw new MedicineEditException("no entity for synonym in "+editString);
        return implementEditAddSynonym(e1, s[3]);
      }else{ // add an entity (new or old)
        if(e1==null || rel==0) throw new MedicineEditException("invalid new link in "+editString);
        if(e2==null)     e2=addNewEntity(s[3]); // none existing - create.
        return implementEditAdd(e1, rel, e2);
      }
    }else if(cmd.equals("edit")){ // only used for description
      if(s[2].equalsIgnoreCase("Name") ){
        String newname = s[3].trim();
        if(e1==null || newname.length()==0) throw new MedicineEditException("invalid name edit: "+editString);
        return implementEditName(e1, s[3]);
      }else if(s[2].equalsIgnoreCase("Description")){
        String desc=s[3]; // perform any transformations here, e.g. remove HTML / quotes
        if(e1==null) throw new MedicineEditException("no entity for description in "+editString);
        return implementEditDescription(e1, desc);
      }else throw new MedicineEditException("unknown edit: "+s[2]+" in "+editString);
    }else if(cmd.equals("updatepercent")){
      if(e1==null || rel==0 || e2==null) throw new MedicineEditException("invalid link for percentage in "+editString);
      double percent;
      try{
        percent = Double.parseDouble(s[4]);
      }catch(NumberFormatException e){ throw new MedicineEditException("Not a valid percentage: "+s[4]+" in "+editString); }
      return implementEditUpdatePercent(e1, Entity.getRelationForName(s[2]), e2, percent);
    }else if(cmd.equals("comment")){
      return true; // do nothing.
    }else throw new MedicineEditException("unknown command: "+cmd+" in "+editString);
  }
  /**
   *  create a string representing an edit. 
   *  Starts with a command, then tab-separated arguments.
   *  e.g.   remove  Disease  Child  Infection
   *         add     Disease  Child  Infection
   *         edit    Disease  Name   Diseases    (relation can be Name or Description)
   *         updatepercent    Disease        Child   Infection  0.5
   *         comment Disease  not sure about this one
   */  
  public static String createEditString(String command, Entity entity, String relation, String item,
      String value   ) throws MedicineEditException {
    String cmd = command.toLowerCase(), string; 
    if(cmd.equals("remove")){ // e.g.   remove  Disease  Child  Infection
      string=cmd+"\t"+entity.name+"\t"+relation+"\t"+item;
    }else if(cmd.equals("add")){  // e.g.   add  Disease  Child  Infection
      string=cmd+"\t"+entity.name+"\t"+relation+"\t"+item;
    }else if(cmd.equals("edit")){  // e.g.  edit  Disease  Name  Diseases
      // "relation" can be "Name" or "Description"
      string=cmd+"\t"+entity.name+"\t"+relation+"\t"+item;
    }else if(cmd.equals("updatepercent")){  // e.g.  updatepercent   Disease  Child  Infection  0.5
      string=cmd+"\t"+entity.name+"\t"+relation+"\t"+item+"\t"+value;
    }else if(cmd.equals("comment")){ // e.g.   comment  Disease   not sure about this one
      string=cmd+"\t"+value;
    }else{
      throw new MedicineEditException("unknown command: "+cmd);
    }
    return string;
  }
  //// actuall DO EDITS here: (protected)
  boolean implementEditRemoveSynonym(Entity e, String syn){
    if(e.synonyms.contains(syn)){
      e.synonyms.removeElement(syn);
      return true;
    }else return false;
  }
  boolean implementEditAddSynonym(Entity e, String syn){
    return true;
  }
  boolean implementEditDelete(Entity e, int rel, Entity item){
    if(e.listOf(rel).contains(item)){
      e.disconnect(item,rel);
      return true;
    } else return false;
  }
  boolean implementEditAdd(Entity e, int rel, Entity item){
    e.connect(item, rel); return true;
  }
  boolean implementEditName(Entity e, String n) throws MedicineEditException{
    String legalchars="ABCDEFGHIJKLMNOPQRTSUVWXYZabcdefghijklmnopqrtsuvwxyz' -";
    for(int i=0;i<n.length();i++) 
      if(legalchars.indexOf(n.charAt(i))<0) throw new MedicineEditException("Illegal character "+n.charAt(i)+" in new name for "+e+", "+n);
    namesToEntities.remove(e.name); // remove from hash table
    e.name = n;
    namesToEntities.put(e.name, e); // put new name in hash table
    return true;
  }
  boolean implementEditDescription(Entity e, String d){
    e.description=d; return true;
  }
  boolean implementEditUpdatePercent(Entity e, int rel, Entity item, double p){
    int ix = e.listOf(rel).indexOf(item); // index of item
    if(ix>=0)    {
      e.setProbOf(rel, ix, p);
      return true;
    } else return false;
  }
  
  public static class MedicineEditException extends Exception{
    public MedicineEditException(String c){super(c);}
  }
}





public class DataIntegrityException extends IllegalStateException{
  public DataIntegrityException(String s){super(s);}
}
















/**
 * General utilities for use with tht class Entity
 */

public class Entities {

	public Entities() {
	}


	EntityData entityData;

  public static final String[] standardStrings = {
    "Disease","Pathology","Investigation","Sign",
    "Symptom","Substance","Treatment","Lifestyle"
  };
  /** bits representing which ultimate parent */
  public static int E_DISEASE=1, E_PATHOLOGY=2, E_INVESTIGATION=4, E_SIGN=8,
    E_SYMPTOM=16, E_SUBSTANCE=32, E_TREATMENT=64, E_LIFESTYLE=128;
  
  public static boolean isStandardUltimateParent(Entity e) {
    if(e==null) return false;
    for(int i=0;i<standardStrings.length;i++)
      if(e.name.equals(standardStrings[i])) return true;
    return false;
  }
  public static  boolean hasAStandardUltimateParent(Entity e) {
    Set l=getExtensiveListOf(Entity.PARENT, e, 15);
    for(Iterator i=l.iterator();i.hasNext();)if( isStandardUltimateParent((Entity)i.next()) ) return true;
    return false;
  }
  
  /** modify the vector to contain only entities which have a standard ultimate parent */
  public void filterVectorForStandardParents(Vector v) {
    Vector rm=new Vector();
    for(int i=0;i<v.size();i++) if( isStandardUltimateParent( getUltimateParents((Entity)v.get(i))) ) rm.add(v.get(i));
    v.removeAll(rm);
  }
  
  /** 
   * modify the vector to contain only entities which have the specified ultimate parent 
   * (specify a combination of the bits E_DISEASE E_PATHOLOGY etc)  
   */
  public static void filterVectorForStandardParents(Vector v, int ultimateParent ) {
    Vector rm=new Vector();
    for(int i=0;i<v.size();i++) {
      Entity e=(Entity)v.get(i), ultP = getUltimateParents(e);
      boolean ok=false;
      if(ultP!=null) {
        for(int b=0;b<8;b++) { // for each bit in ultimateParent,
          if( (ultimateParent & (1<<b))>0 && ultP.name.equals(standardStrings[b]) ) ok=true;
        }
      }
      if(!ok) rm.add(v.get(i));
    }
    v.removeAll(rm);
  }
  

	public void setData(EntityData e){
	  Vector toremove=new Vector();
	  for(Iterator i=e.getAllEntities().iterator();i.hasNext();){
	    Entity en=(Entity)i.next();
	    int nconn=0;
	    for(int j=0;j<Entity.relationList.length;j++){
	      Vector v=en.listOf(Entity.relationList[j]);
	      nconn+=v.size();
	    }
	    if(nconn==0){ //remove items which are disconnected
	      toremove.add(en);
	    }
	    int nsyn=en.synonyms.size();
	    for(int j=0;j<nsyn;j++) {
	      for(int k=j+1;k<nsyn;k++) {
	        if(en.synonyms.get(j).equals(en.synonyms.get(k))) {
	          en.synonyms.set(k, ""); // remove duplicated synonyms
	        }
	      }
	    }
	    for(int j=0;j<en.synonyms.size();j++)if(en.synonyms.get(j).equals("")) {
	      en.synonyms.remove(j--);
	    }
	  }
	  e.removeAllOf(toremove);
    entityData=e;
	}
	public EntityData getData(){return entityData;}

	public void writeTextForm(OutputStream os){
		PrintStream out=new PrintStream(os);
		synchronized (this){
			for(Iterator i=entityData.getAllEntities().iterator();i.hasNext();){
				Entity ent=(Entity)i.next();
				writeTextForm(out,ent);
			}
			writeTimeToStream(out, new Date().getTime());
		}
	}

	private void writeTimeToStream(PrintStream pw, long time){
    pw.println("_SAVED_TIME "+time);
  }
  /**
		format of output:


		Pulmonary fibrosis{
			Synonyms { Lung fibrosis, Fibrosis of lung }
			Children { Apical lung fibrosis, Basal lung fibrosis }
			Description {"Scarring and fibrous change of the
		pulmonary interstitium"}
			Parents { Lung pathology }
		}
		Aortic stenosis{
			...
		}

	*/

	void writeTextForm(PrintStream out, Entity e){
		out.println(e.name+" {");

		if(e.synonyms.size()>0)
			out.println("\tSynonyms {" + getDelimitedNames(e.synonyms,", ") + "}");
		if(e.causes.size()>0)
			out.println("\tCauses {" + getDelimitedEntities(e, Entity.CAUSE,", ") + "}");
		if(e.effects.size()>0)
			out.println("\tEffects {" + getDelimitedEntities(e, Entity.EFFECT,", ") + "}");
		if(e.parents.size()>0)
			out.println("\tParents {" + getDelimitedEntities(e, Entity.PARENT,", ") + "}");
		if(e.children.size()>0)
		  out.println("\tChildren {" + getDelimitedEntities(e, Entity.CHILD,", ") + "}");
		if(e.treats.size()>0)
		  out.println("\tTreats {" + getDelimitedEntities(e, Entity.TREATS, ", ") + "}");
		if(e.treatments.size()>0)
		  out.println("\tTreatments {" + getDelimitedEntities(e, Entity.TREATMENTS,", ") + "}");
		
		if(!e.description.equals(""))
		  out.println("\tDescription {\"" + e.description.replace('{','(')
                                    .replace('}',')') + "\"}");

		out.println("}");
	}



        public static EntityData readTextForm(InputStream is) throws IOException{
          // BufferedReader br=new BufferedReader(fr);
          InputStreamReader fr = null;
          EntityData data=null;
          try {
            fr = new InputStreamReader(is);
            data = new EntityData();
            while (true) {
              readEntity(data, fr);
            }
          }          catch (EOF e) {   /** End of file encountered */    }
            if (fr != null) { fr.close(); }
            if(data==null)return null;
            if(data.size()==0)return null;
            validateConnections(data);
            return data;
         }

         /** Merge two input streams in text format 
          * @deprecated - use the single-stream version to merge with a dataset*/
         @Deprecated public static Entity mergeTextFromStreams(InputStream is, InputStream is2) throws IOException{
           InputStreamReader fr = null;
           EntityData data = null;
           try {
             fr = new InputStreamReader(is);
             data = new EntityData();
             while (true) {
               readEntity(data, fr);
             }
           } catch (EOF e) { /** End of file encountered */}
           if (fr != null) {fr.close(); fr=null; }
           if (data == null) data=new EntityData();
           try {
             fr = new InputStreamReader(is2);
             while (true) {
               readEntity(data, fr);
             }
           } catch (EOF e) { /** End of file encountered */}
           if (fr != null) { fr.close(); }
           if (data == null)return null;
           if (data.size()==0)return null;
           return data.getFirstEntity();
       }
         
         public static EntityData mergeTextFromStream(EntityData d, InputStream is)
         throws IOException{
           Reader fr=null;
           try {
             fr = new InputStreamReader(is);
             while (true) {
               readEntity(d, fr);
             }
           } catch (EOF e) { /** End of file encountered */}
           if (fr != null) { fr.close(); }
           validateConnections(d);
           return d;
         }

        /**
         * readEntity - reads an entity form the stream into the EntityData.
         *
         * @param data EntityData
         * @param fr FileReader
         */
        private static void readEntity(EntityData data, Reader r) throws IOException, EOF{
          StringBuffer nameb=new StringBuffer();
          int ch;
          while((ch=r.read())!='{' && ch!=-1) nameb.append((char)ch);
          if(ch==-1)throw new EOF();
          String name=nameb.toString().trim();
          if(nameb.equals("_SAVED_TIME")) { data.saveTime=readTimeFromStream(r); return; }
          Entity e=data.findEntityExact(name);
          if(e==null){
            e= data.addNewEntity(name);
          }
          try{
            while (true) readSection(e,data,r);
          }catch(EOE ex){}
        }
        private static long readTimeFromStream(Reader r) throws IOException, EOF{
          int ch; StringBuffer d=new StringBuffer();
          while (!Character.isWhitespace((char)(ch=r.read())))  d.append(ch);
          if(ch==-1) throw new EOF();
          return Long.parseLong(d.toString());
        }
        /**
         * readSection -reads a list of causes, effects, synonyms etc. from an entity
         *
         * @param e Entity
         * @param data EntityData
         */
        private static void readSection(Entity e, EntityData data, Reader r) throws EOE, IOException{
          StringBuffer nameb=new StringBuffer();
          int ch;
          while((ch=r.read())!='{' && ch!='}' && ch!=-1) nameb.append((char)ch);
          if(ch=='}')throw new EOE();
          if(ch==-1)throw new EOF();
          String name=nameb.toString().trim();
          if(name.equals("Causes"))readListTillCloseBracket(e,Entity.CAUSE,data,r,true);
          if(name.equals("Effects"))readListTillCloseBracket(e,Entity.EFFECT,data,r,true);
          if(name.equals("Parents"))readListTillCloseBracket(e,Entity.PARENT,data,r,true);
          if(name.equals("Children"))readListTillCloseBracket(e,Entity.CHILD,data,r,true);
          if(name.equals("Synonyms"))readStringListTillCloseBracket(e.synonyms,data,r);
          if(name.equals("Treats"))readListTillCloseBracket(e,Entity.TREATS, data,r,true);
          if(name.equals("Treatments"))readListTillCloseBracket(e,Entity.TREATMENTS, data,r,true);
          if(name.equals("Description")){
            StringBuffer desc=new StringBuffer();
            while((ch=r.read())!='}' && ch!=-1) desc.append((char)ch);
            if(ch==-1)throw new EOF();
            String d=desc.toString().trim();
            if(d.startsWith("\""))d=d.substring(1,d.length()-1);
            mergeDescriptions(e,d);
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
        static final boolean ENSURE_VALIIDTY_AT_EXPENSE_OF_ORDER=false;
        
        /**
         * Scans a stream 'r' until the next }
         * Takes a list of comma-delimited values, and stores them as elements
         * in v, converting them into entities if instructed.
         */
        private static void readListTillCloseBracket(Entity from,int relation, EntityData data,Reader r, boolean convertToEntity) throws IOException, EOF{
          StringBuffer s=new StringBuffer();
          int ch;
          while((ch=r.read())!='}'){
            if(ch==-1)throw new EOF();
            if(ch==','){
              storeEntity(from, s, relation, data,convertToEntity);
            }else {
              if (ch == '`') ch = ',';
              s.append( (char) ch);
            }
          }storeEntity(from, s,relation,data,convertToEntity);
        }
        /** scan the stream for comma delimited strings, into vector v. */
        private static void readStringListTillCloseBracket(Vector v, EntityData d, Reader r)
        throws IOException, EOF{
          StringBuffer s=new StringBuffer();
          int ch;
          while((ch=r.read())!='}'){
            if(ch==-1)throw new EOF();
            if(ch==','){
              if(!v.contains(s.toString())) {v.addElement(s.toString().trim());}
              s.setLength(0);
            }else {
              if (ch == '`') ch = ',';
              s.append( (char) ch);
            }
          }
          if(!v.contains(s.toString())) { v.addElement(s.toString().trim()); }
          s.setLength(0);

        }
        /**
         * Called when an item 's' in a list has been read. This adds the item to
         * vector v, converting to entities if instructed.
         */
        private static void storeEntity(Entity from, StringBuffer s,int relation,EntityData d,boolean convertToEntity)
        throws IOException{
          String n = s.toString().trim();
          Vector v=from.listOf(relation);
          if(convertToEntity){
            // Parse probabililty
            double p=Double.NaN;
            if(n.endsWith("%")){
              int i=n.length()-2;
              while(!Character.isWhitespace(n.charAt(i))) i=i-1;
              try{
                p=Double.parseDouble(n.substring(i+1,n.length()-1));
              }catch(NumberFormatException e){ throw new IOException(
                  "Illegal percentage in "+from.name+": "+n); 
              }
              n=n.substring(0,i);
            }
            // Already exists?
            Entity e = d.findEntityExact(n);
            if(e==null){
              e=d.addNewEntity(n);
              v.addElement(e);
              if(ENSURE_VALIIDTY_AT_EXPENSE_OF_ORDER)e.listOf(Entity.inverseOf(relation)).addElement(from);
            }else{
              if(!v.contains(e)) {
                v.addElement(e);
                if(ENSURE_VALIIDTY_AT_EXPENSE_OF_ORDER)e.listOf(Entity.inverseOf(relation)).addElement(from);
              }
            }
            // Set probability if specified
            if(!Double.isNaN(p)){ 
              from.setProbOf(relation, v.indexOf(e), p);
            }

            s.setLength(0);
          }else{
            if(!v.contains(s.toString())) { v.addElement(s.toString().trim()); }
            s.setLength(0);
          }
        }
        static class EOF extends IllegalStateException{}
        static class EOE extends IllegalStateException{}

        private static void mergeDescriptions(Entity e, String d){
          if(e.description.equals(d))return;
          if(e.description.startsWith(d)) return;
          if(d.startsWith(e.description)) {e.description=d;return;}
          else e.description += '\n'+d;
        }


        /** Convert a Vector to a string as a delimited list - for serialisation! */
	public static  String getDelimitedNames(Vector v,String delimiter){
		StringBuffer list = new StringBuffer();
		for(int i = 0; i < v.size(); i++){
			Object o = v.get(i);
                        String s=o.toString();
                        //Replace {} with (), replace " with '
                        s=s.replace('{','(').replace('}',')').replace(',','`');
			list.append( s.toString() );
			if(i < v.size()-1) list.append( delimiter );
		}
		return list.toString();
	}
	/** Get the list for a particular direction - for serialisation */
	public static String getDelimitedEntities(Entity e, int relation, String delimiter){
	  StringBuffer list = new StringBuffer();
	  Vector v=e.listOf(relation);
	  double[]p = e.probsOf(relation);
	  for(int i = 0; i < v.size(); i++){
	    Object o = v.get(i);
	    String s=o.toString();
	    //Replace {} with (), replace " with '
	    s=s.replace('{','(').replace('}',')').replace(',','`');
	    list.append( s.toString() );
      if(p!=null && p.length>i && !Double.isNaN(p[i])){
        list.append(' '); list.append(p[i]); list.append('%');
      }
	    if(i < v.size()-1) list.append( delimiter );
	  }
	  return list.toString();
	}

/*
        Entity readTextForm(InputStream p,Entity startFrom) throws IOException{
          StreamTokenizer st=new StreamTokenizer(new InputStreamReader(p));
          st.quoteChar('"');
          st.eolIsSignificant(false);
          String name=readUntil(st,"{");
          getSpecificNamedEntity(name,startFrom);
          return null;//incomplete
        }
*/
        /**
         * read from st until the string c is returnec as a token. this is not
         * included in the resuld.
         */
	
	
	
	
	
	/*
        String readUntil(StreamTokenizer st,String c) throws IOException{
        StringBuffer s=new StringBuffer();
        int tt;
        do{
          tt=st.nextToken();
          if(tt==st.TT_WORD)
          s.append(st.sval);
        }while(!st.sval.equals(c));
        return s.toString().trim();
      }
 */
	
	
	
	
	
	
        /**
         *  Blocking call that checks each entity in the set
         * and ensures that every connection has a reciprocal.
         * If not, one is created.
         * Returns the number of extra connections created.
         */
        public static int validateConnections(EntityData d) {
          int errors=0;
          for(Iterator i=d.getAllEntities().iterator();i.hasNext();) {
            Entity e=(Entity)i.next();
            for(int j=1;j<Entity.relationList.length;j++) {
              int r=Entity.relationList[j];
              int ri=Entity.inverseOf(r);
              for(Iterator k=e.listOf(r).iterator();k.hasNext();) {
                Entity f=(Entity)k.next();
                if(!f.listOf(ri).contains(e)) {
                  f.listOf(ri).add(e);
                  errors++;
                }
              }
            }
          }
          return errors;
        }
	/**
	 *  Lists all causes of an entity
	 *  Use: Vector v=getAllCauses(currentEntity, null);
	*/
	public static Vector getAllCauses(Entity entity, Vector except){
		if(except!=null && except.contains(entity))return null;
		if(except==null)except=new Vector();
		Vector v=new Vector();
		except.add(entity);
		for(int i=0;i<entity.causes.size();i++){
			Entity e=(Entity)entity.causes.get(i);
			if(except==null || !except.contains(e)){
				Vector ve=Entities.getAllCauses(e,v);
				if(ve!=null){
					if(ve.size()>0)v.addAll(ve);
					else ve.add(e);
				}
			}
		}
		return v;
	}
	public static String getRelationNamesFromBits(int b) {
	  String s="";
	  for(int i=0;i<Entity.relationList.length;i++) {
	    if( (b & Entity.relationList[i]) > 0) s+=Entity.relationNameList[i];
	  }
	  if(s.endsWith("s")) s=s.substring(0,s.length()-1);
	  return s.toLowerCase();
	}
	
	public static Set getExtensiveListOf(int relations, Entity entity, int depth){ return getExtensiveListOf(relations, entity, depth, null);}
	public static Set getExtensiveListOf(int relations, Entity entity, int depth, Set except){
	  Set v=except;
	  if(depth<0) return v;
	  if(v==null)v=new HashSet();
	  if(v.contains(entity)) return v;
	  v.add(entity);
	  for(int i=0;i<Entity.relationList.length;i++){
	    if((relations & Entity.relationList[i])>0){
	      Vector ve=entity.listOf(Entity.relationList[i]);
	      if(ve!=null) for(int j=0;j<ve.size();j++){
	        Entity e=(Entity)ve.get(j);
	        Set vf=Entities.getExtensiveListOf(relations, e, depth-1, v);
	        v.addAll(vf);
	      }
	    }
	  }
	  return v;
	}
	
  /**
   * As above but don't go backwards - e.g. after going up to a parent, 
   * you can go sideways but not back down again.
   * Don't include direct parents and children.
   */
	public static Set getDirectionalListOf(int relations, Entity entity, int depth){ 
	  Set s=getDirectionalListOf(relations, entity, depth, null); // recursively get all directionally linked items
	  HashSet<Entity> rm=new HashSet<Entity>(); // now filter out any direct parents or children
	  for(Entity e:(Set<Entity>)s){
	    if(Entities.isChildOf(e, entity) || Entities.isChildOf(entity, e) || entity==e){
	      rm.add(e);
	    }
	  }
	  s.removeAll(rm);
	  return s;
	}
	/** This implements recursive getDirectionalListOf */
	 public static Set getDirectionalListOf(int relations, Entity entity, int depth, Set except){
	    Set v=except;
	    if(depth<0) return v;
	    boolean first=v==null;
	    if(first) v=new HashSet();
	    if(v.contains(entity)) return v;
	    v.add(entity);
	    for(int i=0;i<Entity.relationList.length;i++){
	      if((relations & Entity.relationList[i])>0){
	        Vector ve=entity.listOf(Entity.relationList[i]);
	        if(ve!=null) for(int j=0;j<ve.size();j++){
	          Entity e=(Entity)ve.get(j);
   	        // now unset the bit corresponding to the opposeite to the direction we've just traversed
	          int newrelations = relations & ~ Entity.inverseOf( Entity.relationList[i] ); 
	          Set vf=Entities.getDirectionalListOf(newrelations, e, depth-1, v);
	          v.addAll(vf);
	        }
	      }
	    }
	    return v;
	  }
	public static Vector getCauseHierarchy(Entity entity, Vector complete){
		if(complete!=null && complete.contains(entity))return null;
		if(complete==null)complete=new Vector();
		Vector v=new Vector();
		complete.add(entity);
		for(int i=0;i<entity.causes.size();i++){
			Entity e= (Entity)entity.causes.get(i);
			if(complete==null || !complete.contains(e)){
				Vector add=Entities.getCauseHierarchy(e, complete);
				if(add!=null)v.add(add);
			}
		}
		return v;
	}
	public static int numConnections(Entity e){
		return e.causes.size()+e.effects.size()+e.parents.size()+e.children.size();
	}


	/**
	 * Recursively find whether the given queryItem is a child of 'parent'.
	 */
	public static boolean isChildOf(Entity queryItem, Entity parent){
		/*
	  Vector p = queryItem.parents;
		if(p.indexOf(parent) >= 0) return true;
		for(int i=0;i<p.size();i++){
			Entity nquery = (Entity)p.get(i);
			if( isChildOfRecursive(nquery, parent, new Vector()) ) return true;
		}
		return false;
		*/ 
	  // now delegate to recursive method which prevents cycling 
	  return isChildOfRecursive(queryItem, parent, new Vector()) ; 
	}
  public static boolean isChildOfRecursive(Entity queryItem, Entity parent, Vector avoid){
    if(avoid.contains(queryItem)) return false; 
    avoid.add(queryItem);
    Vector p = queryItem.parents;
    if(p.indexOf(parent) >= 0) return true;
    for(int i=0;i<p.size();i++){
      Entity nquery = (Entity)p.get(i);
      if( isChildOfRecursive(nquery, parent, avoid) ) return true;
    }
    return false;
  }
	
	
	public EntityData data;
	/**
	 * Get an entity by name. This call is slow and blocking.
	 * @param any a node to start searching from.
	 */
	public static Entity getSpecificNamedEntity(String name, EntityData data) 
	throws EntityNotFoundException{
	  Vector v = data.findEntities(name, false, true);
	  if(v.size()==1) return (Entity)v.get(1);
	  else throw new EntityNotFoundException("Can't find entity "+name);
	}
	
	/**
	 * Traverse the parents, using only the first element in the list of
	 * parents on each level; and return the topmost entity
	 */
	public static Entity getUltimateParents(Entity e){
	  if(e.parents.size()==0)return null;
	  Entity p=(Entity)e.parents.elementAt(0);
	  while(p.parents.size()>0){
	    p=(Entity)p.parents.elementAt(0);
	  }
	  return p;
	}
	/**
	 * traverse along a particular direction, getting the top item on each list 
	 * in that direction.
	 */
  public static Vector<Entity> getChainOfFirstItem(Entity e, int direction){
    Vector<Entity> v=new Vector<Entity>();
    v.add(e);
    while(!e.listOf(direction).isEmpty()){
      v.add(e=(Entity) e.listOf(direction).get(0)); // add to list and travel onwards!
    }
    return v;
  }

  /**


        /**
         * Find whether the 'putativeRelative' is a 'relation' of 'queryEntity'.
         * If 'traverseParents' is true, and 'relation' is CAUSE or EFFECT, then
         * this will return true if 'putativeRelative' is a 'relation' of any
         * parent of any 'relation' of 'queryEntity'.
         */
        /*
        public static boolean isRelativeOf(Entity queryEntity, Entity putativeRelative,
             int relation, boolean traverseParents, boolean traverseChildren,
             int maxRecursionDepth){
          if(maxRecursionDepth<=0)return false;
          if(queryEntity==putativeRelative) return true;
          Vector v=queryEntity.listOf(relation);
          for(int i=0;i<v.size();i++){
            if(v.get(i)==putativeRelative) return true; //is it directly related?
          }
          for(int i=0;i<v.size();i++){
            Entity e=(Entity)v.get(i); //is it related to any of the relations?
            if(isRelativeOf(e, putativeRelative, relation,traverseParents,
                            traverseChildren,maxRecursionDepth-1)) return true;
          }
          if(relation==Entity.CAUSE || relation==Entity.EFFECT) {
            if(traverseParents){ //is it related to any of the parents?
              for (int i = 0; i < queryEntity.parents.size(); i++) {
                Entity t = (Entity) queryEntity.parents.get(i);
                if (isRelativeOf(t, putativeRelative, relation, traverseParents,
                                 traverseChildren,maxRecursionDepth-1))return true;
              }
            }
            if(traverseChildren){ //is it related to any of the children?
              for (int i = 0; i < queryEntity.children.size(); i++) {
                Entity t = (Entity) queryEntity.children.get(i);
                if (isRelativeOf(t, putativeRelative, relation, traverseParents,
                                 traverseChildren,maxRecursionDepth-1))return true;
              }
            }
          }
          return false;
        }
*/

        /**
         * Blocking call that determines whether an entity is related to a query
         * entity.
         * @param from Entity to start from - the entity to be queried
         * @param to Entity to end at - the putative relative
         * @param relations An integer representing which relations to follow, as a
         * binary 'OR' of Entity.CAUSE, Entity.EFFECT etc.
         * @param maxRecursionDepth maximum number of items in causal chain,
         * including parents
         * @param excludeItems List of items to exclude in the search. This is
         * used in recursion to cumulate entities already visited. Can be null.
         * @return whether or not the entity 'putativeRelative' can be reached
         * from queryEntity by traversing the specified relations. If specified
         * relations = 0, then this call returns false unless qureyEntity ==
         * putativeRelative.
         */
        public static boolean isRelatedTo(Entity from, Entity to,
              int relations, int maxRecursionDepth, Vector excludeItems){
          if(excludeItems==null) excludeItems=new Vector();
          if(excludeItems.contains(from)) return false;
          if(maxRecursionDepth<=0)return false;
          if(from==to) {  return true;}
          //Vector v=queryEntity.listOf(relation);
           for(int i=0;i<Entity.relationList.length;i++){
             if((relations & Entity.relationList[i]) > 0){
               Vector v=from.listOf(Entity.relationList[i]);
               for(int j=0;j<v.size();j++){
                 Entity e=(Entity)v.get(j);
                 if(e==to) return true; //is it directly related?
                 Vector newExcludeItems=new Vector(excludeItems);
                 newExcludeItems.add(from); //don't go back to this element
                 if(isRelatedTo(e, to, relations, maxRecursionDepth-1,
                   newExcludeItems) ) return true;
               }
             }
           }
           return false;
         }

         /**
          * Blocking call that determines the list of ways in which an entity
          * is related to a query entity.
          * @param from Entity to start from - the entity to be queried
          * @param to Entity to end at - the putative relative
          * @param relations An integer representing which relations to follow, as a
          * binary 'OR' of Entity.CAUSE, Entity.EFFECT etc.
          * @param maxRecursionDepth maximum number of items in causal chain,
          * including parents
          * @param excludeItems List of items to exclude in the search. This is
          * used in recursion to cumulate entities already visited. Can be null.
          * @param temporarilyAvoidDirections - a set of relations in which not
          * to travel on the next step. This is used to avoid back-traversal on
          * successive iterations.
          * @return The vector of vectors, each of which is a list of entities
          * traversed in order to go from 'from' to 'to'. Each item in the return
          * value is a vector which begins with 'from' and ends with 'to', containing
          * the relevant intermediate entities. If no routes are found, an empty
          * vector is returned.
          */

         public static Vector findRelationChains(Entity from, Entity to, int relations,
                                          int maxRecursionDepth, Vector excludeItems,
                                          Vector currentSolutions, Vector currentChain,
                                          int temporarilyAvoidDirections){
           if (excludeItems == null) excludeItems = new Vector();
           if (currentChain == null) currentChain = new Vector();
           if (currentSolutions == null) currentSolutions = new Vector();
           if (excludeItems.contains(from))return currentSolutions;
           if (maxRecursionDepth <= 0)return currentSolutions;
           currentChain = (Vector)currentChain.clone();
           currentChain.add(from);
           if (from == to) { //found a complete chain!
             currentSolutions.add(currentChain);
             return currentSolutions; //add to the list of correct solutions
           }
           for(int i=0;i<Entity.relationList.length;i++){
             int currentRelation = Entity.relationList[i];
             if((currentRelation & temporarilyAvoidDirections) > 0) continue;
             if ( (relations & currentRelation) > 0) {
               Vector v = from.listOf(currentRelation);
               for (int j = 0; j < v.size(); j++) {
                 Entity e = (Entity) v.get(j);
                 Vector newExcludeItems = new Vector(excludeItems);
                 //don't go back to this element
                 newExcludeItems.add(from);
                 findRelationChains(e, to, relations, maxRecursionDepth - 1,
                                 newExcludeItems, currentSolutions, currentChain,
                                 Entity.inverseOf(currentRelation));
                 //discard return value as currentSolutions always points to the
                 //same vector.
               }
             }
           }
           return currentSolutions;
         }
         public static Vector findRelationChainsSorted(Entity from, Entity to, int relations,
             int maxRecursionDepth, Vector excludeItems,
             Vector currentSolutions, Vector currentChain,
             int temporarilyAvoidDirections){
           Vector solutions = findRelationChains(from, to, relations, maxRecursionDepth,
               excludeItems, currentSolutions, currentChain, temporarilyAvoidDirections);
           // sort the chains by length - shorter chains are better!
           Comparator sorter = new Comparator(){public int compare(Object o1, Object o2){
             return ((Vector)o1).size() - ((Vector)o2).size(); 
           }};
           Collections.sort(solutions, sorter);
           return solutions;
         }

         public static  String toLowerCase(Entity e) {
           String n=e.name;
           boolean startword=true;
           for(int j=0;j<n.length();j++) {
             // if starting a word with a capital, and next char is lower case,
             if(startword && (j<n.length()-1) && Character.isUpperCase( n.charAt(j) ) 
                 && Character.isLowerCase( n.charAt(j+1) )){ 
               // then decapitalise this letter.
               n=n.substring(0,j)+Character.toLowerCase( n.charAt(j) )+n.substring(j+1);
             }
             startword=Character.isWhitespace( n.charAt(j) ); // next char is beginning of a word?
           }
           return n;
         }
         /** Convert a vector of connectivity  into a text */
         public static String chainText(Vector ch) {
           Entity fr = (Entity)ch.get(0);
           String out=fr.name;
           for(int i=1;i<ch.size();i++) {
             Entity to=(Entity)ch.get(i);
             boolean found = false; // have we found the path from the 'fr' item to 'to'?
             for(int j=0;j<Entity.relationList.length;j++) {
               if( fr.listOf(Entity.relationList[j]).contains( to ) ) {
                 String tmp;
                 if(i==1) tmp=" is a "; else tmp=", which is a ";
                 if(Entity.inverseOf(Entity.relationList[j])!=Entity.CHILD)
                   out+=tmp+Entities.getRelationNamesFromBits( Entity.inverseOf(Entity.relationList[j]) )+" of "+to.name.toLowerCase();
                 else
                   out+=tmp+" "+to.name.toLowerCase();
                 found=true;
                 break;
               }
             }
             if(!found) throw new IllegalArgumentException("Ill-formed chain, "+ch);
             fr=to;
           }
           return out+".";
         }
         /** Convert a Vector to a colloquial text list 
          * (lower case with commas and 'and') */
         public static String listToText(Vector v) {
           StringBuffer sb=new StringBuffer();
           for(int i=0;i<v.size();i++) {
             Entity e=((Entity)v.get(i));
             String n=Entities.toLowerCase(e);
             sb.append(n);
             if(i==v.size()-2) sb.append(" and ");
             else if(i<v.size()-2) sb.append(", ");
           }
           if(sb.length()>0) return sb.toString();
           else return null;
         }
         
         

         
  public static class AmbiguityException extends RuntimeException{
		public AmbiguityException(String s){	super(s);	}
		public AmbiguityException(){ }
	}
/**
 * Group a list according to their standard ultimate parents.
 * Returns a hashtable of sublists of entities.
 */
  public static Hashtable<String,Object>  groupedVectors(Collection<Entity> c, int i) {
    Hashtable<String, Object> r = new Hashtable<String, Object>();
    for(Entity e:c){
      Entity pe = getUltimateParents(e); // parent entity?
      String pn;
      if(pe!=null){
        pn = pe.name; // find parent name
      }else{ // no parent? list separately
        pn = "Other";
      }
      Vector<Entity> v = (Vector<Entity>)r.get(pn); // is there a list already for this parent?
      if(v==null){ // create one if not
        v=new Vector<Entity>();
        r.put(pn,v); // and keep it in our table
      }
      v.add(e); // put item in the appropriate list
    }
    Hashtable modresult=(Hashtable) r.clone();
    for(String k:r.keySet()){
      Vector<Entity> l=(Vector<Entity>) r.get(k);
      if(l.size()>MAX_LIST_SIZE) {
        modresult.put(k,regroup(l));
      }
    }
    return modresult;
  }
  static int MAX_LIST_SIZE = 5;
  static Hashtable regroup(Vector<Entity> v){
    int highestlevel=0;
    int maxgrp = v.size();
    //  for each item, create hierarchy of parents    
    Vector<Vector<Entity>> hier=new Vector(); 
    for(Entity e:v){
      Vector h = getChainOfFirstItem(e, Entity.PARENT);
      Collections.reverse(h);
      hier.add(h);
    }
    Vector<Entity> uniques=null;
    Vector<Vector<Entity>> grpitems=null ;
    while(maxgrp>MAX_LIST_SIZE && highestlevel<4){
      highestlevel++; // try out different levels of hierarchical organisation,
      // starting with the most general (highest level)
      uniques=new Vector();
      Vector<Integer> grpsize = new Vector();
      grpitems = new Vector();
      for(Vector<Entity> h:hier){  // get the hierarchy for each entity
        Entity top=h.get(Math.max(0,Math.min(highestlevel, h.size()-2))); // find the grouping at the current level
        if(!uniques.contains(top)) {  // create a new heading if not there
          uniques.add(top);
          Vector le=new Vector(); // list of entities 
          grpitems.add(le);
          le.add(h.lastElement()); // add the entity 
          grpsize.add(1);
        }else{ // otherwise increment count of entities under that heading
          int ix=uniques.indexOf(top);
          grpitems.get(ix).add(h.lastElement());
          grpsize.set(ix, grpsize.get(ix)+1); 
        }
      }
      maxgrp = 0; // find the maximum group size, if we group at this level
      for(int i:grpsize) if(maxgrp<i){ maxgrp=i; }
    } // we have found a highestlevel that ensures all 
    // group sizes are <= MAX_LIST_SIZE.
    Hashtable<String,Object> result = new Hashtable();
    // can be String->Vector<Entity> or String->Entity
    if(uniques==null){return null;} // the current grouping is the best! could be due to no parents, or
    int MIN_SIZE=2;
    for(Entity u:uniques){
      Vector<Entity> vi = grpitems.get(uniques.indexOf(u));
      if(vi.size()>=MIN_SIZE)
        result.put(u.name, vi);
      else{
        for(Entity ei:vi) result.put(ei.name, ei);
      }
    }
    return result;
  }
  
}














public class EntityNotFoundException extends Exception{
  EntityNotFoundException(String s){super(s);}
}
















public class Question implements Serializable{
  Vector<Stem> getCorrectStems(){
    return correctStem;
  }
  Vector<Stem> getIncorrectStems(){
    return errorStems;
  }
  Vector<Stem> correctStem=new Vector<Stem>();
  Vector<Stem> errorStems=new Vector<Stem>();
  /** The direction which the mode uses - Enitity.DIRECTIONS */
  int direction;
  /** the root entity that appears in the question head */
  Entity root;
  /** the actual text of the head */
  String head;
  /** the mode of questioning used to generate this question, from Logic.MODE_XXX */
  int mode;
  /** the difficulty category of the question */
  int difficulty;
  /** possible difficulty levels */
  static final int DIF1=1, DIF2=2, DIF3=3, DIF4=4;
  /** status of question */
  int status;
  /** possible status values */
  static final int STAT_OK=3, STAT_CHECK=2, STAT_UNCHECKED=1;
  
  Properties toProps(){
    Properties p=new Properties();
    for(int i=0;i<correctStem.size();i++) {
      p.setProperty("Correct"+i, correctStem.get(i).entity.toString());
      p.setProperty("CorrectReasoning"+i, correctStem.get(i).reasoning);
    }
    for(int i=0;i<errorStems.size();i++) {
      p.setProperty("Incorrect"+i, errorStems.get(i).entity.toString());
      p.setProperty("IncorrectReasoning"+i, errorStems.get(i).reasoning);
    }
    p.setProperty("Head", head);
    p.setProperty("Root", root.toString());
    p.setProperty("Direction", String.valueOf(direction));
    p.setProperty("Mode", String.valueOf(mode));
    p.setProperty("Difficulty", String.valueOf(difficulty));
    return p;
  }
  void fromProps(Properties p, EntityData ed){
    int i=0; Object o; 
    do {
      o=p.getProperty("Correct"+i);
      if(o!=null) {
        Stem s=new Stem();
        s.correct=true;
        s.entity=ed.findEntityExact((String)o);
        if(s.entity==null)
          s.entity=new FakeEntity((String)o); // sometimes the stems are non-entities!
        s.reasoning=p.getProperty("CorrectReasoning"+i);
        correctStem.add(s);
      }
      i++;
    }while(o!=null);
    i=0;o=null;
    do {
      o=p.getProperty("Incorrect"+i);
      if(o!=null) {
        Stem s=new Stem();
        s.correct=false;
        s.entity=ed.findEntityExact((String)o);
        if(s.entity==null)
          s.entity=new FakeEntity((String)o); // deal with nonentities
        s.reasoning=p.getProperty("IncorrectReasoning"+i);
        errorStems.add(s);
      }
      i++;
    } while(o!=null);
    head= p.getProperty("Head");
    root= ed.findEntityExact( p.getProperty("Root") );
    direction = Integer.valueOf(p.getProperty("Direction"));
    mode = Integer.valueOf(p.getProperty("Mode"));
    difficulty = Integer.valueOf(p.getProperty("Difficulty"));
  }
	
	
	/*
	
  public static Vector<Question> readText(BufferedReader r, EntityData ed) throws IOException {
    Vector<Question> v=new Vector<Question>();
    String s=r.readLine();
    StringBuffer sb=new StringBuffer();
    while(s!=null) {
      if(s.trim().equals("{")) {
        while(s!=null && !s.trim().equals("}")) {
          s=r.readLine();
          sb.append(s+"\n");
        }
        Question q=new Question();
        Properties p= new Properties();
        p.load( new ByteArrayInputStream( sb.toString().getBytes("ISO-8859-1") ) );
        if(p.size()>0) {
          q.fromProps(p, ed);
          v.add(q);
        }
      }else {
        s=r.readLine();
      }
    }
    return v;
  }
  public static void writeText(Vector<Question> v, PrintWriter w) throws IOException {
    Vector errors=new Vector();
    for(int i=0;i<v.size();i++) {
      w.println("{");
      try {
        v.get(i).toProps().store(w, "Question "+i);
      }catch(Exception e) {
        errors.add(v.get(i));
      }finally {
        w.println("}");
      }
    }
    if(errors.size()>0) throw new IOException("Unable to write "+errors.size()+" questions.");
  }
	
	*/
		
		
  public static   class FakeEntity extends Entity{
    FakeEntity(String s){   super(null,0);   name=s;    }
  } 
}







  class Stem{
    Entity entity;
    boolean correct;
    String reasoning;
  }
  
















public class Essay {
  Entity e;
  public Essay(Entity e){
    this.e=e;
  }
  String text="";
  public String createText() {
    text = getText(e);
    return text;
  }
  
  public static String getText(Entity e){
    String text;
    text=e.name;
    if(e.synonyms.size()>0){
      text+=", also known as";
      for(int i=0;i<e.synonyms.size();i++){
        text+=" "+e.synonyms.elementAt(i).toString()+",";
      }
    }

//    Entity p = Entities.getUltimateParents(e);
//    if(p!=null) text+=" is a "+p.name.toLowerCase()+". ";
    String tmp="";
    if(e.parents.size()==1) {
      text += " is a "+((Entity)e.parents.get(0)).name.toLowerCase()+". ";
    }else {
      text += " is a " + Entities.listToText( e.parents ) + ". ";
    }
    
    
    if(e.children.size()>0) {
      if (e.children.size()==1) {
        // tmp="It is a generalisation of "+e.children.get(0)+". ";
      }else {
        tmp="Its subtypes include "+Entities.listToText(e.children);
      }
    }
    
    String causelist = Entities.listToText(e.causes);
    if(causelist!=null) text=text+"It can be caused by "+causelist+". ";

    String effectlist = Entities.listToText(e.effects);
    if(effectlist!=null) text=text+"It is known to cause "+effectlist+". ";

    String rxlist = Entities.listToText(e.treats);
    if(rxlist!=null) text=text+"It is used to treat "+rxlist+". ";
    rxlist=Entities.listToText(e.treatments);
    if(rxlist!=null) text=text+"It can be treated with "+rxlist+". ";

    
    text=text+" "+e.description;
    return text;
  }
  

}
