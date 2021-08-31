
	class Test {
		constructor(tag, perms, tests, opts = {}){
			this.tagName = tag;
			this.permutations = perms;
			this._getTests = tests;
			this._opts = opts;
			this._run = false;
			
			let selector = this.tagName + ",";
			this.permutations.forEach(function(p){
				selector += p + ",";
			});
			this.selector = selector.substring(0, selector.length - 1);
		}
	
		getAll() {
			return document.querySelectorAll(this.selector);
		}
	
		highlight(){
			let els = this.getAll();
			els.forEach(function(e){
				e.style.border = "solid 3px #F00";
			});
		}
	
		getTests(el){
			let tests = [];
			//let els = this.getAll();
		
			//this doesn't work in .forEach :(
			//for(let i = 0; i < els.length; i++){
				
				if(this._opts.hasOwnProperty("single") && this._opts.single && this._run){
					console.log("Single test has already run!")
					return [];
				}
				
				//let el = els[i];
				//let _tests = [];
				
				let name = tester_getElName(el);
				
				if(!this._opts.hasOwnProperty("runBase") || this._opts.runBase){
					try{
						tests = tests.concat(this.getElTests(name, el));
					} catch (ex){
						console.log("Failed to get base tests");
						console.log(ex);
					}
				}
				
				try{
					tests = tests.concat(this._getTests(name, el));				
				} catch(ex){
					console.log("Failed to get tests");
					console.log(ex);
				}
				//tests = tests.concat([[el, _tests]]);
				
				this._run = true;
			//}
		
			return tests;
		}
		
		getElTests(name, el){
			let tests = [];
			let style = window.getComputedStyle(el);
			
			if(style.display == "none" || style.visibility == "hidden"){
				tests.push("Does the " + name + " show and hide correctly?");
			}
			
			return tests;
		}
	}

	function tester_getElName(el){
		let unknown = "<unnamed field>";
		
		if(!el.labels){
			return unknown;
		}
		
		return (el.labels.length > 0 ? el.labels[0].innerHTML : ((el.placeholder && el.placeholder != "") ? el.placeholder : (el.value.trim() != "" ? el.value : unknown)));
	}