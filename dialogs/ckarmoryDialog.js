/**
 * CKArmory Plugin - Dialog, (c) 2019 by Martin aka Mireyu
 */

/*
@return generalisierte dialogdefinition
@param intention: items|skills|specialization
*/
function getCKArmoryDialogDef(editor, intention)  {
	var dialogDef = {
		target: intention,
		text: "nA",
		minWidth: 200,
		width: 400,
		minHeight: 100,
		buttons: [
			CKEDITOR.dialog.okButton,
			CKEDITOR.dialog.cancelButton
		]
	};

	if (intention === "items") {
		dialogDef.text = "Gegenstand";
		dialogDef.title = "Itemauswahl";
		dialogDef.minLength = 3;
	} else if (intention === "skills") {
		dialogDef.text = "Fertigkeit";
		dialogDef.title = "Fertigkeitenauswahl";
		dialogDef.minLength = 4;	// Jede ID hat min. 4 nummern
	}

	dialogDef.elResults = CKEDITOR.dom.element.createFromHtml(
		"<div id='search_results_" + intention + "'>Gib min. " + dialogDef.minLength + " Zeichen ein!</div>"
	);

	//elSearch: "",
	// TODO weiteres

	dialogDef.contents = [ {
		id: "search_tab_" + intention,
		label: dialogDef.text + " suchen",
		elements: [ {
			type: "text",
			id: "search_input",
			label: "Gib einen Itemnamen ein:",
			default: "",
			validate: function() {
				// armorReady, wenn ein item ausgewaehlt wurde
				return this.armoryReady;
			},
			onKeyup: function(e) {
				// begriff vom input
				var val = this.getValue().trim();
				logme(val);

				// jedes item hat mindestens 3 zeichen, erst dann suche starten
				if ( !val || val.length < 3 ) {
					return;
				}

				// starte suche und zeige ergebnis
				logme("suche nach " + val);
				searchItem(val, this.getDialog());
			},
			onShow: function(e) {
				// wenn der dialog geoeffnet wird reicht ein zuruecksetzen des booleans
				this.armoryReady = false;
				// bestaetigunsbtn erst erlauben, wenn was ausgewaehlt wurde
				this.getDialog().disableButton("ok");
			},
			onLoad: function(e) {
				elSearch = this;
			}
		}, {
			type: "html",
			//html: "<div id='search_results'>Gib min. 3 Zeichen ein!</div>",
			html: "<div></div>",
			onLoad: function(e) {
				//logme(this);

				/* der click-event fuer die ergebnisse wird hier einmalig
				 deklariert. der schmaeh: das event bubblet und man kann
				 auf die children reagieren. damit das zuverlaessig in jedem
				 browser funktioniert muessen die pointer-events angepasst
				 werden
				 */
				elResults.on("click", function(ec) {
					logme("resultatcontainer click");
					logme(ec);
					// wo wurde das event gefangen
					var target = ec.data.$.target;
					if (target.matches(".result_item")) {
						//ec.preventDefault(); - nicht notwendig in vanilla
						logme("resultat gewaehlt");
						logme(target);

						// beim globalen input ausgewaehltes abspeichern
						elSearch.armoryID = target.getAttribute("data-id");
						elSearch.armoryName = target.getAttribute("data-name");
						elSearch.armoryImg = target.getAttribute("data-img");
						elSearch.armoryReady = true;

						// ui
						removeSelection();
						target.classList.add("active");
						CKEDITOR.dialog.getCurrent().enableButton("ok");
					}
				});

				// nach eventdefinition, resultatcontainer einfuegen
				CKEDITOR.document.getById( this.domId ).append( elResults );
			}
		} ]
	} ]; //contents

	dialogDef.onOk = function(e) {
		logme("Insert item");

		// die krux, inserthtml funzt nit - umweg ueber element
		// muss in editor.allow erlaubt werden
		var el = CKEDITOR.dom.element.createFromHtml(
			"<span " +
			"class='ckarmory' " +
			"data-armory-embed='" + intention + "' " +
			"data-armory-ids='" + dialogDef.elSearch.armoryID + "' " +
			"style='background-image: url(" + dialogDef.elSearch.armoryImg + ")' " +
			"title='" + sanatizeString(dialogDef.elSearch.armoryName) + "'" +
			">&nbsp;</span>"
			//"></span>"
		);
		//el.isEditable(false);
		//el.unselectable();
		el.setAttribute("contenteditable", "false");

		editor.insertElement(el);
		removeSelection();

	}; //onOK

	return dialogDef;
}

