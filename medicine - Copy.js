var  MedicineReader = function(){
  my = {};
  var LOCAL_MODE=true;
  var server = "http://www.homphysiology.org/cgi-bin/MedicineReaderJson.py";
  var entityname = 'Disease';
  var cache = {};      // all the entities data that have been preloaded
  var namecache = [];  // names of all entities (for autocomplete).
  var parentcount = 0; // make sure not too many parents chained
  $(document).ready(function () {
    $('#show_comment_button').click(function(e){ // set up comment click handler
      e.preventDefault(); e.stopPropagation(); $('#comment_input').val('');
      $('#comment_box').show(); $('#comment_input').focus();
    });
    $.support.cors = true; // allow cross-domain requests
    if (window.location.hash) {
      var hash = window.location.hash.substring(1);
      if (hash.length > 0) entityname = decodeURIComponent(hash);
    }
    // start by displaying the first entity.
    my.navigateto(entityname);
    // in local mode, we read all the data into a cache first.
    if(LOCAL_MODE){
      if(localStorage.length>0){
        loadCacheFromLocalStorage();
      }else{
        loadLocalStorageFromServer();
      }
    };
    getAutocompleteNames(); // for autocomplete
    $('.ui-autocomplete').on('click', '.ui-menu-item', function(){
      dosearch();
    });
  });
  
  function readentity(){ // read server name "entityname" and display using populate
    $('body').css('cursor','wait');
    $.ajax({
      url: "http://www.homphysiology.org/cgi-bin/MedicineReaderJson.py"
       +"?single=true&entity="+entityname, 
      success: function(data){
          pushCache(data); // cache in case needed later
          populate(data);  // set up the main data fields
          $('body').css('cursor','auto');
      },
    error:function( xhr, status, error){
          $('body').css('cursor','auto');       
    },
    cache: false, 
    datatype: "json",
    crossDomain: true
  }); // ajax
  }
  /** 
   * This takes a JSON array for the current Entity, and fills out all the fields
   * of the display. On each list item, it calls read_and_elaborate, to get more
   * info and display asynchronously.
   */
  function populate(data){ // display json object 
    if(data==null || data==undefined || data.length<0 || !data.hasOwnProperty("Name")) 
       {alert("server error: "+data); return;}
    parentcount=0;
  if(data.hasOwnProperty("Name")){
    $('#entityname').html(data.Name);
    $('#searchtext').val(data.Name);
    document.title=data.Name+" - Sanjay's Medical Browser";
  }
  // hide and remove old data
    $('#l_children').html(""); $('#children').hide();
    $('#l_parents').html("");  $('#parents').hide();
    $('#l_causes').html("");   $('#l_causes_p').html("");
    $('#l_effects').html("");  $('#l_effects_p').html("");
    $('#l_treat').html("");    $('#treat').hide();       $('#l_treat_p').html("");
    $('#l_synonyms').html(""); $('#synonyms').hide();
    $('#description').html("");
    $('#comment_box').hide();
  if(data.hasOwnProperty("Children")){
    $.each(data.Children,function(key,value){
      var li=$("<LI></LI>").appendTo("#l_children");
      var i =$("<A href='javascript:navigateto(\""+jsEncode(value)+"\")'><h3>"+htmlEncode(value)+"</h3></A>").appendTo(li);
      read_and_elaborate(i,"Children",value);
    } );
    $('#children').show();
    } 
  if(data.hasOwnProperty("Parents")){
    $.each(data.Parents,function(key,value){
      var li=$("<LI></LI>").appendTo("#l_parents");
      var i =$("<A href='javascript:navigateto(\""+jsEncode(value)+"\")'><h3>"+htmlEncode(value)+"</h3></A>").appendTo(li);
    read_and_elaborate(i,"Parents",value);
    } );
    $('#parents').show();
    }
  if(data.hasOwnProperty("Causes")){
    $.each(data.Causes,function(key,value){
      var li=$("<LI></LI>").appendTo("#l_causes");
      var i =$("<A href='javascript:navigateto(\""+jsEncode(value)+"\")'><h3>"+htmlEncode(value)+"</h3></A>").appendTo(li);
    read_and_elaborate(i,"Causes",value);
    } );
    }
  if(data.hasOwnProperty("Effects")){
    $.each(data.Effects,function(key,value){
      var li=$("<LI></LI>").appendTo("#l_effects");
      var i =$("<A href='javascript:navigateto(\""+jsEncode(value)+"\")'><h3>"+htmlEncode(value)+"</h3></A>").appendTo(li);
    read_and_elaborate(i,"Effects",value);
    } );
    }
    if(data.hasOwnProperty("Description")){
      var d=String(data.Description);
      d=formatDescription(d);
      $('#description').html(d);  
    }
    if(data.hasOwnProperty("Synonyms")){
      $.each(data.Synonyms, function(key,value){
      $('#l_synonyms').append(
        "<LI><h3>"+value+"</h3></LI>"
      );  });
      $('#synonyms').show();
    }
    if(data.hasOwnProperty("Treatments")){
      $.each(data.Treatments, function(key,value){
      var li=$("<LI></LI>").appendTo("#l_treat");
      var i =$("<A href='javascript:navigateto(\""+jsEncode(value)+"\")'><h3>"+htmlEncode(value)+"</h3></A>").appendTo(li);
        read_and_elaborate(i,"Treatments",value);
      });
      $('#treat_type').html("Treatments");
      $('#treat').show();
    }else if(data.hasOwnProperty("Treats")){
      $.each(data.Treats, function(key,value){
      var li=$("<LI></LI>").appendTo("#l_treat");
      var i =$("<A href='javascript:navigateto(\""+jsEncode(value)+"\")'><h3>"+htmlEncode(value)+"</h3></A>").appendTo(li);
        read_and_elaborate(i,"Treats",value);
      });
      $('#treat_type').html("Treats");
      $('#treat').show();
    }

    // add wikipedia and google
    $('#wikipedia').html("<a href='http://en.wikipedia.org/wiki/"
                         +escape(entityname)+"' target='_blank'> Wikipedia </A>");
    $('#google').html("<a href='http://www.google.co.uk/search?q="
                      +escape(entityname)+"' target='_blank'> Google </A>");
    $('#emedicine').html("<a href='http://search.medscape.com/reference-search?newSearchHeader=1&queryText="
                      +escape(entityname)+"' target='_blank'> Medscape </A>");
    $('#uptodate').html("<a href='http://www.uptodate.com/contents/search?search="
                      +escape(entityname)+"' target='_blank'> UpToDate </A>");
    $('#pubmed').html("<a href='http://www.ncbi.nlm.nih.gov/pubmed/?term="
                      +escape(entityname)+"' target='_blank'> PubMed </A>");
    $('#fpnotebook').html("<a href='http://www.fpnotebook.com/asp3/search2.aspx?qu="
                      +escape(entityname)+"' target='_blank'> FPNotebook </A>");
    var jsonQueryURL = 'http://www.homphysiology.org/cgi-bin/MedicineEntityNameJsonQuery.py';
    //$('.autocomplete').autocomplete({source:jsonQueryURL});
  }
  my.navigateto = function(entity){ //called by clicks
    History.pushState({id:entity}, entity,'?'); // previously '?', then , '#'+encodeURIComponent(entity));
    // the following 3 lines were commented previously
    //entityname=entity; 
    //if(cache.hasOwnProperty(entity)) populate(cache[entity]); //used cached if poss
    //else readentity(); // otherwise load from server
  }
  // was bind(window, 'statechange', function).
  History.Adapter.bind(window, 'statechange',function(state){ // Popstate function - call populate.
    var State = History.getState(); // Note: We are using History.getState() instead of event.state
    // State.data, State.title, State.url
    entityname=State.title;
    if(cache.hasOwnProperty(entityname)) populate(cache[entityname]); //used cached if poss
    else readentity(); // otherwise load from    
  });
  function dosearch(){ // called when search form action performed
    entityname=$('#searchtext').val();
    my.navigateto(entityname);
  }
  function read_and_elaborate(litem, dir, ename){ // query and elaborate on a list item 
    if(cache.hasOwnProperty(ename)) elaborate(litem,dir,cache[ename]);
    else // not cached: read from server then elaborate
    $.get("http://www.homphysiology.org/cgi-bin/MedicineReaderJson.py"
       +"?single=true&entity="+ename, 
        function(data,status){
          pushCache(data);
          elaborate(litem,dir,data);
      }
  );
  }
  // litem is a list item; dir is a direction in the entity-hierarchy.
  function elaborate(litem, dir, data){ // put some extra info about an item into the list
    if(data==null || data==undefined || data.length<1 || !data.hasOwnProperty("Name")) return;
    if(data.hasOwnProperty(dir) && litem!=null && litem!=undefined){ // add the directional extras
      $.each(data[dir], function(key,value){
        if(litem.html().length<300) // allow 400 chars including the "javascript"
          litem.append(" <span class='elab'>"+value+"</span> ");
        else litem.append("<span class='elab dot'>.</span>");
      });
    }
    if(litem!=null){
      var tooltip=""; // now try tool tips:
      if(data.hasOwnProperty("Synonyms")){
        tooltip+="("+data.Synonyms.join(", ")+")";
      }
      if(data.hasOwnProperty("Description")){
        if(tooltip.length>0) tooltip+=": ";
        tooltip+=formatDescription(data.Description);
      }
    //tooltip=$("<DIV>"+tooltip+"</DIV>").text();
      litem.prop('tooltipText', tooltip);
      litem.prop('title', tooltip);
    }
    if(dir=="Parents" && parentcount<100){ // Elaborate on parental causes / effects
      parentcount++;
      if(data.hasOwnProperty("Effects")){
        $.each(data.Effects,function(key,value){
          if($('#effects').html().indexOf(value)>=0) return; // don't duplicate effects
          $("<li class='elabparental'>"
          + "<A href='javascript:navigateto(\""+jsEncode(value)+"\")'><h3>"+htmlEncode(value)+"</h3>"
          + "<span class='elabfrom'> (from "+data.Name+")</span>"
          + "</A></li>")
            .appendTo('#l_effects_p');
        });
      }
      if(data.hasOwnProperty("Causes")){ 
        $.each(data.Causes,function(key,value){
          if($('#causes').html().indexOf(value)>=0) return; // don't duplicate effects
          $("<li class='elabparental'>"+value
          + "<A href='javascript:navigateto(\""+jsEncode(value)+"\")'><h3>"+htmlEncode(value)+"</h3>"
          + "<span class='elabfrom'> (from "+data.Name+")</span>"
          + "</A></li>")
            .appendTo('#l_causes_p');
        });       
      }
      if(data.hasOwnProperty("Treats")){ 
        $.each(data.Treats,function(key,value){
          $("<li class='elabparental'>"+value
          +"<span class='elabfrom'> (from "+data.Name+")</span></li>")
            .appendTo('#l_treat_p');
        }); 
        $('#treat_type').html("Treats");
        $('#treat').show();
      }
      if(data.hasOwnProperty("Treatments")){ 
        $.each(data.Treatments,function(key,value){
          $("<li class='elabparental'>"+value
          +"<span class='elabfrom'> (from "+data.Name+")</span></li>")
            .appendTo('#l_treat_p');
        }); 
        $('#treat_type').html("Treatments");
        $('#treat').show();
      }     
      if(data.hasOwnProperty("Parents")){ // now cascade to any superclasses of parent
        $.each(data.Parents, function(key,value){
          read_and_elaborate(null, "Parents", value);
        });
      }
    }
  }
  function pushCache(data){ // cache incoming data
    if(data.hasOwnProperty("Name")){
      cache[data.Name]=data;
      if(data.hasOwnProperty("Synonyms")){ // store the synonym too
        $.each(data.Synonyms, function(key,value){
          cache[value]=data;
        })
      }
    }else
      alert('server error: '+data);
  }
  $(function() {
    $( document ).tooltip();
  });
  function stripquotes(d){
    if(d==null)return "";
    d=String(d);
    if(d.length>0){
      if(d.charAt(0)=="\"") d=d.substring(1);
      if(d.charAt(d.length-1)=="\"") d=d.substring(0,d.length-1);
    }else d="";
    return $.trim(d);
  }
  function htmlEncode(str) {
    //var div = document.createElement('div');
    //var txt = document.createTextNode(str);
    //div.appendChild(txt);
    //return div.innerHTML;
    return str.replace(/'/g, "\'");
  }
  function jsEncode(str){
    return str.replace(/'/g, "&#39;");  
  }
  function formatDescription(d){
    d=stripquotes(d);
    d=d.replace(/\n/g,"<BR>");
    return d;
  }
  /** fix html in tool tips? */
  $(function () {
      $(document).tooltip({
          content: function () {
              return $(this).prop('title');
          }
      });
  });
  function submit_comment(){
    comment = $('#comment_input').val();
    editurl="http://www.homphysiology.org/cgi-bin/MedicineEdit.py"
       +"?command=comment&verified=true&entity="+encodeURIComponent(entityname)
       +"&comment="+encodeURIComponent( $('#comment_input').val() );
    $.get(editurl, "text").done(function(){
    $('#comment_input').val("Comment sent.");
    }).fail(function(){
      $('#comment_input').val("Sent.");
    });
  }
  function getAutocompleteNames(){ // read index of names for autocomplete
    if(namecache.length==0){
      $.getJSON("http://homphysiology.org/cgi-bin/MedicineReaderJson.py?entity=index",
        function(data){ // data should be a JSON array
          namecache.push.apply(namecache, data); 
          $('.autocomplete').autocomplete({
            source:namecache,
            select:function(e,ui){ // select from autocomplete --
              var ent=ui.item.label;
              if(ent){
                $('#searchtext').val(ent); dosearch();
              }
            }
          });
        }
      );
    }
  }
  function showcopyright(){ $("#copyright").toggle(); }
  function loadCacheFromLocalStorage(){ // called when loading page 
	  for(var i=0; i< localStorage.length ; i++ ){
		  ii = localStorage.getItem(localStorage.key(i)); // find each property
		  try{
		    iii= JSON.parse(ii); // is it an object?
		    if(iii.hasOwnProperty('Name')) // does it have a name?
		      cache[ii.Name] = iii;        // if so, put it in the cache
		  }catch(ex){}
	  }
      namecache = localStorage.namecache;
  }
  function loadLocalStorageFromServer(){ // called once for a given client
	  $.get("http://www.homphysiology.org/cgi-bin/MedicineReaderJson.py?entity=count",
        function(data){ // read the count of how many entities on server
          if(localStorage.length < parseInt(data)){ // are we deficient?
		        $.ajax({ // then reload the whole database
		            url: "http://www.homphysiology.org/cgi-bin/MedicineReaderJson.py"
		             +"?entity=.*", 
		            success: function(data){
		                var keys=[];	 // enumerate entities downloaded
		                for(key in data){ if(data.hasOwnProperty(key)) keys.push(key); }
		                bgLoadCacheFromString(data,0,keys); // populate the cache and localstorage
		            },
		            error:function( xhr, status, error){
                  console.log("could not read all entities '.*' from server:"+error); 
		            },
		            cache: false, // don't cache ajax responses
		            datatype: "json"
		        }); // ajax
		    }
		  }
	  );
    // now read the list of names for autocomplete
    if(namecache.length==0){
      $.getJSON("http://homphysiology.org/cgi-bin/MedicineReaderJson.py?entity=index",
        function(data){ // data should be a JSON array
          namecache.push.apply(namecache, data); 
          $('.autocomplete').autocomplete({
            source:namecache,
            select:function(e,ui){ // select from autocomplete --
              var ent=ui.item.label;
              if(ent){
                $('#searchtext').val(ent); dosearch();
              }
            }
          });
          localStorage.namecache = namecache; 
        }
      );
    }else{
      localStorage.namecache = namecache;
    }
  } // end function loadStorageFromServer
  function bgLoadCacheFromString(data, pos, keys){
	  // async convert data into cache and local storage
	  // Repeated callback method. 'keys' = list of attributes of 'data'
	  if(pos>=keys.length) return;
	  o=data[keys[pos]];               // get object from data
	  cache[o.Name]=o;                 // put in cache
	  localStorage.setItem(o.Name, o); // put in localStorage
	  setTimeout(bgLoadCacheFromString(data, pos+1, keys), 0.1);
  }  
  return my;
}
var medicine = MedicineReader();
var navigateto = medicine.navigateto;