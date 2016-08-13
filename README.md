# bim-loader
Simply add beautiful and customizable loader for async tasks 

## Install
1. Download project from Github
2. Link the default css: 
	```<link rel="stylesheet" href="./bim-loader/style.css"/>```
3. Add script to your html page
	```<script type="text/javascript" src="./bim-loader/bim-loader.min.js"></script>```
4. Call BimLoader.start() when launching a timed action
	```<script type="text/javascript">
		<!--
		// loading a long timed action : 
		$("#button").click( function(){
			BimLoader.start();
			$.get( "./get-a-long-timed-action" );
		});
		-->
	</script>```
5. Call BimLoader.stop() when receiving response. If the request is failing and no response is coming, there's a timeout which is automatically called.
	```<script type="text/javascript">
		<!--
		// loading a long timed action : 
		$("#button").click( function(){
			BimLoader.start();
			$.get( "./get-a-long-timed-action" , 
				{},
				function(){
					// on response;
					BimLoader.stop();
					$("#button").html( 'Content is loaded' );
				}
			);
		});
		-->
	</script>```							
6. And... that's all.
7. Just test it, and use different beautiful templates, or add your own ;)

## Documentation : 
See more documentation on [thomas-secher.fr/bim-loader](http://thomas-secher.fr/bim-loader)