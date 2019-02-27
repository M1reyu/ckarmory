/**
 * CKArmory Plugin, (c) 2019 by Martin aka Mireyu

 # V. 1.0 - 2019-02-25
 Erste stabile Version mit Item-Suche.
 */

// pluginregister im editor
CKEDITOR.plugins.add( "ckarmory", {
	icons: "ckarmory",
	requires: "dialog,widget",

	init: function( editor ) {

		// namensdeklaration
		var pluginName = "ckarmory";
		var dialogName = pluginName + "Dialog";

		// dialog laden
		CKEDITOR.dialog.add(dialogName, this.path + "dialogs/" + dialogName + ".js");

		// befehl fuer dialog (da kein widget)
		editor.addCommand(dialogName, new CKEDITOR.dialogCommand( dialogName ));

		// btn zur toolbar hinzufuegen
		editor.ui.addButton(
			"Ckarmory",
			{
				label: "Items yay",
				command: dialogName,
				toolbar: pluginName
			}
		);

		// eigene elemente erlauben, css zwecks iframe
		editor.filter.allow("span(!ckarmory)[data-*,title,contenteditable]{background-image}", "ckarmory");
		editor.addContentsCss("ckarmory.css");
	},

	onLoad: function() {
		// globales css zwecks dialog
		CKEDITOR.document.appendStyleSheet("ckarmory.css");
		//CKEDITOR.dtd.$removeEmpty.span = false;
	}

});
