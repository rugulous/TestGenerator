/*browser.tabs.executeScript({
	file: "lib.js"
});*/

browser.tabs.executeScript({
	file: "checkPage.js"
});

browser.tabs.executeScript({
	file: "doTests.js"
});

function sendMsg(message){
	browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
		browser.tabs.sendMessage(tabs[0].id, {
			command: message
		});
	});
}

let cont = document.getElementById("content");
let tbl = null;
let testID = 1;
let testCols = ["Test Case ID", "Test Scenario", "Test Steps", "Test Data", "Expected Results", "Actual Results", "Pass/Fail", "Notes (optional)"];

function clearContent(){
	tbl = null;
	cont.innerHTML = "";
}

function genTest(message){
	if(tbl == null){
		tbl = document.createElement("table");
		tbl.className = "slot";
		
		let row = document.createElement("tr");
		testCols.forEach(function(c){
			let header = document.createElement("th");
			header.innerHTML = c;
			row.appendChild(header);
		});
		
		tbl.appendChild(row);
		
		cont.appendChild(tbl);
	}
	
	let slot = document.createElement("div");
	slot.className = "slot";
	
	let el = document.createElement("div");
	el.innerHTML = message.el;
	el = el.firstChild;
	
	el.style.cssText = message.style;
	
	el.style.display = "block";
	el.style.marginLeft = "auto";
	el.style.marginRight = "auto";
	el.style.marginTop = "5px";
	el.style.marginBottom = "5px";
	el.style.maxWidth = "680px";
	el.textAlign = "center";	
	el.disabled = true;
	
	slot.appendChild(el);
	
	let title = document.createElement("h1");
	title.type = "text"
	title.value = message.name;
	
	slot.appendChild(title);
	
	message.tests.forEach(function(t){
		let p = document.createElement("p");
		p.innerHTML = t.scenario;
		slot.appendChild(p);
		
		let row = document.createElement("tr");
		let cols = [];
		testCols.forEach(function(c){
			cols.push(document.createElement("td"));
		});
		
		let steps = "<ol><li>Go to <a href='" + message.page.link + "'>" + message.page.title + "</a></li>";
		t.steps.forEach(function(s){
			steps += "<li>" + s + "</li>";
		});
		steps += "</ol>";
		
		cols[0].innerHTML = testID;
		cols[1].innerHTML = t.scenario;
		cols[2].innerHTML = steps;
		cols[3].innerHTML = t.data;
		cols[4].innerHTML = t.expected;
		
		cols.forEach(function(c){
			row.appendChild(c);
		});
		
		tbl.appendChild(row);
		
		testID++;
	});
	
	cont.appendChild(slot);
}

document.getElementById("check").addEventListener("click",(e) => {
	clearContent();
	sendMsg("check");
});

document.getElementById("test").addEventListener("click",(e) => {
	clearContent();
	sendMsg("test")
});

browser.runtime.onMessage.addListener((message, sender, response) => {
	console.log(message);
	
	genTest(message);
});