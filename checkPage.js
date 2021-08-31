(function(){
	browser.runtime.onMessage.addListener(message => {
		if(message.command == "check"){
			run();
		}
	})
	
	function run(){
		alert("3");
	}
})();