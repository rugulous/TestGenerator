/*browser.tabs.executeScript({
	file: "lib.js"
});

browser.tabs.executeScript({
	file: "checkPage.js"
});*/

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
		let copy = document.createElement("a");
		copy.innerHTML = "Copy Table";
		copy.style.color = "#FFF";
		copy.style.cursor = "pointer";
		copy.style.textDecoration = "underline";
		cont.appendChild(copy);
		
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
		
		copy.addEventListener("click", function(e){
			/*try{
				navigator.clipboard.write([
					new ClipboardItem({
						"text/html": tbl.outerHTML
					})
				]).then(() =>	alert("Copied!"));
			} catch(err){
				alert("Not copied!");
				alert(err.message);
			}*/
			//FF does not yet support clipboard :(
			let sel = window.getSelection();
			sel.removeAllRanges();

			let r = new Range();
			r.selectNode(tbl);
			
			sel.addRange(r);		
			document.execCommand("copy");
			sel.removeAllRanges();
		});
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
			let col = document.createElement("td");
			col.style.border = "1px solid #000";
			col.style.fontSize = "11pt";
			cols.push(col);
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

/*document.getElementById("check").addEventListener("click",(e) => {
	clearContent();
	sendMsg("check");
});

document.getElementById("test").addEventListener("click",(e) => {
	clearContent();
	sendMsg("test")
});*/

clearContent();
sendMsg("test");

browser.runtime.onMessage.addListener((message, sender, response) => {
	console.log(message);
	
	genTest(message);
});