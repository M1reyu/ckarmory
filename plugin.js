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
		var dialogSkills = pluginName + "Skills";

		// dialog laden
		CKEDITOR.dialog.add(dialogItems, this.path + "dialogs/" + pluginName + ".js");
		CKEDITOR.dialog.add(dialogSkills, this.path + "dialogs/" + pluginName + ".js");

		// befehl fuer dialog (da kein widget)
		editor.addCommand(dialogItems, new CKEDITOR.dialogCommand( dialogItems ));
		editor.addCommand(dialogSkills, new CKEDITOR.dialogCommand( dialogSkills ));

		// btn zur toolbar hinzufuegen
		editor.ui.addButton(
			"Ckarmoryitems",
			{
				label: "Item hinzuf&uuml;gen",
				command: dialogItems,
				toolbar: pluginName,
				icon: this.path + "icons/" + dialogItems.toLowerCase() + ".png"
			}
		);
		editor.ui.addButton(
			"CkarmorySkills",
			{
				label: "Skill hinzuf&uuml;gen",
				command: dialogSkills,
				toolbar: pluginName,
				icon: this.path + "icons/" + dialogSkills.toLowerCase() + ".png"
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
