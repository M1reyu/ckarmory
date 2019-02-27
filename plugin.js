/**
 * CKArmory Plugin, (c) 2019 by Martin aka Mireyu
 */

// pluginregister im editor
CKEDITOR.plugins.add( "ckarmory", {
	icons: "ckarmory",
	requires: "dialog,widget",

	init: function( editor ) {

		// namensdeklaration
		var pluginName = "ckarmory";
		var dialogItems = pluginName + "Items";

		// dialog laden
		CKEDITOR.dialog.add(dialogItems, this.path + "dialogs/" + pluginName + ".js");

		// befehl fuer dialog (da kein widget)
		editor.addCommand(dialogItems, new CKEDITOR.dialogCommand( dialogItems ));

		// btn zur toolbar hinzufuegen
		editor.ui.addButton(
			"Ckarmory",
			{
				label: "Items yay",
				command: dialogItems,
				toolbar: pluginName,
				icon: pluginName
			}
		);

		// eigene elemente erlauben, css zwecks iframe
		editor.filter.allow("span(!ckarmory)[data-*,title,contenteditable]{background-image}", "ckarmory");
		editor.addContentsCss(this.path + "ckarmory.css");
	},

	onLoad: function() {
		// globales css zwecks dialog
		CKEDITOR.document.appendStyleSheet(this.path + "ckarmory.css");
	}

});
