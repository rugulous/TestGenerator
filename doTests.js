/*jshint esversion: 6 */

(function(){
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
				tests.push("Does " + name + " show and hide correctly?");
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
	
	
	function checkTextBox(name, el){	
		return [
		{
			scenario: "Does the user have to enter " + name + "?",
			data: name + ' = ""',
			steps: ["Ensure " + name + " is empty", "Try to submit the page"],
			expected: "An error message should be displayed prompting the user to enter " + name
		},
		{
			scenario: "Can the " + name + " be whitespace?",
			data: name + ' = " "',
			steps: ["Enter " + name, "Try to submit the page"],
			expected: "An error message should be displayed prompting the user to enter " + name
		},
		{
			scenario: "Can the " + name + " be a lot of whitespace?",
			data: name + ' = "        "',
			steps: ["Enter " + name, "Try to submit the page"],
			expected: "An error message should be displayed prompting the user to enter " + name
		}
		];
	}
	
	function checkDate(name, el){
		let today = new Date();
		
		
		return checkTextBox(name, el).concat([
		{
			scenario: "Can the " + name + " be more than 100 years ago?",
			data: name + ' = "01/01/' + (today.getFullYear() - 101) + '"',
			steps: ["Enter " + name, "Try to submit the page"],
			expected: "An error message should be displayed prompting the user to enter a valid " + name
		},
		{
			scenario: "Can the " + name + " be in the future?",
			data: name + ' = "01/01/' + (today.getFullYear() + 1) + '"',
			steps: ["Enter " + name, "Try to submit the page"],
			expected: "An error message should be displayed prompting the user to enter a valid " + name
		}
		]);
	}
	
	function checkSelect(name, el){
		let d = el.childNodes[0].innerHTML;
		
		return [
		{
			scenario: "Does " + name + " have to be selected?",
			data: name + ' = "' + d + '"',
			steps: ["Set " + name + " to " + d, "Try to submit the page"],
			expected: "An error message should be displayed prompting the user to select a valid " + name
		}
		]
	}
	
	function checkSubmit(name, el){
		return [
		{
			scenario: "Can the user submit the form without entering any details?",
			data: "",
			steps: ["Ensure all fields are left blank","Try to submit the page"],
			expected: "An error message should be displayed prompting the user to enter their details"
		}
		]
	}
	
	function checkScripts(name, el){
		return [
		{
			scenario: "Does the page function without JavaScript?",
			data: "",
			steps: ["Open Developer Tools (F12)", "Disable JavaScript", "Try to use the page"],
			expected: "Either: <br />The page functions without JavaScript<br />-- OR --<br />An error message is displayed prompting the user to enable JavaScript"
		}
		]
	}
	
	browser.runtime.onMessage.addListener(message => {
		if(message.command == "test"){
			run();
		}
	})
	
	function displayTests(tests, el){
		const styles = window.getComputedStyle(el);
		let cssText = Array.from(styles).reduce((css, property) => `${css}${property}:${styles.getPropertyValue(property)};`);
		
		let html = (el.tagName.toLowerCase() == "script" ? "<p style='color: #FFF; text-align: center;'>JS</p>" : el.outerHTML);
		
		browser.runtime.sendMessage({
				tests: tests,
				el: html,
				style: cssText,
				name: tester_getElName(el),
				page: {
					title: document.title,
					link: window.location.href
				}
		});
	}

	let tags = [
		new Test("button:not([type=button])", ["input[type=submit]"], checkSubmit),
		new Test("textarea", ["input[type=text]", "input[type=password]"], checkTextBox),
		new Test("input[type=date]", [], checkDate),
		new Test("select", ["input[type=radio]"], checkSelect),
		new Test("script", [], checkScripts, {single: true, runBase: false})
	];
	
	function run(){

		console.log("STARTING");
	
	
		document.querySelectorAll("*").forEach(function(el){
			let tests = [];
			tags.forEach(function(t){
				if(el.matches(t.selector)){
					
					let _tests = t.getTests(el);
					tests = tests.concat(_tests);
				
					//tests = tests.concat(t.getTests(el));
				}
			});
		
			if(tests.length > 0){
				displayTests(tests, el);
			}
		});
		
	}
})();