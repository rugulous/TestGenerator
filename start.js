//clears the content (duh) - resets the extension popup
function clearContent(){
	tbl = null;
	cont.innerHTML = "";
}

//creates the copy link at the top of the window
function createCopy(){
	let copy = document.createElement("a");
	copy.innerHTML = "Copy Table";
	copy.style.color = "#FFF";
	copy.style.cursor = "pointer";
	copy.style.textDecoration = "underline";
	copy.style.fontFamily = "Arial";
	cont.appendChild(copy);
	
	return copy;
}

//creates the initial table and header
function createTestTable(){
	tbl = document.createElement("table");
	tbl.className = "slot";
	tbl.style.borderCollapse = "collapse";
	tbl.style.fontFamily = "Arial, Verdana, sans-serif";
		
	let row = document.createElement("tr");
	testCols.forEach(function(c){
		let header = document.createElement("th");
		header.style.border = "1px solid #000";
		header.style.backgroundColor = "rgb(197, 224, 179)";
		header.style.color = "#000";
		header.style.fontWeight = "bold";
		header.style.fontSize = "14pt";
		header.innerHTML = c;
		row.appendChild(header);
	});
		
	tbl.appendChild(row);
		
	cont.appendChild(tbl);
}

//copies our test table to the clipboard, ready for pasting to Word etc
function copyTableToClipboard(e){
	//FF does not yet support clipboard :(
	let sel = window.getSelection();
	sel.removeAllRanges();

	let r = new Range();
	r.selectNode(tbl);
			
	sel.addRange(r);		
	document.execCommand("copy");
	sel.removeAllRanges();
}

//converts an element from the actual page (passed as a HTML string) into a real element
function createPageElement(html, style){
	if(html.indexOf("body") > -1){
		return document.createElement("div");
	}
	
	let el = document.createElement("div");
	el.innerHTML = html;
	el = el.firstChild;
	
	el.style.cssText = style;
	
	el.style.display = "block";
	el.style.marginLeft = "auto";
	el.style.marginRight = "auto";
	el.style.marginTop = "5px";
	el.style.marginBottom = "5px";
	el.style.maxWidth = "680px";
	el.textAlign = "center";	
	el.disabled = true;
	
	return el;
}

//converts an array of steps into a <ol> of steps
function getSteps(stepList, page){
	let steps = "<ol><li>Go to <a href='" + page.link + "'>" + page.title + "</a></li>";
	stepList.forEach(function(s){
		steps += "<li>" + s + "</li>";
	});
	steps += "</ol>";
	
	return steps;
}

//create each row in our table
function generateColsForTest(id, scenario, steps, data, expected){
	let row = document.createElement("tr");
	let cols = [];
	testCols.forEach(function(c){
		let col = document.createElement("td");
		col.style.border = "1px solid #000";
		col.style.fontSize = "11pt";
		col.style.fontFamily = "Arial";
		cols.push(col);
	});
		
	cols[0].innerHTML = id;
	cols[1].innerHTML = scenario;
	cols[2].innerHTML = steps;
	cols[3].innerHTML = data;
	cols[4].innerHTML = expected;
		
	cols.forEach(function(c){
		row.appendChild(c);
	});
		
	tbl.appendChild(row);
}

//renders the tests passed from the test script
function genTest(message){
	if(tbl == null){
		let copy = createCopy();
		createTestTable();
		
		copy.addEventListener("click", copyTableToClipboard);
	}
	
	let slot = document.createElement("div");
	slot.className = "slot";
	
	let el = createPageElement(message.el, message.style);
	slot.appendChild(el);
	
	let title = document.createElement("h1");
	title.value = message.name;
	
	slot.appendChild(title);
	
	message.tests.forEach(function(t){
		let p = document.createElement("p");
		p.innerHTML = t.scenario;
		slot.appendChild(p);
		
		let steps = getSteps(t.steps, message.page);
		
		generateColsForTest(testID, t.scenario, steps, t.data, t.expected);
		
		testID++;
	});
	
	cont.appendChild(slot);
}

//globals (nice)
let cont = document.getElementById("content");
let tbl = null;
let testID = 1;
//columns for our table
let testCols = ["Test Case ID", "Test Scenario", "Test Steps", "Test Data", "Expected Results", "Actual Results", "Pass/Fail", "Notes (optional)"];

let sendMsg = null;

//check if we're chrome or firefox
if(typeof browser === "undefined"){
	chrome.tabs.executeScript({
		file: "doTests.js"
	});
	
	//send a message to the test script
	sendMsg = function(message){
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
			chrome.tabs.sendMessage(tabs[0].id, {
				command: message
			});
		});
	}
	
	//render tests as they are passed to us
	chrome.runtime.onMessage.addListener((message, sender, response) => {
		genTest(message);
	});
} else {
	//inject our test script into the active tab, ready for execution
	browser.tabs.executeScript({
		file: "doTests.js"
	});
	
	//send a message to the test script
	sendMsg = function(message){
		browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
			browser.tabs.sendMessage(tabs[0].id, {
				command: message
			});
		});
	}
	
	//render tests as they are passed to us
	browser.runtime.onMessage.addListener((message, sender, response) => {
		genTest(message);
	});
}

//generate the tests as soon as the popup is opened
clearContent();
sendMsg("test");