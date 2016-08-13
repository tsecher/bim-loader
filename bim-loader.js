/**
 * 
 */
BimLoaderObject = function()
{
	var self = this;
	self.templates = {
		default : {content:"<div class='default-loader'><div>...</div></div>"}
	};
	self.loaders	 = {};
	self.timeout 	 = null;
	self.defaultTemplateName = "default";
	self.defaultOptions = {
		template: self.defaultTemplateName,
		timeout: 10000,
		parent: document.getElementsByTagName('body')[0],
		onStart: null,
		onDisplay: null,
		onStop: null,
		onRemove: null,
		onTimeout: null
	};

	self.PREFIX = "data-bl-";


	/**
	 * Set and load the default template
	 */
	self.setDefaultTemplate = function( path )
	{
		self.loadTemplate( self.defaultTemplateName , path );
	}

	/**
	 * Set default template content
	 */
	self.setDefaultTemplateContent = function( content )
	{
		self.setTemplateContent( self.defaultTemplateName , content );
	}


	/**
	 * Load the template content
	 *
	 * @param  {string} name Template name
	 * @param  {string} path Template path
	 *
	 * @return void
	 */
	self.loadTemplate = function( name , path )
	{
		self.templates[ name ] = {
			name: name, 
			isLoading: true,
			path: path
		}

		// get all the templates using path and already loaded: 
		var alreadyUsingPathTemplates = getTemplateByPath( path , true );
		if( alreadyUsingPathTemplates[0] ){
			self.templateName[ name ].content = alreadyUsingPathTemplates[0].content;
		}
		else{
			// load template content
			getTemplateContent( 
				path , 
				function( content ){
					var alreadyUsingPathTemplates = getTemplateByPath( path , false );
					for( var templateName in getTemplateByPath( path ) ){
						self.templates[ templateName ].isLoading = false;

						var contents = getContents( content );
						self.templates[ templateName ].content = contents.content;
						self.templates[ templateName ].options = contents.options;


					}
				} , 
				function( content ){
					console.log( "BimLoader Error :" , "template " + name + " not found at " + path );
				});
		}
	}


	/**
	 * Display Loader template on start of waiting time : 
	 *
	 * @param  {Object} options List of options
	 *
	 * @return {void}
	 */
	self.start = function( options )
	{
		// initialising options :
		var opt = {};

		// default : 
		for( var optName in self.defaultOptions ){
			opt[ optName ] = self.defaultOptions[optName];
		}

		// template options 
		var templateOptions = false;
		if( options.template && self.templates[ options.template ] && self.templates[ options.template ].options ){
			templateOptions = self.templates[ options.template ].options;
		}
		else if( self.templates[ self.defaultOptions.template ].options ){
			templateOptions = self.templates[ self.defaultOptions.template ].options
		}
		if( templateOptions ){

			for( var optName in self.defaultOptions ){
				opt[ optName ] = templateOptions[optName] ? templateOptions[optName] : opt[optName];
			}
		}

		// specifi options : 
		for( var optName in self.defaultOptions ){
			opt[ optName ] = options[optName] ? options[optName] : opt[optName];
		}

		// chek if parent exists : 
		if( !options.parent ){
			console.log( "BimLoader Error :" , "No parent found, using default(<body>) instead" );
		}
		// check if template exists
		if( !self.templates[ opt.template ] ){
			console.log( "BimLoader Error :" , "No template \"" + opt.template + "\" found, using default instead" );
			opt.template = self.defaultTemplateName;
		}
		if( self.templates[ opt.template ].isLoading ){
			console.log( "BimLoader Error :" , "Template \"" + opt.template + "\" is not loaded yet, using default instead" );
			opt.template = self.defaultTemplateName;
		}


		// onStart callback
		if( isFunction( opt.onStart ) ){
			if ( opt.onStart.call( this , opt.parent , opt ) ){
				// stop Process
				return;
			}
		}

		parentId = getParentId( opt.parent );

		// Reinitialising already existing loaders in parent : 
		if( existingParent = self.loaders[ parentId ] ){
			window.clearTimeout( existingParent.timer );
		}
		else{
			self.loaders[ parentId ] = {};
			for( var optName in opt ){
				self.loaders[ parentId ][ optName ] = opt[ optName ];
			}

			// add content with identifier
			var loaderContent = document.createElement( "div" );
			// is dom element : 
			if( "object" == typeof self.templates[ opt.template ].content ){
				loaderContent.innerHTML = getHTML( self.templates[ opt.template ].content );
			}
			// is string with dom : 
			else if( self.templates[ opt.template ].content.trim()[0] == "<"){
				loaderContent.innerHTML = self.templates[ opt.template ].content;
			}
			// is string only : 
			else {
				loaderContent.innerHTML = "<div>" + self.templates[ opt.template ].content + "</div>";
			}

			while ( loaderContent.children.length > 0 ){
				loaderContent.children[0].setAttribute( self.PREFIX + 'loader-element' , 'true' );
				opt.parent.appendChild( loaderContent.children[0] );			
			}
			loaderContent = null;

			// onDisplay callback
			if( isFunction( opt.onDisplay ) ){
				opt.onDisplay.call( this , opt.parent  , opt );
			}
		}

		// add data : 
		setLoaderCount( opt.parent , getLoaderCount( opt.parent ) + 1 );
			
		// launching new timeout
		self.loaders[ parentId ].timer = setTimeout( function(){ lastStop( opt.parent , true ); } , opt.timeout );
	}


	/**
	 * Remove Loader template when response is coming
	 *
	 * @param  {object} parent Container of loader element
	 *
	 * @return {void}        
	 */
	self.stop = function( parent ){
		if( !( parent && parent.hasAttribute( self.PREFIX + "nb-loader" ) ) ){
			parent = self.defaultOptions.parent;
		}

		var parentId = getParentId( parent );
		if( self.loaders[ parentId ] ){
			setLoaderCount( parent , getLoaderCount( parent ) - 1 );
			if( getLoaderCount(parent) == 0 ){
				lastStop( parent );
			}
		}
	}


	/**
	 * Remove Loader template at the end of all waiting time for parent
	 *
	 * @param  {[type]}  parent    Container of loader element
	 * @param  {Boolean} isTimeout Called from timeout
	 *
	 * @return {void}            
	 */
	function lastStop( parent , isTimeout )
	{
		if( !( parent && parent.hasAttribute( self.PREFIX + "nb-loader" ) ) ){
			parent = self.defaultOptions.parent;
		}

		parentId = getParentId( parent );

		window.clearTimeout( self.loaders[parentId].timer );

		// timeout action : 
		if( isTimeout ){
			console.log( "BimLoader Error : " , "Timeout" );
			// onTimeout Callback :
			if (isFunction( self.loaders[parentId].onTimeout ) ){
				self.loaders[parentId].onTimeout.call( this , parent , self.loaders[parentId] );
			}
		}

		setLoaderCount( parent , 0 );

		// onStop Callback :
		var stopProcess = false;
		if (isFunction( self.loaders[parentId].onStop ) ){
			stopProcess = self.loaders[parentId].onStop.call( this , parent , self.loaders[parentId] );
		}
		
		console.log( "stopProcess" , stopProcess );
		if( !stopProcess ){
			self.removeLoaderElements( parent );
		}
	}

	/**
	 * Remove Loader Elements and initialise parent
	 *
	 * @param  {[type]} parent Container of loader element
	 *
	 * @return {void}        
	 */
	self.removeLoaderElements = function( parent )
	{
		console.log( "removeLoaderElements" );
		// delete elements :
		var loaderElements = self.getLoaderElements( parent );
		for( var i in loaderElements ){
			loaderElements[i].remove();
		}

		var parentId = getParentId( parent );

		// onRemove Callback :
		if (isFunction( self.loaders[parentId].onRemove ) ){
			self.loaders[parentId].onRemove.call( this , parent , self.loaders[parentId] );
		}

		self.loaders[ parentId ] = null;
	}


	/**
	 * Return the loader element of a parent
	 *
	 * @param  {[type]} parent Container of loader element
	 *
	 * @return {array}        List of loader elements
	 */
	self.getLoaderElements = function( parent )
	{
		var elements = [];
		for( var i = parent.children.length-1 ; i>=0 ; i-- ){
			if( parent.children[i].getAttribute( self.PREFIX + "loader-element" ) == 'true' ){
				elements.push( parent.children[i] );
			}
		}
		return elements;
	}


	/**
	 * Dispatch an event when BimLoaderObject is ready
	 *
	 * @return {[type]} [description]
	 */
	self.init = function(){
		document.dispatchEvent( new Event('BimLoaderReady') );
	}


	/**
	 * Set the default options
	 *
	 * @param {array} options list of options
	 */
	self.setDefaultOptions = function( options )
	{
		for( var optName in self.defaultOptions ){
			self.defaultOptions[ optName ] = options[optName] ? options[optName] : self.defaultOptions[optName];
		}
	}


	/**
	 * Set the content of a template without loading a template
	 *
	 * @param {string} name    Template name
	 * @param {string} content Template content
	 */
	self.setTemplateContent = function( name , content )
	{
		if( self.templates[ name ] ){
			self.templates[ name ].content = content;
		}
		else{
			self.templates[ name ] = {
				name: name, 
				path: content,
				content: content
			}
		}
	}


	/**
	 * Returns the HTML of a DOMELement
	 * 
	 * @param  {DOMELement} element Object
	 *
	 * @return {string}        
	 */
	function getHTML( element ){
		if(!element || !element.tagName) return '';
	    var tmp = document.createElement("div");
	    tmp.appendChild(element);
	    txt = tmp.innerHTML;
	    tmp = null;
	    return txt;
	}


	/**
	 * Returns the number of waiting action for a parent 
	 *
	 * @param  {object} parent Container of loader element
	 *
	 * @return {int}
	 */
	function getLoaderCount( parent )
	{
		count = parseInt( parent.getAttribute( self.PREFIX + "nb-loader" ) );
		return isNaN( count ) ? 0 : count;
	}


	/**
	 * Set the number of waiting action for a parent
	 *
	 * @param {[type]} parent Container of loader element
	 * @param {[type]} count  number of action
	 */
	function setLoaderCount( parent , count )
	{
		parent.setAttribute( self.PREFIX + "nb-loader"  , count );
	}


	/**
	 * Get All templates Data 
	 *
	 * @param  {string} path Path template
	 * @param  {boolean} path Return only loaded templates
	 *
	 * @return {array}      List of templates using path
	 */
	function getTemplateByPath( path , onlyLoaded )
	{
		var resultTemplates = [];
		if( path ){
			for(var templateName in self.templates ){
				if( self.templates[ templateName ].path == path
					&& !onlyLoaded || (onlyLoaded && !self.templates[ templateName ].isLoading ) ){
					resultTemplates[ templateName ] = self.templates[ templateName ];
				}
			}
		}
		return resultTemplates;
	}


	/**
	 * Load tempalte content
	 *
	 * @param  {string} path            Path of template
	 * @param  {function} successCallback Callback on success
	 * @param  {function} errorCallback   Callback on error
	 *
	 * @return {void}                 
	 */
	function getTemplateContent( path , successCallback , errorCallback )
	{
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
	    	if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
				if (xmlhttp.status == 200) {
					if( isFunction( successCallback ) ){
						successCallback.call( this , xmlhttp.responseText );
					}
				}
				else {
					if( isFunction( errorCallback ) ){
						errorCallback.call( this , xmlhttp.responseText );
					}	
				}
			}
		};
		xmlhttp.open("GET", path , true);
		xmlhttp.send();
	}



	/**
	 * Check if the element parameters can be called
	 *
	 * @param  ?  element 
	 *
	 * @return {Boolean}
	 */
	function isFunction( element )
	{
		return "function" == typeof( element );
	}

	function getParentId( parent )
	{
		if( parent.hasAttribute( self.PREFIX+"id" ) ){
			return parent.getAttribute( self.PREFIX+"id" );
		}
		else{
			pId = "p_"+Math.round(Math.random()*(100000))
			parent.setAttribute( self.PREFIX+"id" , pId );
			return pId;
		}
	}


	function getContents( content )
	{
		var data={};
		var element = document.createElement( "div" );
		element.innerHTML = content;

		var script = "";
		var scripts = element.getElementsByTagName("script");
		for ( var i in scripts ){
			if( scripts[i].innerHTML ){
				script += "\r\n//----\r\n" + scripts[i].innerHTML;
			}
			if( isFunction( scripts[i].remove ) ){
				scripts[i].remove();
			}
		}

		templateOptions = null;
		if( script ){
			eval( script );
			data.options = templateOptions;
		}
		data.content = element.innerHTML;
		return data;
	}
}
BimLoader = new BimLoaderObject();
BimLoader.init();