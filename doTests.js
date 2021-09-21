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
	
		//returns an array containing the tests for the given element
		getTests(el){
			let tests = [];
				
				if(this._opts.hasOwnProperty("single") && this._opts.single && this._run){
					return [];
				}
				
				let name = getElName(el);
				
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
				
				this._run = true;

			return tests;
		}
		
		//generic tests for all elements (returns array)
		getElTests(name, el){
			let tests = [];
			let style = window.getComputedStyle(el);
			
			if(style.display == "none" || style.visibility == "hidden"){
				tests.push("Does " + name + " show and hide correctly?");
			}
			
			return tests;
		}
	}

	//get a "friendly" name for the element
	//tries to get the following:
	//1. Label text (from an associated <label />)
	//2. Placeholder text
	//3. Default value
	//4. Fallback to unknown
	function getElName(el){
		let unknown = "<unnamed field>";
		
		if(!el.labels){
			return unknown;
		}
		
		return (el.labels.length > 0 ? el.labels[0].innerHTML : ((el.placeholder && el.placeholder != "") ? el.placeholder : (el.value.trim() != "" ? el.value : unknown)));
	}
	
	/*** 
	**** BEGIN TEST GENERATION 
	***/
	function checkTextBox(name, el){	
		return [
		{
			scenario: `Does the user have to enter ${name}?`,
			data: `${name} = ""`,
			steps: [`Ensure ${name} is empty`, `Try to submit the page`],
			expected: `An error message should be displayed prompting the user to enter ${name}`
		},
		{
			scenario: `Can the ${name} be whitespace?`,
			data: `${name} = " "`,
			steps: [`Enter ${name}`, "Try to submit the page"],
			expected: `An error message should be displayed prompting the user to enter ${name}`
		},
		{
			scenario: `Can the ${name} be a lot of whitespace?`,
			data: `${name} = "        "`,
			steps: [`Enter ${name}`, "Try to submit the page"],
			expected: `An error message should be displayed prompting the user to enter ${name}`
		}
		];
	}
	
	function checkDate(name, el){
		let today = new Date();
		
		
		return checkTextBox(name, el).concat([
		{
			scenario: `Can the ${name} be more than 100 years ago?`,
			data: `${name} = "01/01/${(today.getFullYear() - 101)}"`,
			steps: [`Enter ${name}`, "Try to submit the page"],
			expected: `An error message should be displayed prompting the user to enter a valid ${name}`
		},
		{
			scenario: `Can the ${name} be in the future?`,
			data: `${name} = "01/01/${(today.getFullYear() + 1)}"`,
			steps: [`Enter ${name}`, "Try to submit the page"],
			expected: `An error message should be displayed prompting the user to enter a valid ${name}`
		}
		]);
	}
	
	function checkEmail(name, el){
		return checkTextBox(name, el).concat([
		{
			scenario: `Can the ${name} be an invalid email address? (No @)`,
			data: `${name} = "aaazzz"`,
			steps: [`Enter ${name}`, "Try to submit the page"],
			expected: `An error message should be displayed prompting the user to enter a valid ${name}`
		},
		{
			scenario: `Can the ${name} be an invalid email address? (Too many @s)`,
			data: `${name} = "test@test@test@burycollege.ac.uk"`,
			steps: [`Enter ${name}`, "Try to submit the page"],
			expected: `An error message should be displayed prompting the user to enter a valid ${name}`
		},
		{
			scenario: `Can the ${name} be an invalid email address? (Double . after @)`,
			data: `${name} = "test@burycollege..ac..uk"`,
			steps: [`Enter ${name}`, "Try to submit the page"],
			expected: `An error message should be displayed prompting the user to enter a valid ${name}`
		}
		]);
	}
	
	function checkSelect(name, el){
		let d = el.childNodes[0].innerHTML;
		
		return [
		{
			scenario: `Does ${name} have to be selected?`,
			data: `${name} = "${d}"`,
			steps: [`Set ${name}`, "Try to submit the page"],
			expected: `An error message should be displayed prompting the user to select a valid ${name}`
		}
		];
	}
	
	function checkSubmit(name, el){
		return [
		{
			scenario: "Can the user submit the form without entering any details?",
			data: "",
			steps: ["Ensure all fields are left blank","Try to submit the page"],
			expected: "An error message should be displayed prompting the user to enter their details"
		}
		];
	}
	
	function checkScripts(name, el){
		return [
		{
			scenario: "Does the page function without JavaScript?",
			data: "",
			steps: ["Open Developer Tools (F12)", "Disable JavaScript", "Try to use the page"],
			expected: "Either: <br />The page functions without JavaScript<br />-- OR --<br />An error message is displayed prompting the user to enable JavaScript"
		}
		];
	}
	
	function checkBody(name, el){
		return [
		{
			scenario: "Is the page accessible?",
			data: "",
			steps: ["Open Developer Tools (F12)", "Go to the Accessibility tab (Lighthouse on Chrome)", "Run an accessibility audit"],
			expected: "There are no issues found"
		}
		];
	}
	
	/*** 
	**** END TEST GENERATION 
	***/
	
	//send tests and the element back to the main extension
	function displayTests(tests, el){
		//style the el in the extension so it looks like it does on the actual page
		const styles = window.getComputedStyle(el);
		let cssText = Array.from(styles).reduce((css, property) => `${css}${property}:${styles.getPropertyValue(property)};`);
		
		let html = (el.tagName.toLowerCase() == "script" ? "<p style='color: #FFF; text-align: center;'>JS</p>" : el.outerHTML);
		
		let data = {
				tests: tests,
				el: html,
				style: cssText,
				name: getElName(el),
				page: {
					title: document.title,
					link: window.location.href
				}
		};
		
		if(typeof browser === "undefined"){
			chrome.runtime.sendMessage(data);
		} else {
			browser.runtime.sendMessage(data);
		}
	}

	//add new tests here :)
	let tags = [
		new Test("button:not([type=button])", ["input[type=submit]"], checkSubmit),
		new Test("textarea", ["input[type=text]", "input[type=password]"], checkTextBox),
		new Test("input[type=email]", [], checkEmail),
		new Test("input[type=date]", [], checkDate),
		new Test("select", ["input[type=radio]"], checkSelect),
		new Test("script", [], checkScripts, {single: true, runBase: false}),
		new Test("body", [], checkBody)
	];
	
	//basic idea:
	//loop through every element on the page
	//check if it matches the selector for any of the tests
	//if it matches, add tests for that element to an array
	//pass that array and the element back to the main extension
	function run(){
		document.querySelectorAll("*").forEach(function(el){
			let tests = [];
			tags.forEach(function(t){
				if(el.matches(t.selector)){
					
					let _tests = t.getTests(el);
					tests = tests.concat(_tests);
				
				}
			});
		
			if(tests.length > 0){
				displayTests(tests, el);
			}
		});		
	}
	
	if(typeof browser === "undefined"){
		chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
			if(message.command == "test"){
				run();
			}
		});
	} else {
		browser.runtime.onMessage.addListener(message => {
			if(message.command == "test"){
				run();
			}
		});
	}
})();