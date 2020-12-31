var  MedicineReader = function(){
  my = {};
  var LOCAL_MODE=true;
  // the server to prepend. Will probably be 
  // http://www.homphysiology.org, but this gives CORS errors
  // if not using https... So "/" may work better.
  my.server_root = "/";
  my.server      = my.server_root + "cgi-bin/MedicineReaderJson.py";
  my.edit_server = my.server_root + "cgi-bin/MedicineEdit.py";
  my.entityname = 'Disease';  // starting entity name
  my.cache = {};      // all the entities data that have been preloaded
  my.namecache = [];  // names of all entities (for autocomplete).
  my.bookmarks = [];  // list of bookmarked items
  my.server_date = ""; // last-updated datestamp of data from server
  my.unsent_edits = []; // keep edits while offline, to be sent later.
  if(localStorage.unsent_edits===undefined){ // keep in localstorage too
    localStorage.unsent_edits = "[]"; 
  }
  var parentcount = 0; // make sure not too many parents chained

  /* When the HTML finishes loading */
  $(document).ready(function () {
    /** if there is no cache, this is our first run.  */
    if(!("cache" in localStorage)){
      $("#disclaimer").addClass("show");  // show the disclaimer text
      $("#disclaimer .button").click(function(){ // when "accept" is clicked
        $("#disclaimer").removeClass("show"); // hide it again
      });
    }

    /** now load the first entity */
    var e=getParameterByName("entity"); // check address bar
    if(e && e.length>0){ // if entity specified, use it
      my.entityname=e;
      history.pushState({},"",""); // blank so that navigation changes something
    }  
    
    // in local mode, we read all the data into a cache first.
    if(LOCAL_MODE){
      loadLocalStorageFromServer(); // read all entities in, asynchronously
    }else{
      getAutocompleteNames(); // for autocomplete
    }

    // allow cross-domain requests
    $.support.cors = true; 



    /** what to do when autocomplete search is clicked */
    $('.searcharea .ui-autocomplete').on('click', '.ui-menu-item', function(){
      my.dosearch();
    });

    /** create the UI sidebar menu from the <nav> tag */
    $("#menu").mmenu({
      dropdown 		: false,
		  counters		: true,
	  	searchfield		: {
  			panel			: true
    	},
  		navbar			: {
  			title			: "MedLinks"
	  	},
	  	navbars		: [{
	  		content: [ "searchfield" ]
	  	}, true]}, {
	  	searchfield: {
		  	clear: true
	  	},
    });
    my.menu=$("#menu").data( "mmenu" );

    /** create tooltips */
    $( document ).tooltip();

    /** convert title to an input when clicked */
    $(".header .searcharea").hide();
    var startsearchfunc = function(){
      var text       = $("#entityname");              
      var old        = text.text();    
      var searcharea = $(".header .searcharea");
      var input      = $("#searchtext");
      input.val("");
      searcharea.show(); text.hide();
      var save = function(){
        var newval = input.val();
        if(newval in my.namecache){
          navigateto(newval);
          text.html(newval);
        }
        searcharea.hide();text.show();
      };
      /** `one`, unbinds after it is called. */
      input.one('blur', save).focus();
    };
    $('#entityname').click(startsearchfunc);
    $(".searchbutton").click(startsearchfunc);

    /* when adding a bookmark: add/remove */
    $(".bookmark-add").click(function(){
      var i=my.bookmarks.indexOf(my.entityname);
      if(i<0){ // is not it in the list?
        my.bookmarks.push(my.entityname); // add it
        newitem = my.createBookmarkItem(my.entityname); // and create menu item
      }else{// it's already in the list
        if(confirm(my.entityname+" is already bookmarked. Remove it?")){
          my.bookmarks.splice(i,1); // remove the item
          $(".bookmark-list li[data-entity=\""+my.entityname+"\"]").remove(); // and menu item
        }
      }
      localStorage.bookmarks = JSON.stringify(my.bookmarks);
      my.menu.close();
    });    


    /** read bookmarks from localStorage */
    my.loadBookmarks();

    /* setup comment click handler to show the comments box */
    $('#show_comment_button').click(function(e){ 
      e.preventDefault(); e.stopPropagation(); 
      //$('#comment_input').val(''); // clear comment text
      $("#comment_box .button").prop("disabled",false); // enable submit-button
      $(".comment_box_entity_name").html(my.entityname); // put entity name in form
      $('#comment_box').toggle();  // show form 
      $('#comment_input').focus(); // put cursor in comment textbox
      $(".previous-comments").empty();
      /** Get previous comments about this item */
      $.ajax({
        url: my.edit_server,
        success:function(data){
          // extract part of comment lines after the entity name
          var matches = data.match(new RegExp(".*"+my.entityname+".*","igm"));
          // create list items in the .previous-comments UL
          if(matches){
            for(var i=0;i<matches.length;i++){
              var mtxt = matches[i].match(new RegExp(".*"+my.entityname+"\s*(.*)", "im"));
              if(mtxt.length>1){
                $(".previous-comments").append("<li>"+mtxt[1]+"</li>");
              }
            }
          }
        }
      }); // end ajax comment
    }); // end function comment click


    /** show copyright message when copyright button is clicked */
    $('#copyright-button').click(function(e){
      $("#copyright").toggle(); 
    })

    /** capture control+F key to start search*/
    $(document).keydown(function(e) {
      if (e.keyCode == 70 && e.ctrlKey) {
        startsearchfunc();
        return false;
      };
    });

    /** reload button - clear localStorage and get all data from server again */
    $(".reload-button").click(function(){
      if(navigator.onLine){
        localStorage.clear();
        loadLocalStorageFromServer(); // read all entities in, asynchronously
      }else{ alert("Not currently online"); }
    });

    /** edit mode checkbox */
    $(".edit-mode-checkbox").change(function(){
      my.set_edit_mode(this.checked == true);
    });

    /** add "add" / "remove" buttons for editing */
    $("h2").each(function(i,x){
      // list name is the contents of <h2> tag, but take the first part
      // until a symbol is found
      //let listname = $(this).closest("h2").html().split(/[^ a-zA-z0-9]/)[0].trim();
      // 2019 version: find the nearest "section" parent, and get its id.
      // this should be the internal section name. 
      let listname = $(this).closest("section").attr("id");
      if(listname===undefined){console.log("can't find list name"); return;}
      var plus  = $("<a class='edit button edit-add'><i class='fas fa-plus'></i></a>");
      plus.click(function(){ my.add_entity_clicked( listname );} );
      $(x).append(plus);
      var minus = $("<a class='edit button edit-remove'><i class='fas fa-minus'></i></a>");
      // when minus button clicked, send this list name to remove_entity_clicked
      minus.click( function(){ my.remove_entity_clicked( listname );} );
      $(x).append(minus);
    });
    // now uncheck the menu 
    $(".edit-mode-checkbox").prop("checked",false);

    /** read options from localStorage */
    // and hide those buttons if needed!
    my.loadOptions();


    // this sets up the text editing handlers
    $('body').on('focus', '[contenteditable]', function() {
      const $this = $(this);
      $this.data('before', $this.html());
    }).on('blur', '[contenteditable]', function() { // ignore 'keyup paste input' events
      const $this = $(this);
      if ($this.data('before') !== $this.html()) {
          $this.data('before', $this.html());
          $this.trigger('change');
      }
    });  

    $("#select-entity-dialog .button.button-done").click(function(){ // when "accept" is clicked
      my.select_entity_dialog_done();
    });
    $("#select-entity-dialog .button.button-cancel").click(function(){ // when "accept" is clicked
      my.select_entity_dialog_cancel();
    });


    setTimeout(function(){
      my.navigateto(my.entityname);   
    },200);

  }); // end initialise

  /********** END OF INITIALISATION **********/
  
  function readentity(){ // read server name "entityname" and display using populate
    if(my.entityname.length==0) { return; }
    $('body').css('cursor','wait');
    $.ajax({
      url: my.server + "?single=true&entity=" + my.entityname, 
      success: function(data){
          pushCache(data[0]); // cache in case needed later
          populate(data[0]);  // set up the main data fields
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
      document.title=data.Name+" - Manohar MedLinks Browser";
    }
    // hide and remove old data
      $('#l_children').html(""); $('#children').hide();
      $('#l_parents').html("");  $('#parents').hide();
      $('#l_causes').html("");   $('#l_causes_p').html(""); $("#causes").addClass("listarea-empty");    // $("#causes").hide();
      $('#l_effects').html("");  $('#l_effects_p').html(""); $("#effects").addClass("listarea-empty");  // $("#effects").hide();
      $('#l_treat').html("");    $('#treat').hide();       $('#l_treat_p').html("");
      $('#l_synonyms').html(""); $('#synonyms').hide();
      $('#description').html("");$("#description").hide();
      $('#comment_box').hide();
    
    /** function to create an entity <a> tag within a list.  */
    var make_list_link = function(entity, listname, li){
      var i = $("<A href='javascript:' class='list-link'><h3>"+htmlEncode(entity)+"</h3></A>");
      i.click(function(){
        my.list_click(entity,listname);
      });
      /** if editing, and the entity is empty, then colour it differently */
      if(my.is_edit_mode && my.is_entity_empty(entity)){
        i.find("h3").addClass("entity-empty")
      }
      if(my.is_edit_mode){
        li.append("<div class='list-move-buttons'>"+
                   "<i class='list-move-button-up fa fa-angle-up'></i>"+
                   "<i class='list-move-button-down fa fa-angle-down'></i>");
        let move_e = entity, move_l=listname;
        li.find("i.list-move-button-up"  ).click(function(){my.edit_list_move( entity,listname, -1);});
        li.find("i.list-move-button-down").click(function(){my.edit_list_move( entity,listname, +1);});
      }
      i.appendTo(li);
      return i; 
      //"href='javascript:list_click(\""+jsEncode(value)+"\")'
    } ;     
    // look for direct children, parents, cuases, effects  
    if(data.hasOwnProperty("Children")){
      $.each(data.Children,function(key,value){
        var li=$("<LI></LI>").appendTo("#l_children");
        var i =make_list_link(value, "children", li);
        read_and_elaborate_item(i,"Children",value);
      } );
      $('#children').show();
    } 
    if(data.hasOwnProperty("Parents")){
      $.each(data.Parents,function(key,value){
        var li=$("<LI></LI>").appendTo("#l_parents");
        var i =make_list_link(value, "parents", li);
        read_and_elaborate_item(i,"Parents",value);
      } );
      $('#parents').show();
    }
    if(data.hasOwnProperty("Causes")){
      $.each(data.Causes,function(key,value){
        var li=$("<LI></LI>").appendTo("#l_causes");
        var i =make_list_link(value, "causes", li);
        read_and_elaborate_item(i,"Causes",value);
      } );
      $('#causes').show();
    }
    if(data.hasOwnProperty("Effects")){
      $.each(data.Effects,function(key,value){
        var li=$("<LI></LI>").appendTo("#l_effects");
        var i =make_list_link(value, "effects", li);
        read_and_elaborate_item(i,"Effects",value);
      } );
      $('#effects').show();
    }

    if(data.hasOwnProperty("Description")){
      var d=String(data.Description);
      d=formatDescription(d);
      if(d.length>0){
        $('#description').html(d); 
        $("#description").show();
      }
    }
    
    if(data.hasOwnProperty("Synonyms")){
      $.each(data.Synonyms, function(key,value){
        var syn_item = $("<LI><h3>"+value+"</h3></LI>");
        $('#l_synonyms').append( syn_item );  
      });
      if(my.is_edit_mode){ // if editing, allow in-place editing of synonyms
        $("#synonyms li h3").attr("contenteditable",true);
        $("#synonyms li h3").change(my.change_synonym);
      }
      $('#synonyms').show();
    }
    // read treatments or treats
    if(data.hasOwnProperty("Treatments")){
      $.each(data.Treatments, function(key,value){
        var li=$("<LI></LI>").appendTo("#l_treat");
        var i =make_list_link(value, "treatments", li);
        read_and_elaborate_item(i,"Treatments",value);
      });
      // since the h2 element may contain buttons, preserve the 
      // html and just change the text content
      $('#treat_type').contents().first()[0].textContent = "Treatments";
    }else if(data.hasOwnProperty("Treats")){
      $.each(data.Treats, function(key,value){
        var li=$("<LI></LI>").appendTo("#l_treat");
        var i =make_list_link(value, "treats", li);
        read_and_elaborate_item(i,"Treats",value);
      });
      $('#treat_type').contents().first()[0].textContent = "Treats";
    }

    /** Show items that have been successfully populated (effects, causes, treats) */
    if($("#causes .slist li").length>0){ // are there any items in the list?
      $("#causes").removeClass("listarea-empty"); // make the list visible.
    }
    if($("#treat_type .slist li").length>0){
      $('#treat').show();
    }
    if($("#effects .slist li").length>0){ // any items in effect list?
      $("#effects").removeClass("listarea-empty"); // make it visible
    }

    if(my.is_edit_mode){   // irrespective of whether a zone is populated,
      my.show_all_areas(); // show it when we're in edit mode.
    }

    // add wikipedia and google
    $('.wikipedia').html("<a href='http://en.wikipedia.org/wiki/"
                         +escape(my.entityname)+"' target='_blank'> Wikipedia </A>");
    $('.google').html("<a href='http://www.google.co.uk/search?q="
                      +escape(my.entityname)+"' target='_blank'> Google </A>");
    $('.emedicine').html("<a href='http://search.medscape.com/reference-search?newSearchHeader=1&queryText="
                      +escape(my.entityname)+"' target='_blank'> Medscape </A>");
    $('.uptodate').html("<a href='http://www.uptodate.com/contents/search?search="
                      +escape(my.entityname)+"' target='_blank'> UpToDate </A>");
    $('.pubmed').html("<a href='http://www.ncbi.nlm.nih.gov/pubmed/?term="
                      +escape(my.entityname)+"' target='_blank'> PubMed </A>");
    $('.fpnotebook').html("<a href='http://www.fpnotebook.com/asp3/search2.aspx?qu="
                      +escape(my.entityname)+"' target='_blank'> FPNotebook </A>");
    var jsonQueryURL = 'http://www.homphysiology.org/cgi-bin/MedicineEntityNameJsonQuery.py';

  }
  /* create a menu item for a given item name */
  my.createBookmarkItem = function(i){
    var newitem = $("<li  data-entity=\"" + i + "\" class='mm-listitem'>"
       +"<a href='javascript:navigateto(\"" + i 
           + "\")'>" + i + "</a></li>");
    $(".bookmark-list").append(newitem);
  };
  /** on startup, load bookmarks from localStorage and create menu items */
  my.loadBookmarks = function(){
    if(localStorage.bookmarks){
      my.bookmarks = JSON.parse(localStorage.bookmarks);
      for(var i=0;i<my.bookmarks.length; i++){
        my.createBookmarkItem(my.bookmarks[i]);
      }
    }else{
      localStorage.bookmarks="";
    }
  };
  /** 
   * on startup, load options from localStorage. 
   * For example, edit mode. 
   * */
  my.loadOptions = function(){
    var opts;
    try{
      opts = JSON.parse( localStorage.options );     // this might be absent or corrupted...
    }catch(exception){ // first time we have executed in this browser?
      my.saveOptions();   // store a new options object
      opts = JSON.parse( localStorage.options ) // and re-read it for use
    }
    // load the options: 
    my.set_edit_mode( opts.is_edit_mode ); 
    my.set_include_community( opts.include_community ); 
    my.unsent_edits = JSON.parse( localStorage.unsent_edits );
  }

  /** when options are changed: write the changes to the localStorage. */
  my.saveOptions = function(){
    localStorage.options = JSON.stringify({
      "is_edit_mode": my.is_edit_mode,
      "include_community": my.include_community
    });
    // don't call set_edit_mode because this is called from that function!
    my.save_unsent_edits();
  }
  /**  called when unsent edits is changed. writes the variable to localStorage */
  my.save_unsent_edits = function(){
    localStorage.unsent_edits = JSON.stringify( my.unsent_edits );
  };


  /**************************
   * Handlers
   *************************/
  /** called when a list entity is clicked - calls navigateto(). */
  my.list_click = function(entity, listname){
    if(my.is_remove_mode){
      if(my.editing_list.toLowerCase()===listname){
        my.try_remove_entity(entity,listname); 
        return;
      }else{
        my.end_remove_mode();
      }
    }
    navigateto(entity); 
  };
  /** called when a link is clicked. push state and call internal navigation */
  my.navigateto = function(entity){ //called by clicks
    history.pushState({id:entity}, entity,'?entity='+encodeURIComponent(entity)); // previously '?', then , '#'+encodeURIComponent(entity));
    my.internal_navigate(entity);
  }
  /** when calling navigate-to from menus, close the menu after navigating */
  my.menu_navigateto = function(entity){
    my.navigateto(entity);
    my.menu.close();
  };
  /**
   * The "select entity" dialog is a generic dialog for several tasks.
   * We infer what the task is from the title.
   * 
   * The "done" function is called when a select-entity-dialog has been ok'd.
   * Find out what command was in the dialog from its title, and dispatch to 
   * an appropriate function.
   * 
   * This is quite bad practice since it relies on the title text
   * of the dialog to work out which dialog is showing. But it's
   * even more complicated to keep metadata with the dialog... 
   */
  my.select_entity_dialog_done = function(){
    var title = $(".select-dialog-title").html();
    if(title.match(/Add .*/)){
      my.add_entity_done();return;
    }
    if(title.match(/Find path.*/)){
      my.select_entity_find_path_done();return;
    }
    if(title.match(/Results/)){
      my.select_entity_results_done();return;
    }
  };
  /** 
   * called when .button.cancel is pressed on the select-entiy-dialog.
   * This cancels any add / find path / search results operations.
   */
  my.select_entity_dialog_cancel = function(){
    $("#select-entity-dialog").removeClass("show");
    my.editing_list = ""; // clear information about what list is being added to
  };
  /** 
   * Called when "edit" is turned on, or
   * when loading an entity and edit is already on.
   * Simply reveals all the entity panels that might be hidden.
   */
  my.show_all_areas = function(){
    $("#causes").show();
    $("#effects").show();
    $("#parents").show();
    $("#children").show();
    $("#synonyms").show();
    $("#treat").show();
    $("#description").show();
    // default titles of treat panel, if not already set
    if(my.hasRel( my.entityname, "Parents", ["Disease","Symptom","Sign","Pathology"])){
      $('#treat_type').contents().first()[0].textContent = "Treatments";
    }else if(my.hasRel( my.entityname, "Parents", ["Procedure", "Substance"])){
      $('#treat_type').contents().first()[0].textContent = "Treats";
    }

  };

  /** 
   * When the 'find path' menu is selected, and after an item is selected,
   * Get the possible routes to selected entity from current entity
   * and display results in the dialog.
   */
  my.select_entity_find_path_done = function(){
    var e=$('#select-dialog-searchtext').val(); // get entity name from text input
    e = my.internal_find(e);        // try search for real name
    if( my.cache[e]===undefined ){ // is it in the cache?
      console.log("no entity found: "+e); return;
    }
    // try ways of getting to the entity via various routes, and 
    // concatenate all the results.
    var list =          my.findRel(my.entityname,["Causes", "Parents"],e,10);  // call the find function
    list = list.concat( my.findRel(my.entityname,["Causes", "Children"],e,10));  // call the find function
    list = list.concat( my.findRel(my.entityname,["Effects", "Parents"],e,10));  // call the find function
    list = list.concat( my.findRel(my.entityname,["Effects", "Children"],e,10));  // call the find function
    $(".select-dialog-title").html("Results: paths from "+my.entityname+" to "+e);
    var result_list = $("<ul class='result-path'></ul>");
    for(var i=0;i<list.length;i++){ // for each route
      var result_item = $("<li></li>"),
          result_sublist = $("<ul></ul>"); // create a sublist
      result_list.append(result_item);     // and add it to the results
      result_item.append(result_sublist);      
      for(var j=0;j<list[i].length;j++){ // for each item in the route
        var result_subitem = $(  // add a sub-item
          "<li><A href='javascript:navigateto(\""+
          jsEncode(list[i][j])+"\")'>"+ list[i][j] +"</a></li>"); 
        result_sublist.append(result_subitem); 
      }
    }
    if(list.length==0){   // empty result?
      result_list = $("No routes found.")
    }
    $(".select-entity-dialog-results").empty(); // remove prev results
    // add results to dialog (which is already shown)
    $(".select-entity-dialog-results").append(result_list);
  }
  /** close dialog and clear results  */
  my.select_entity_results_done = function(){
    $(".select-entity-dialog-results").html("");
    $("#select-dialog-searchtext").val("");
    $("#select-dialog-searchtext").show();
    $("#select-entity-dialog").removeClass("show"); // hide it again
  }
  /** called when menu "list of causes" etc is clicked.
   * Calls listAllRel with the given relation and parent, and shows 
   * results in dialog.
   */
  my.menu_list = function(rel,parent){
    var MIN_ITEMS = 7; // increase depth until we get this many items
    var MAX_DEPTH = 10; // stop search at this depth
    // ensure parent is an array of strings
    if(!(parent instanceof Array)){ parent = [parent]; }
    for(var i=0; i<parent.length;i++){
      if( my.cache[parent[i]]===undefined ){ // is it in the cache?
        console.log("no parent found: "+parent[i]); return;
      }
    }
    var list;
    var list_depth = 0; // initial list depth for search 
    var list_len = 0, iterations = 0;
    // gradually increase the list depth, until we have a list 
    // of at least MIN_ITEMS 
    while( list_len < MIN_ITEMS && list_depth++ < MAX_DEPTH){
      if(true){ // traverse up and down as well?
        list =             my.listAllRel(my.entityname,[rel,"Parents" ],parent, list_depth ); 
        list = list.concat(my.listAllRel(my.entityname,[rel,"Children"],parent, list_depth )); 
        list = [...new Set(list)];
      }else{ // traverse only in the specified direction
        list = my.listAllRel(my.entityname,rel,parent,6); 
      }
      list_len=list.length;
    }
    $(".select-dialog-title").html("Results: "+rel+" of "+my.entityname);
    var result_list = $("<ul class='result-path'></ul>");
    for(var i=0;i<list.length;i++){
      var result_item = $("<li><a href='javascript:navigateto(\""
                          +jsEncode(list[i])+"\")'>"+ list[i] +"</a></li>" );
      result_list.append(result_item);
      let ix = i; // for closure, for event handler
    }
    $(".select-entity-dialog-results").empty(); // remove prev results
    $(".select-entity-dialog-results").append(result_list); // add results to dialog
    $("#select-dialog-searchtext").hide(); // hide the search input
    $("#select-entity-dialog").addClass("show"); // show results dialog
  };
  /** Show the "Find path" dialog  */
  my.menu_find_path =function(){
    $(".select-entity-dialog-results").empty(); // remove prev results
    $("#select-dialog-searchtext").show(); // show the search input
    $(".select-dialog-title").html("Find path from "+my.entityname+" to:");
    $("#select-entity-dialog").addClass("show"); // show add path dialog
  };

  /** 
   * Handle browser back/forward events. (previously bound to window 'statechange' event)
   */
  $(window).bind('popstate',function(event){ // Popstate function - call populate.
    var State = event.originalEvent.state;// history.getState(); // Note: We are using History.getState() instead of event.state
    // State.data, State.title, State.url
    var e=State.title; // check the 'title' of the state
    if(!e){ e = State.id; } // if not, check the 'id' property.
    if(!e){ console.log("can't go back - no state!"); return false; }
    if(e!==my.entityname){ // has it changed?
      my.entityname=e;     // set a new entity
      my.internal_navigate(e); // and navigate to it
    }
  });
  /** 
   * called either when back/forward pressed, or "navigateto" is called.
   * This resolves ename to 
   */
  my.internal_navigate = function(ename){
    // the entity name provided to us by the user
    var data, true_ename;               // the cached entity, and its internal name
    true_ename = my.internal_find(ename);
    data = my.cache[true_ename];
    if(data){                    // was an item found in the cache?
      my.entityname = true_ename;// set internal name
      populate(data);            // used cached version
    }else{                       // otherwise:
      my.entityname = ename;     // not sure what this entity is:
      readentity();              // load from server.
    }
    /** scroll to top of page */
    $(".header")[0].scrollIntoView();
  };
  /** find entity's true name, by loose name */
  my.internal_find = function(ename){
    var true_ename; // undefined
    if(my.cache.hasOwnProperty(ename)){ // look in cache for the given name
      data = my.cache[ename];
      // check for synonyms. synonyms are stored in the cache, with just a string
      // that references the appropriate real entity.
      if(typeof data === 'string' || data instanceof String){
        true_ename = data;              // actual internal name
        //data = my.cache[data];          // the data object
      }else{                            // the user provided an accurate name
        true_ename = ename;             // so use the name provided 
      }
    }else{ // if the exact given name isn't in the cache,
      for(var p in my.cache){
        if(my.cache.hasOwnProperty(p)){ // look for exact synonyms
          if(my.cache[p].hasOwnProperty("Synonyms")){
            if(my.cache[p].Synonyms.indexOf(ename)>=0){ return p; }
          }
        }
      }
      for(var p in my.cache){       // for each cache item
        if(my.cache.hasOwnProperty(p)){
          if(my.looseMatch(ename,p)){ // use looseMatch to find any cache item that might match?
            true_ename = p;             // internal name
            data = my.cache[p]; break;     // found the item! (we take the first match)
          }
        }
      }// end for each cache item
    }
    return true_ename;
  };

  /** 
   * does the text t match entity e?
   * Use some loose spelling. Test for the presence of item 1, and replace with item 2.
   */
  my.LOOSE = [
    ["leuco", "leuko"],
    ["ae", "e"],
    ["oe", "e"],
    ["ph","f"],
    ["elevated", "high"],
    ["raised","high"],
    ["increased","high"],
    ["low","reduced"],
    ["decreased","reduced"]
  ];
  my.looseMatch = function(t,e){
    t=t.toLowerCase(); e=e.toLowerCase();
    if(e.indexOf(t)>=0)  { return true; }
    for(var i=0;i<my.LOOSE.length; i++){
      var a=my.LOOSE[i][0]; var b=my.LOOSE[i][1];
      if(e.indexOf(a)>=0 && t.indexOf(b)>=0 ){
        if(e.replace(a,b).indexOf(t)>=0){ return true;}
      }
      if(e.indexOf(b)>=0 && t.indexOf(a)>=0){
        if(e.indexOf(t.replace(a,b))>=0){ return true;}
      }
    }
    return false;
  };

  my.dosearch = function(){ // called when search fo  rm action performed
    var e = $('#searchtext').val();
    if(e){
      $("#searchtext").blur();
      my.entityname=e;
      my.navigateto(e);
    }
  }
  function read_and_elaborate_item(litem, dir, ename){ // query and elaborate on a list item 
    if(my.cache.hasOwnProperty(ename)) elaborate(litem,dir,my.cache[ename]);
    else // not cached: read from server then elaborate
    $.get(my.server+"?single=true&entity="+ename, 
        function(data,status){
          pushCache(data[0]);
          elaborate(litem,dir,data);
      }
    );
  }
  // litem is a list item; dir is a direction in the entity-hierarchy.
  // put some extra info about an item into the list
  function elaborate(litem, dir, data){
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
          $("<li class='elabparental'>"
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
          read_and_elaborate_item(null, "Parents", value);
        });
      }
    }
  }
  /**************************************
   * Entity functions
   ***************************************/
  /**
   * Test whether the entity has a relation called rname
   * ename = starting entity
   * rel = relation name. Can be a list of relations - use any of the relations.
   * rname = name of the relative we want to find
   * traversed - omit this, used internally to track which entities have 
   *             been traversed so far.
   * eg. if rel is "Parent",
   * if ename doesn't have any parents or doesn't exist, return false.
   * If ename does have parents, then -
   *    for each of its parents, if it is 'pname', return true,
   *    if not, call hasRel again for each parent, and 
   *            if it is true, return true.
   * If rname is an array, test whether any of them match a relative.
   */
  my.hasRel = function(ename, rel, rname, traversed, depth){
    if(traversed===undefined){traversed=[];}
    if(traversed.indexOf(ename)>=0){return;}
    if(depth===undefined){depth = 10;}
    if(depth==0){ return false; }
    traversed.push(ename);
    var e=my.cache[ename];
    if(e===undefined){return false;}
    if(!Array.isArray(rel)){
      rel=[rel];
    }
    for(var j=0;j<rel.length;j++){
      var r=e[rel[j]]; // r is the list of the corresponding relation from ename
      if(r===undefined){continue;} // no list
      for(var i=0;i<r.length;i++){ // has list. for each item:
        if(typeof rname === 'string'){ // if testing against a single string
          if(r[i]===rname){return true;} // is it the requested item? return true
        }else{ // if testing against a set of possibilities
          if(rname.includes(r[i])){ return true; }
        }
        if(my.hasRel(r[i],rel,rname, traversed, depth-1)){
          return true;  // found within this item! stop search now.
        } // not requested item - try on the new item
      }
    }
    return false;
  };
  
  // for findRel:
  // don't allow routes which contain the same item in 
  // (i.e. routes must never overlap)
  my.DISALLOW_DUPS=true;
  /**
   * findRel(start, rel, finish)
   * Get the path to the relation called rname
   * results - a list of the paths to from start to finish
   * post_result - alternative syntax which asynchronously sends results.
   *   each result is an array of entities making a chain
   *   or 'null' after search is completed.
   */
  my.findRel = function(start, rel, finish, depth, post_result, traversed, results, sofar){
    var starting = false; // is this the first layer of recursion?
    if(traversed===undefined){ // at the start, no information provided
      traversed=[];results=[]; sofar=[]; // create blank lists
      starting = true; // and note that we are in the top level.
    }
    if(depth===undefined){ depth = 10; }
    if(depth<0){ return; }
    if(my.DISALLOW_DUPS){ // if item was previously encountered at any point, disallow.
      if(traversed.indexOf(start)>=0){return;}
    }else{ // if item was previously encountered in this route, disallow.
      if(sofar.indexOf(start)>=0){return;}
    }
    traversed.push(start);
    var e=my.cache[start];
    if(e===undefined){return false;}
    if(!Array.isArray(rel)){
      rel=[rel];
    }
    for(var j=0;j<rel.length;j++){
      var r=e[rel[j]]; // relation list
      if(r===undefined){continue;} 
      for(var i=0;i<r.length;i++){ // for each relative:
        if(r[i]===finish){      // arrived at target?
          if(post_result===undefined){
            results.push(sofar); // add the current route to the results
          }else{
            post_result(sofar);
          }
          return results; // don't continue on this branch once it has been added
        }else{ // not arrived yet
          // shallow array copy of sofar
          var sofar_j = sofar.slice(0);  // create a new route as a branch of the current route
          sofar_j.push(r[i]);  // with the next item at the end.
          my.findRel(r[i],rel,finish,depth-1,post_result,traversed, results, sofar_j ); // recursively call 
        }
      }
    }
    if(starting && post_result!==undefined){ // if this is the end of top level iteration,
      post_result(null);  // post an ending-message
    }
    return results;
  };
  /**
   * and are children of a given parent.
   * Traverse maximum of 'depth' items.
   */
  my.listAllRel = function(start, rel, parent, depth, post_result, traversed, results){
    var starting = false; // is this recursion the first level?
    if(traversed===undefined){ // no parameters: starting out.
      traversed=[];results=[];
      starting = true;
    }
    if(traversed.indexOf(start)>=0){return;}
    if(depth<0){return;}
    traversed.push(start);
    var e=my.cache[start];
    if(e===undefined){return false;}
    if(!Array.isArray(rel)){
      rel=[rel];
    }
    for(var j=0;j<rel.length;j++){
      var r=e[rel[j]]; // relation list
      if(r===undefined){continue;} 
      for(var i=0;i<r.length;i++){ // for each relative:
        var hasparent=false; // check if it has any of the appropriate parents
        if(parent instanceof Array){ // parent is a list:
          for(var k=0;k<parent.length;k++){  // for each possible parent
            if(my.hasRel(r[i],"Parents",parent[k])){ // does it have that parent?
              hasparent=true;
            }
          }
        }else{ // parent isn't a list:
          hasparent = my.hasRel(r[i],"Parents",parent);  // just check for hat one.
        }
        if(hasparent){  // is it a child of specified item?
          if(post_result===undefined){
            results.push(r[i]); // add it to results list
          }else{
            post_result(r[i]);  // or send an asynchronous message
          }
          
        }else{ // not arrived yet
          my.listAllRel(r[i],rel,parent,depth-1,post_result,traversed, results ); // recursively call 
        }
      }
    }
    if(starting && post_result!==undefined){ // should we send a terminate signal?
      post_result(null);
    }
    return results;
  }
  /** what is the inverse of a given relation? */
  my.getInverseRelation = function(rel){
    switch(rel){
      case "Causes":     return "Effects";
      case "Effects":    return "Causes";
      case "Parents":    return "Children";
      case "Children":   return "Parents";
      case "Treats":     return "Treatments";
      case "Treatments": return "Treats";
      default: return undefined;
    }
  }

  function pushCache(data){ // cache incoming data
    if(!data){ console.log("Server error: "+data); return; }
    if(data.hasOwnProperty("Name")){
      my.cache[data.Name]=data;
      if(data.hasOwnProperty("Synonyms")){ // store the synonym too
        $.each(data.Synonyms, function(key,value){
          my.cache[value]=data.Name;
        })
      }
    }else{
      console.log('server error: ');console.log(data);
    }
  }
  /* called when the submit button on the comment is pressed */
  my.submit_comment = function(){
    $("#comment_box .button").prop("disabled",true);
    $("#comment_box").addClass("comment-sending")
    var comment0 = $('#comment_input').val();
    var comment = comment0.replace(/([^a-z0-9 /.?()%!"'-]+)/gi, '_');
    if(comment!==comment0){
      alert("unusual symbols were removed from the comment.")
    }
    if(comment.length>125){
      comment=comment.substring(0,125);
      alert("comment was truncated to 125 letters.");
    }
    editurl = my.edit_server
       +"?command=comment&verified=true&entity="+encodeURIComponent(my.entityname)
       +"&comment="+encodeURIComponent( comment );
    console.log(editurl);
    $.get(editurl, "text").done(function(){
      $('#comment_input').val("Comment sent.");   
      $("#comment_box").removeClass("comment-sending");
      $("#comment_box").addClass("comment-sent");   
      console.log("sent");
      setTimeout(function(){
        $("#comment_box").removeClass("comment-sent");
        $("#comment_input").val("");
        $("#comment_box .button").prop("disabled",false);
        $("#comment_box").hide();
      }, 3000);
    }).fail(function(msg){
      $('#comment_input').val("Not sent...");
      console.log(msg);
    });
  }
  /** Used when not using localStorage */
  function getAutocompleteNames(){ // read index of names for autocomplete
    if(my.namecache.length==0){
      $.getJSON(my.server+"?entity=index",
        function(data){ // data should be a JSON array
          my.namecache.push.apply(my.namecache, data); 
          setup_autocomplete();
        }
      );
    }
  }
  /** 
   * Used to create localStorage
   * If localstorage already exists, then read localStorage using readCacheObjects
   * 2019 - this also sends any unsent edits to the server (stored in unsent_edits[])
   */
  function loadLocalStorageFromServer(){ // called once for a given client
    my.dataFound = false;
    // Offline: just read from local storage
    if("cache" in localStorage && localStorage.cache.length>0){
      my.cache     = JSON.parse(localStorage.cache);       // start reading cache
      my.namecache = JSON.parse(localStorage.namecache);   // from localStorage
      setup_autocomplete();           
      ensure_first_entity_loaded();
      update_date_text();
      my.dataFound = true;
    }
    if(navigator.onLine){
      // Online: check the server for updates
      $.ajax({
        url: my.server+"?entity=date",
        cache: false, 
        success: function(data){ // read the count of how many entities on server
          my.server_date = parseInt(data);  // date of inforation on server
          var cache_date = parseInt(localStorage.server_date);  // date of my cache
          // is the localStorage cache absent or old?
          if(!localStorage.cache || !cache_date || cache_date < my.server_date){ 
            $.ajax({ // then reload the whole database
                url: my.server + "?entity=.*", 
                success: function(data){
                  if(data.length>0){
                    readCacheObjects(data); // asynchronously convert to cache objects
                    my.dataFound=true;
                  }else{ console.log("error reading all entities"); }
                },
                error:function( xhr, status, error){
                  console.log("could not read all entities '.*' from server:"+error); 
                },
                cache: false, // don't cache ajax responses
                datatype: "json"
            }); // end ajax for reading whole database
            // now read the list of names for autocomplete
            $.getJSON(my.server + "?entity=index",
              function(data){ // data should be a JSON array
                my.namecache.push.apply(my.namecache, data); 
                // remove duplicates
                my.namecache = [...new Set(my.namecache)];
                setup_autocomplete();
                localStorage.namecache = JSON.stringify(my.namecache);
              }
            ); // end get autocomplete index
          } // Otherwise, we have all items in the local storage
        } // function(data)
      }); // end of get
    } // end if online
  } // end function loadStorageFromServer

  function setup_autocomplete(){
    $('.autocomplete').autocomplete({
      source:  function(request, response) {
        var results = $.ui.autocomplete.filter(my.namecache, request.term);
        response(results.slice(0, 100));
      },
      minLength:2,
      select:function(e,ui){ // select from autocomplete --
        var ent=ui.item.label;
        if(ent){ // if there was an entity selected from the list,
          /* don't allow switching entity from #select-dialog-searchtext,
           * only from main #searchtext */
          if(this.id==="searchtext"){
            $('#searchtext').val(ent); my.dosearch();
          }
        }
      }
    });
    $(".entity-count-text").html(Object.keys(my.cache).length);
  }
  /**
   *  O is a list of objects of the form
   * [ {"Name":"Disease","Children":["Neurological disesae"]} , ... ]
   * convert this to the form
   * my.cache = {"Disease":{"Children":["Neurological disease"]}
   * 
   * Make the icon "busy", and When done, stop the busy icon
   * Update the local storage date with the date from server.
   */
  function readCacheObjects(o){
    $(".busy-icon").show();
    asyncForEach(o,function(err){
      // when done, store the cache to the localStorage
      if(!err){
        localStorage.cache = JSON.stringify(my.cache); 
        ensure_first_entity_loaded();
      }else{console.log(err);}
      // tell interface that everything has loaded
      $(".busy-icon").hide();
      if(my.server_date ){
        localStorage.server_date = my.server_date; 
        update_date_text();
      }
    },function(i,n,next){
      my.cache[i.Name] = i;
      next();
    });
  }
  function update_date_text(){
    var d=new Date(parseInt( localStorage.server_date));
    $(".server-date-text").html(d.toLocaleString())
  }
  /**
   * Internal function to create a new, detached entity.
   * This must only be called during an 'add' edit, so that the new
   * entity gets appropriately connected up immediately after creation
   */
  my.create_new_empty_entity = function(e){
    my.cache[e]={"Name":e};
  };
  /** 
   * returns whether an entity is 'empty', i.e. it has been created
   * and has only one link.
   */
  my.is_entity_empty = function(e){
    var found_edits = 0;
    var o = my.cache[e];
    if(o.Synonyms !== undefined && o["Synonyms"].length>0){ found_edits++; }
    if(o.Parents  !== undefined){ found_edits+= o.Parents.length; }
    if(o.Children !== undefined){ found_edits+= o.Children.length; }
    if(o.Causes   !== undefined){ found_edits+= o.Causes.length; }
    if(o.Effects  !== undefined){ found_edits+= o.Effects.length; }
    return found_edits<2;
  };

  /********************************************
   *  Editing functions 
   *********************************************/
  my.set_edit_mode = function(is_edit_mode){
    my.is_edit_mode = is_edit_mode;
    my.saveOptions();
    if(is_edit_mode){
      $(".edit").show();
      my.show_all_areas();
      // make synonyms content editable
      $("#synonyms li h3").attr("contenteditable",true);
      $("#synonyms li h3").change(my.change_synonym);
      // make description content editable
      $("#description").attr("contenteditable", true);
      $("#description").change(my.change_description);
    }else{
      $(".edit").hide();
      $("#synonyms li h3").attr("contenteditable",false);
    }
  };
  /** Add an item - called when + is clicked */
  my.add_entity_clicked = function( listName ){
    $("#select-entity-dialog").addClass("show");
    // focus and select the text
    $("#select-entity-dialog input:text").focus().select();
    listname  =  toInitialCapsCase(listName).trim();
    if(listname==="Treat"){
      if(my.hasRel(my.entity,"Parents","Treatment")){
        listname = "Treats";
      }else{
        listname = "Treatments";
      }
    }
    my.editing_list = listname;
    $(".select-dialog-title").html("Add "+listname);
  };
  /** called when the OK button is clicked in the add entity dialog,
   * or when the autocomplete action is triggered e.g. by pressing enter.
   */
  my.add_entity_done = function(){
    $("#select-entity-dialog").removeClass("show"); // hide it again
    // this is 'let' so it gets passed to the confirm dialog.
    let e_name = $('#select-dialog-searchtext').val(); // get entity name from text input
    // if it's a synonym, it doesn't need to match an existing entity.
    // in fact, it should not!
    e = my.internal_find(e_name);        // try search for real name
    if( my.cache[e]===undefined ){ // is it in the cache?
      if(my.editing_list==="Synonyms"){ // no!
        // if it's supposed to be a new synonym, that's good news
        var success = my.invoke_edit_and_log("add\t"+my.entityname+"\tSynonyms\t"+e_name); 
      }else{
        /** Ask the user if they really want to create a new entity */
        var confirm = $("#confirm-create-dialog");        
        confirm.find(".button-cancel").unbind().click(function(){
           confirm.removeClass("show"); // if cancel pressed, do nothing
        });
        // store these in the closure of the confirm handler:
        let main_entity = my.entityname, list = my.editing_list;
        confirm.find(".button-ok"    ).unbind().click(function(){ 
          confirm.removeClass("show"); 
          var success = my.invoke_edit_and_log(
            "add\t"+main_entity+"\t"+list+"\t"+e_name);
        });
        confirm.addClass("show");
      }
    }else{ // it is in the cache
      if(my.editing_list==="Synonyms"){ // it's a synonym, but an entity of that name exists!
        console.log("cannot add synonym "+e+": already matches.")
      }else{ // not a synonym: must be an entity list.
        // check we have a list that we are adding to 
        if( my.editing_list==="" ) { console.log("cmd: no list selcted"); return; }
        // create add command, e.g.
        // add  signs  children  tachycardia
        var success = my.invoke_edit_and_log(
          "add\t"+my.entityname+"\t"+my.editing_list+"\t"+e
        )
      }
    }
    my.editing_list=""; // clear the adding list
  };
  /** Add an item - called when + is clicked */
  my.remove_entity_clicked = function(listName){ // list name as shown in html
    // have we re-clicked an already-selected minus sign?
    if(my.is_remove_mode && my.editing_list === toInitialCapsCase(listName)){
      my.end_remove_mode(); return;
    }
    my.is_remove_mode=true;
    my.editing_list = toInitialCapsCase(listName).trim(); 
    // the item whose id is the listname is the <section> for the list. 
    // find the button within this. 
    $("#"+ my.editing_list.toLowerCase() +" .edit-remove.button").addClass("selected");
    // store the list name so that entity clicks can be re-directed to the try_remove
  };
  /** callled when an entity is clicked in a list which is flagged for removal */
  my.try_remove_entity = function(e){ 
    if(my.editing_list===""){
      console.log("Error: no list flagged for removal."); return;
    }
    // send the edit command
    // e.g.: remove  signs  children  tachycardia
    var success = my.invoke_edit(
      "remove\t"+my.entityname+"\t"+my.editing_list+"\t"+e
    );
    my.end_remove_mode();
  }
  /** unhighlight the minus-buttons, and turn off the remove-mode flags.
   * Called after removing an item, or when clicking away to cancel.
   */
  my.end_remove_mode = function(){
    $(".edit.button").removeClass("selected"); // unselect all removal buttons
    my.editing_list=""; // clear the removal list
    my.is_remove_mode=false;
  }

  /** flag that tells us if any 'remove' button is selected. */
  my.is_remove_mode = false;
  /** if a list is being edited (e.g by add/remove buttons), then 
   * indicate which list by name.
   */
  my.editing_list = "";
  /** 
   * called when a synonym is edited inline using "contenteditable".
   * first validate the string, then replace the synonym. 
   */
  my.change_synonym = function(){
    // first establish the context: which item was edited?
    var idx  = this.closest("li").index();
    var text = this.html(); // value after editing
    if(idx<0 || idx>=my.entity.synonyms.length){
      console.log("error: synonym not in range");
    }
    var text = validate_entity_name(text);
    if(my.cache[text] !== undefined){ // is the new name already in use?
      // todo message - duplicate name
    }else{ // not in use: can replace.
      // send a remove command, with the old synonym, then an 'add' command, 
      // with the new name. Note this doesn't preserve the order.
      my.invoke_edit_and_log("remove\t"+my.entity.name+"\tSynonyms\t"+my.entity.synonyms[idx]);
      my.invoke_edit_and_log("add\t"   +my.entity.name+"\tSynonyms\t"+text);
    }
  };
  /** called when description changes */
  my.change_description = function(){
    var text = $("#description").html();
    if(text !== my.entity.Description){
      my.invoke_edit_and_log("edit\t"+my.entityname+"\tDescription\t\""+text+"\"")
    }
  };

  /**
   * Called when "i.list-move-button-up" or "-down" is clicked.
   * invokes an edit command 
   */
  my.edit_list_move = function(entity,listname,li,movement){
    my.invoke_edit_and_log("move\t"+my.entityname+"\t"+listname+"\t"+entity+"\t"+movement);
  };



  /**
   * Parses a command string and executes it, by calling "invoke_edit"
   * then if successful, send the edit to the server.
   */
  my.invoke_edit_and_log = function(cmd){
    var success = my.invoke_edit(cmd);
    if(success){ 
      console.log("cmd: "+cmd);
      my.append_edit_log(cmd);
      cmd = cmd.split("\t");
      // send cmd to edit server
      // editurl=edit_server
      //   +"?command=comment&verified=true&entity="+encodeURIComponent(my.entityname)
      //   +"&comment="+encodeURIComponent( cmd );
      editurl = my.edit_server  
          +"?command=" +cmd[0]
          +"&entity="  +encodeURIComponent(cmd[1])
          +"&section=" +encodeURIComponent(cmd[2])
          +"&listitem="+encodeURIComponent(cmd[3])
          +"&verified=true";
      console.log(editurl);
      // if we can't write the edit to the server, keep it for later.
      // this local function will be used as a callback.
      var fail_edit = function(editurl){
        my.unsent_edits.push(editurl);
        my.save_unsent_edits();
      }
      if(navigator.onLine){ // try and send the edit url.
        $.get(editurl, "text").done(function(response){
          if(response.includes("Thank you")){
            console.log("edit sent OK");
            // if it worked, then see if there are other cached
            // edits to send too?
            my.try_send_unsent_edits();
          }else{ // bad response from server:
            fail_edit(editurl);
            console.log(response);
            console.log("Server was unable to store edit")
          }
        }).fail(function(msg){ // send failed for some other reason
          fail_edit(editurl);
          console.log("Unable to send edit to server")
          console.log(msg);
        });
      }else{ //  we are in offline mode?
        fail_edit(editurl);
        console.log("Offline - edits cached.")
      } // end if successful edit
    }
    return success;
  }; // end function invoke_and_edit_log.
  /**
   *   Send any unsent edits, from localStorage.unsent_edits
   */
  my.try_send_unsent_edits = function(){
    // clear out any blanks that have accumulated
    my.unsent_edits = my.unsent_edits.filter( function(v){
      return v!=="";
    });
    // first take a copy of the list of edits: 
    var e = my.unsent_edits.slice(0);
    for(var i=0;i<e.length;i++){ // for each unsent edit
      var url = e[i]; // get the url from the copy of the list
      $.get(e[i]).done(function(response){
        console.log("sent previously unsent edit: "+url); 
        // now remove the edit from the unsent list!
        my.unsent_edits[i]=""; // but don't remove it completely
        // otherwise we might upset the index for future deletions!
        // (this asynchronous business is a complete pain)
        my.save_unsent_edits();
      }); 
    } // next unsent edit
  } 

  /** List of appropriate list names */
  my.listNames = ["Parents", "Children", "Causes","Effects","Treats","Treatments","Synonyms"];
  /** 
   * parses a command string to edit the data.
   * Updates the cache, and Returns true if successfully edited. 
   * understands 'add', 'remove' and 'edit' commands
   */
  my.invoke_edit = function(command){
    var cmd = command.split("\t").map( // get components of command
      function(x){return x.trim();}    // separated by tab, trim white space 
    );

    // should be [ "add/remove/set", entity_name, list_name, value ]
    var e = my.cache[cmd[1]];
    var success = false;
    if(e===undefined){ console.log("command: no entity error: "+command); return false; }
    if(cmd[0]==="remove"){ // remove an entity from a list
      var list = e[cmd[2]]; // get the list 
      // adding to a list which doesn't yet exist, but is valid?
      if(list===undefined){
        console.log("command: no list error: "+command); 
        return false; 
      }
      var rmv = list.indexOf(cmd[3]); // get the item in the list (assuming it's there)
      if(rmv<0){ 
        console.log("command: no item error: "+command); 
        return false; 
      }      
      list.splice(rmv,1); // remove it
      // now remove from the other entity?
      var e2=my.cache[cmd[3]]; // the other entity
      var inverse = my.getInverseRelation(cmd[2]);
      if(inverse!==undefined){ // if the inverse direction is valid,
        var list2 = e2[inverse]; // get the list for the other direction
        rmv = list2.indexOf(e.Name);
        if(rmv<0){ // check the item is there (it really should be)
          console.log("command: no item in reverse direction error: "+command);
          return false
        }
        list2.splice(rmv,1); // remove it 
        success = true; // only now have we successfully completed the removal.
      }
    }
    if(cmd[0]==="add"){ // add an entity to a list
      // if nothing to add, return
      if(cmd[3]===undefined || cmd[3].length==0){
        return false;
      }
      // ensure it's a valid list name
      if(my.listNames.indexOf(cmd[2])<0){ console.log("command: invalid list:: "+command); return false}
      var list = e[cmd[2]]; // get the list for adding to 
      if(list===undefined){ // entity doesn't have this list yet
        e[cmd[2]] = []; // make a blank list
        list = e[cmd[2]]; // use it for adding
        console.log("command: created list for: "+command);
      }
      var itm = my.cache[cmd[3]];  // double check item to be added exists (i.e. is in cache)
      if(itm===undefined){         // if it doesn't exist,
        if(cmd[2]=="Synonyms"){    // if adding a synonym, that's ok
          list.push(cmd[3]);       
          success =true;           // success!
        }else{                     // warn if not synonym and entity doesn't exist.
          console.log("warning: creating new entity: "+command); 
          // return false;         // should this be a fail condition?
          my.create_new_empty_entity(cmd[3]); // no: just create a new item
          itm = my.cache[cmd[3]];  // and use it as the add command's object
        }
      }
      if(!success){
        if(list.indexOf(cmd[3])>=0)  { // is it already in the list?
          console.log("command: redundant: "+command); return false; 
        }
        list.push(cmd[3]);   // add the item's name to the list
        // now do the 'reciprocal' add
        var inverse = my.getInverseRelation(cmd[2]);
        if(inverse!==undefined){
          var list2 = itm[inverse]; 
          if(list2===undefined){ // does the added item have the inverse list?
            itm[inverse] = []; // if not, make a blank list
            console.log("command: created inverse list for: "+command);
            list2 = itm[inverse];
          }
          if(list2.indexOf(cmd[1])>=0){ // is it alreadyd in the list?
            console.log("command: redundant inverse: "+command); 
          }
          list2.push(cmd[1]); // add the item's name to ths inverse list
        }
        success = true;
      } // end add
      // move item within list
      if(cmd[0]==="move"){
        var list = e[cmd[2]]; // get the list for adding to 
        if(list===undefined){
          console.log("command: no list error: "+command); 
          return false; 
        }
        if(cmd[3]===undefined || cmd[3].length==0){
          return false;
        }
        var idx = list.indexOf(cmd[3]);
        if(idx<0){ // check the item to be moved exists
          console.log("moving nonexisting item "+command);
          return false;
        }
        var movement = parseInt(cmd[4]);
        if(isNaN(movement) || movemnt===0){
          console.log("bad move number "+command);
          return false;
        }
        if(movement>0){
          var newlist = list.slice(0,idx).concat(
             list.slice(idx+1,idx+1+movement)).concat(
              [ cmd[3] ] ).concat(
              list.slice(idx+1+movement) );
        }else if(movement>0){
          var newlist = list.slice(0,idx+movement).concat(
            [ cmd[3] ] ).concat(
              list.slice(idx+movement, idx) ).concat(
              list.slice(idx+1));
        }
        e[cmd[2]] = list; // store the re-ordered list in the entity
      } // end move
    }
    if(cmd[0]==="edit"){ // set description command:
      if(cmd[2]==="Description"){
        txt = my.validate_description_text(cmd[3]);
        e.Description = txt;
        success = true;
      }
    }
    my.internal_navigate(my.entityname); // refresh display - don't push into history
    localStorage.cache = JSON.stringify(my.cache); // update the local storage
    return success; // edit successful
  };

  /** 
   * Check that a typed entity name is a valid name.
   * removes any non-alphanumeric characters.
   */
  my.validate_entity_name = function(str){
    return str.replace(/[^a-z0-9' ]/ig, '');
  }
  /** 
   * Check that a typed description is valid.
   * less stringent than entiy requirements, and allow newline and punctuation.
   * Don't allow double quotes though.
   */
  my.validate_description_text = function(str){
    return str.replace(/[^a-z0-9' ()[\]{}<>#~@;:?!/.,\n%^&*£$\-=+]/ig, '');
  }

  /**
   * called when selecting the community or stock versions of the app
   * ic: boolean - include community?
   */
  my.set_include_community = function(ic){
    my.include_community = ic;
    if(my.include_community){
      
      ///// ??  /////

    }else{
      my.read_server_edits();
    }
  };
  /**
   * Read a set of update-edits from the server, and implement the commands
   */
  my.read_server_edits = function(){
    /** Get previous comments about this item */
    $.ajax({ // read data from edit-server
      url: my.edit_server,
      success:function(data){ // when data arrives
        var oklines=0, badlines=0; // tally of edits
        var edits = data.split("\n"); // list of commands
        for(var i=0;i<edits.length;i++){  // for each line
          var line = edits[i];
          var fields=line.split("\t");
          if(fields.length<4){ // real fields need >2 parts
            continue; 
          }
          var cmd = fields[2].trim();
          if(cmd === "add" ||
             cmd === "remove" ||
             cmd === "description" ||
             cmd === "synonyms"  
          ){  // if it's a recognised edit,
            // trim of the first two fields, which are date and ip
            var trimmed = line.substring(nthIndex(line,"\t",2)+1);
            var success = my.invoke_edit(trimmed); // implement the edit.
            if(success){
              oklines++;   // keep count of how many edits worked
              // append this edit-command to the edit-log shown on screen
              my.append_edit_log(line); 
            }
            else{        badlines++; } // and failed
          }
        }
        // report success/failure in the comment
        $(".import-edits-comment").html("Imported: "+oklines+"; Failed: "+badlines);
        // report we are now using community version
        $(".reload-button span").html("Community version");
      }
    }); // end ajax comment    
  }
  /** add an edit to the list shown in the menu */
  my.append_edit_log = function(line){
    $(".edit-log").append("<li>"+ line +"</li>"); 
  };

  /************************************************
   *                 MISC FUNCTIONS               *
   */
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

  return my;
}

function asyncForEach(array, done, iterator) {
  var i = 0;
  next();
  function next(err) {
      if (err) {
          done(err);
      }
      else if (i >= array.length) {
          done();
      }
      else if (i < array.length) {
          var item = array[i++];
          setTimeout(function() {
              iterator(item, i - 1, next);
          }, 0);
      }
  }
};
/** called once all items loaded into my.cache */
function ensure_first_entity_loaded(){
  if($("#entityname").html() !== my.entityname){
    navigateto(my.entityname);
    console.log('entity didnt load in time');
  }
}
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}
/** Converts a string so that only the initial characetre is upper case */
function toInitialCapsCase(str){
  return str.charAt(0).toUpperCase()+str.substring(1).toLowerCase();
}
/** search a string and return the index of where it occurs the nth time */
function nthIndex(str, pat, n){
  var L= str.length, i= -1;
  while(n-- && i++<L){
      i= str.indexOf(pat, i);
      if (i < 0) break;
  }
  return i;
}


var medicine = MedicineReader();
// callback function that is requested externally by the HTML
var navigateto = medicine.navigateto;
var menu_navigateto = medicine.menu_navigateto;
var dosearch = medicine.dosearch;
var submit_comment = medicine.submit_comment;
var select_entity_dialog_done = medicine.select_entity_dialog_done;