CKEDITOR.dialog.add( "ckarmoryDialog", function( editor ) {
	// globale variablen - erspart suche
	var elResults = CKEDITOR.dom.element.createFromHtml( "<div id='search_results'>Gib min. 3 Zeichen ein!</div>" );
	var elSearch;

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

	// fuers visuelle, entfernt selection bei gefundenen eintraegen
	function removeSelection() {
		var resultItems = Array.from(document.querySelectorAll(".result_item"));
		resultItems.forEach(function(item) {
			item.classList.remove("active");
		});
	}//removeSelection

	// eigentliche logik, xhr fuer items mit ergebnisdarstellung im dialog
	function searchItem(itemName, dialog) {

		// TODO: spinner
		// TODO: error handling

		logme("suche...");
		logme(this);

		var oReq = new XMLHttpRequest();
		oReq.onload = function(e) {
			// load-handler - nach DONE
			logme(e);
			logme(e.target.response.results);

			var data = e.target.response;
			var content = "Keine Items mit dem Namen '" + itemName + "' gefunden";
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
			elResults.setHtml(content);
			dialog.layout();	// zentrierten

		};
		// gw2armory bietet nur eine anzeige an, dank gw2spidy gibts ne elegante suche
		oReq.open("GET", "http://www.gw2spidy.com/api/v0.9/json/item-search/" + itemName, true);
		oReq.responseType = "json";
		oReq.send();
	}//searchItem

	// dialogdefinition
	return {
		title: "Itemauswahl",
		minWidth: 200,
		width: 400,
		minHeight: 100,
		buttons: [
			CKEDITOR.dialog.okButton,
			CKEDITOR.dialog.cancelButton
		],
		contents: [ {
			id: "search_tab",
			label: "Item suchen",
			elements: [ {
				type: "text",
				id: "search_input",
				label: "Gib einen Itemnamen ein:",
				default: "",
				validate: function() {
					// armorReady, wenn ein item ausgewaehlt wurde
					return this.armoryReady;
				},
				onKeyup: function(e) {
					// begriff vom input
					var val = this.getValue().trim();
					logme(val);

					// jedes item hat mindestens 3 zeichen, erst dann suche starten
					if ( !val || val.length < 3 ) {
						return;
					}

					// starte suche und zeige ergebnis
					logme("suche nach " + val);
					searchItem(val, this.getDialog());
				},
				onShow: function(e) {
					// wenn der dialog geoeffnet wird reicht ein zuruecksetzen des booleans
					this.armoryReady = false;
					// bestaetigunsbtn erst erlauben, wenn was ausgewaehlt wurde
					this.getDialog().disableButton("ok");
				},
				onLoad: function(e) {
					elSearch = this;
				}
			}, {
				type: "html",
				//html: "<div id='search_results'>Gib min. 3 Zeichen ein!</div>",
				html: "<div></div>",
				onLoad: function(e) {
					//logme(this);

					/* der click-event fuer die ergebnisse wird hier einmalig
					 deklariert. der schmaeh: das event bubblet und man kann
					 auf die children reagieren. damit das zuverlaessig in jedem
					 browser funktioniert muessen die pointer-events angepasst
					 werden
					 */
					elResults.on("click", function(ec) {
						logme("resultatcontainer click");
						logme(ec);
						// wo wurde das event gefangen
						var target = ec.data.$.target;
						if (target.matches(".result_item")) {
							//ec.preventDefault(); - nicht notwendig in vanilla
							logme("resultat gewaehlt");
							logme(target);

							// beim globalen input ausgewaehltes abspeichern
							elSearch.armoryID = target.getAttribute("data-id");
							elSearch.armoryName = target.getAttribute("data-name");
							elSearch.armoryImg = target.getAttribute("data-img");
							elSearch.armoryReady = true;

							// ui
							removeSelection();
							target.classList.add("active");
							CKEDITOR.dialog.getCurrent().enableButton("ok");
						}
					});

					// nach eventdefinition, resultatcontainer einfuegen
					CKEDITOR.document.getById( this.domId ).append( elResults );
				}
			} ]
		} ], //contents
		onOk: function(e) {
			logme("Insert item");

			// die krux, inserthtml funzt nit - umweg ueber element
			// muss in editor.allow erlaubt werden
			var el = CKEDITOR.dom.element.createFromHtml(
				"<span " +
				"class='ckarmory' " +
				"data-armory-embed='items' " +
				"data-armory-ids='" + elSearch.armoryID + "' " +
				"style='background-image: url(" + elSearch.armoryImg + ")' " +
				"title='" + sanatizeString(elSearch.armoryName) + "'" +
				">&nbsp;</span>"
				//"></span>"
			);
			//el.isEditable(false);
			//el.unselectable();
			el.setAttribute("contenteditable", "false");

			editor.insertElement(el);
			removeSelection();

		} //onOK
	}; //return
}); //dialog.add
