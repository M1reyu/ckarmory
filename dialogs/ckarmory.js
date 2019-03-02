/*
CKArmory Plugin - Dialoge
(c) 2019 by Martin aka Mireyu
*/


/* ########## HELPER ########## */

function logme(str) {
	var debug = true;
	if (debug && window.console) {
		console.log(str);
	}
}//logme

// string-sanatizer fuer attributstrings
function sanatizeString(str) {
	return str.replace(/\'/g, "&#39;").replace(/\"/g, "&#34;");
}//sanatizeString

/* ########## /HELPER ########## */


/* ########## DIALOG-GENERAL ########## */

function getDefaultCKArmoryDD(editor, intention) {
	return {
		minWidth: 200,
		width: 400,
		minHeight: 100,
		buttons: [
			CKEDITOR.dialog.okButton,
			CKEDITOR.dialog.cancelButton
		],
		onShow: function() {
			// wenn das fenster geoeffnet wird, status zuruecksetzen
			this.parts.ckarmory.ready = false;
			this.disableButton("ok");
		},
		onLoad: function() {
			// essentielle variablen am dialog tmp sichern
			this.parts.ckarmory = {
				intention: intention,	// sollte immer der api-knoten sein
				ready: false,
				id: "",	//selektierte elementattribute
				img: "",
				title: "",
				rarity: ""
			};
		},
		onOk: function(e) {
			// die krux, inserthtml funzt nit - umweg ueber element
			// muss in editor.allow erlaubt werden
			// leere elem. werden meisten abgeschnitten: leerzeichen einfuegen
			var el = CKEDITOR.dom.element.createFromHtml(
				"<span " +
				"class='ckarmory' " +
				"data-armory-embed='" + this.parts.ckarmory.intention + "' " +
				"data-armory-ids='" + this.parts.ckarmory.id + "' " +
				"style='background-image: url(" + this.parts.ckarmory.img + ")' " +
				"title='" + sanatizeString(this.parts.ckarmory.title) + "'" +
				">&nbsp;</span>"
			);
			// uneditierbar fuer den user
			el.setAttribute("contenteditable", "false");

			editor.insertElement(el);
			removeSelection();

		} //onOK
	};
}//getDefaultCKArmoryDD

function getCKArmoryTab(idSuffix, tabTitle, inputTitle, elResults, validateFunc, searchFunc) {
	var tabDef = {
		id: "tab_" + idSuffix,
		label: tabTitle,
		elements: [ {
			type: "text",
			id: "input_" + idSuffix,
			label: inputTitle,
			default: "",
			onLoad: function() {
				this.elResults = elResults;	// als referenz fuer die suche
			},
			onKeyup: function() {
				// begriff vom input
				//var val = this.getValue().trim();
				logme(this.getValue());

				if ( !validateFunc(this) ) {
					return;
				}

				// starte suche und zeige ergebnis/error
				logme("suche nach " + this.getValue());
				searchFunc(this);
			},
			validate: function() {
				// ckarmory.ready == true, wenn ein element ausgewaehlt wurde
				return this.getDialog().parts.ckarmory.ready;
			}
		}, {
			type: "html",
			//html: "<div id='search_results'>Gib min. 3 Zeichen ein!</div>",
			html: "<div></div>",
			onLoad: function(e) {
				var dialog = this.getDialog();

				/* der click-event fuer die ergebnisse wird hier einmalig
				 deklariert. der schmaeh: das event bubblet und man kann
				 auf die children reagieren. damit das zuverlaessig in jedem
				 browser funktioniert muessen die pointer-events angepasst
				 werden
				 */
				elResults.on("click", function(ec) {
					logme("resultatcontainer click");
					// wo wurde das event gefangen
					var target = ec.data.$.target;
					if (target.matches(".result_item")) {
						//preventDefault(); - nicht notwendig in vanilla
						logme("resultat gewaehlt");
						logme(target);

						// beim globalen input ausgewaehltes abspeichern
						dialog.parts.ckarmory.id = target.getAttribute("data-id");
						dialog.parts.ckarmory.img = target.getAttribute("data-img");
						dialog.parts.ckarmory.title = target.getAttribute("data-name");
						dialog.parts.ckarmory.ready = true;

						// ui
						removeSelection();
						target.classList.add("active");
						dialog.enableButton("ok");
					}
				});

				// nach eventdefinition, resultatcontainer einfuegen
				CKEDITOR.document.getById( this.domId ).append( elResults );
			}
		} ]
	};
	return tabDef;
}//getCKArmoryTab

// fuers visuelle, entfernt selection bei gefundenen eintraegen
function removeSelection() {
	var resultItems = Array.from(document.querySelectorAll(".result_item"));
	resultItems.forEach(function(item) {
		item.classList.remove("active");
	});
}//removeSelection

function ckaShowError(msg, input) {
	var elResults = input.elResults;
	elResults.setHtml(
		"<div class='cka_err'>" + msg + "</div>"
	);

	return false;
}//ckaShowError

/* ########## /DIALOG-GENERAL ########## */


/* ########## DIALOG-LOGIC ########## */

function ckaValidateName(input) {
	var val = input.getValue().trim();
	// jedes item hat mindestens 3 zeichen, erst dann suche starten
	var isValid = val && val.length > 2;
	if ( !isValid ) {
		return ckaShowError("Gib mindestens 3 Zeichen ein!", input);
	}

	return isValid;
}//ckaValidateName

function ckaValidateID(input) {
	var val = input.getValue().trim();
	// ids besitzen mindestens 4 zeichen, nur numerisch
	var isValid = val && val.length > 3;
	if ( !isValid ) {
		return ckaShowError("Gib mindestens 4 Zahlen ein!", input);
	}

	isValid = isValid && Number(val) === parseInt(val, 10);
	if ( !isValid ) {
		return ckaShowError("Ein Chatlink besitzt nur Zahlen (0-9)!", input);
	}

	return isValid;
}//ckaValidateID

// eigentliche logik, xhr fuer div. elemente mit ergebnisdarstellung im dialog
function searchID(input) {
	var val = input.getValue().trim();
	var dialog = input.getDialog();
	var elResults = input.elResults;
	var intention = dialog.parts.ckarmory.intention;

	// spinner hinzu
	elResults.addClass("ckaspin");

	// TODO: caching?

	logme("suche...");

	var xhr = new XMLHttpRequest();
	xhr.onload = function(e) {
		// load-handler - nach DONE
		logme(e);
		logme(e.target.response);

		var data = e.target.response;
		var content = "";
		if (!data.text) {
			// items gefunden
			var item = data;
			content = "<div class='result_item" +
				(item.rarity ? " rarity_" + item.rarity.toLowerCase() : "") + "' " +
				"data-id='" + item.id + "' " +
				"data-name='" + sanatizeString(item.name) + "' " +
				"data-img='" + item.icon + "'>" +
				"<div class='result_img'>" +
				"<img src='" + item.icon + "' />" +
				"</div>" +
				"<div class='result_name'>" + item.name + "</div>" +
				"</div>";
		}

		// resultate (oder error) ausgeben
		if (content) {
			elResults.setHtml(content);
		} else {
			ckaShowError("Kein Ergebnis mit der ID '" + val + "' gefunden", input);
		}
		elResults.removeClass("ckaspin");	// spinner entfernen
		dialog.layout();	// zentrierten

	};
	xhr.ontimeout = function(e) {
		// XMLHttpRequest timed out
		ckaShowError(
			"Netzwerk Timeout - die GW2-API ist derzeit nicht erreichbar.<br/>" +
			"Probiere es etwas später erneut.",
			input
		);
	};

	xhr.timeout = 20000;	// ms
	// gw2armory bietet nur eine anzeige an, dank gw2spidy gibts ne elegante suche
	xhr.open("GET", "https://api.guildwars2.com/v2/" + intention + "?lang=de&id=" + val, true);
	xhr.responseType = "json";
	xhr.send();
}//searchID

function searchItemModified(input) {
	var val = input.getValue().trim();
	var dialog = input.getDialog();
	var elResults = input.elResults;

	// spinner hinzu
	elResults.addClass("ckaspin");
	logme("suche...");

	var xhr = new XMLHttpRequest();
	xhr.onload = function(e) {
		// load-handler - nach DONE
		logme(e);
		logme(e.target.response.results);

		var data = e.target.response;
		var content = "";
		if (data.count > 0) {	// count 0, dann keine items mit dem begriff im namen
			// items gefunden
			content = "";
			var result = data.results;
			// durchloopen der items und klickbare liste aufbauen
			for (var i in result) {
				var item = result[i];
				content += "<div class='result_item rarity_" + item.rarity + "' " +
					"data-id='" + item.data_id + "' " +
					"data-name='" + sanatizeString(item.name) + "' " +
					"data-img='" + item.img + "'>" +
					"<div class='result_img'>" +
					"<img src='" + item.img + "' />" +
					"</div>" +
					"<div class='result_name'>" + item.name + "</div>" +
					"</div>";
			}
		}

		// resultate (oder error) ausgeben
		if (content) {
			elResults.setHtml(content);
		} else {
			ckaShowError("Keine Items mit dem Namen '" + val + "' gefunden", input);
		}
		elResults.removeClass("ckaspin");	// spinner entfernen
		dialog.layout();	// zentrierten

	};
	xhr.ontimeout = function(e) {
		// XMLHttpRequest timed out
		ckaShowError(
			"Netzwerk Timeout - die Such-API ist derzeit nicht erreichbar.<br/>" +
			"Probiere es etwas später erneut.",
			input
		);
	};
	xhr.timeout = 20000;	// ms
	// gw2armory bietet nur eine anzeige an, dank gw2spidy gibts ne elegante suche
	xhr.open("GET", "http://www.gw2spidy.com/api/v0.9/json/item-search/" + val, true);
	xhr.responseType = "json";
	xhr.send();
}//searchID

/* ########## /DIALOG-LOGIC ########## */




/* ########## DIALOG-CKEDITOR ########## */

// ##### ITEMS

CKEDITOR.dialog.add( "ckarmoryItems", function( editor ) {
	var dialogDef = getDefaultCKArmoryDD(editor, "items");
	dialogDef.title = "Itemauswahl";
	var elResultsName = CKEDITOR.dom.element.createFromHtml(
		"<div id='sr_items_name' class='search_results'>&nbsp;</div>"
	);
	var elResultsID = CKEDITOR.dom.element.createFromHtml(
		"<div id='sr_items_it' class='search_results'>&nbsp;</div>"
	);
	dialogDef.contents = [
		getCKArmoryTab(
			"items_name",
			"Itemname",
			"Gib einen Itemnamen ein (in Englisch)",
			elResultsName,
			ckaValidateName,
			searchItemModified
		),
		getCKArmoryTab(
			"items_id",
			"Chatlink",
			"Gib die Item-ID ein (Chatlink)",
			elResultsID,
			ckaValidateID,
			searchID
		)
	];

	return dialogDef;
});//ckarmoryItems add

// ##### SKILLS

CKEDITOR.dialog.add( "ckarmorySkills", function( editor ) {
	var dialogDef = getDefaultCKArmoryDD(editor, "skills");
	dialogDef.title = "Skillauswahl";
	var elResultsID = CKEDITOR.dom.element.createFromHtml(
		"<div id='sr_items_it' class='search_results'>&nbsp;</div>"
	);
	dialogDef.contents = [
		getCKArmoryTab(
			"skills_id",
			"Chatlink",
			"Gib die Skill-ID ein (Chatlink)",
			elResultsID,
			ckaValidateID,
			searchID
		)
	];

	return dialogDef;
});//ckarmoryItems add

// ##### SPECIALIZATION

/*
TODO:
# spez. id array abfragen
# alle ids infos abfragen (session cachen!)
# auswahl nach profession (dropdown)
# auswahl nach spec.-name (dd)
# auswahl von 3 major traits (dd) (optional)

*/

/* ########## /DIALOG-CKEDITOR ########## */

