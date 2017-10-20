'use babel';

import FolderNotesView from './folder-notes-view';
import { CompositeDisposable } from 'atom';

export default {

  folderNotesView: null,
  modalPanel: null,
  subscriptions: null,
  notesVisible: false,

// called when package is initially loaded
  activate(state) {
    this.folderNotesView = new FolderNotesView(state.folderNotesViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.folderNotesView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'folder-notes:toggle': () => this.toggle()
    }));
  },

// called when the packed is deactivated
  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.folderNotesView.destroy();
  },

// called when saving the state of the package between uses. Return value is passed to activate on next activation
  serialize() {
    return {
      folderNotesViewState: this.folderNotesView.serialize()
    };
  },

  toggle() {
      var folderPath = atom.project.getPaths()[0];
      console.log(folderPath);

      const json = require(folderPath + '/folderNotes.config.json');
      console.log(json);


      for (var key in json) {
          if (json.hasOwnProperty(key)) {
             var dataPath = folderPath + '/' + key;
             var note;

             // Get element to attach the note to
             var selector = 'span[data-path="' + dataPath + '"]';
             console.log(selector);

             var x = document.querySelectorAll(selector);
             console.log(x);
             if (x.length > 0) {
                 console.log(x[0].innerHTML);


                 if (this.notesVisible) {
                     /*x[0].innerHTML = x[0].innerHTML.replace(/\(([^)]+)\)/, '');
                     x[0].innerHTML.trim();
                     x[0].style.color = "blue";*/
                     var remove = document.getElementById(key);
                     if (remove != undefined) {
                         remove.outerHTML = '';
                     }
                 }
                 else {
                     let noteElement;
                     let noteEntryElement;
                     noteElement = document.createElement("ul");
                     noteElement.setAttribute("id", key); // id of note is the key of the note in the json
                     noteElement.setAttribute("style", "display:inline-block;vertical-align:top");

                     // Create the note Element
                     if (json[key] instanceof Array) {
                         for (var noteEntry in json[key]) {
                             noteEntryElement = document.createElement("li");
                             noteEntryElement.style.color = "yellow";
                             noteEntryElement.innerHTML = json[key][noteEntry];
                             noteElement.appendChild(noteEntryElement);
                         }
                     }
                     else {
                         noteEntryElement = document.createElement("li");
                         noteEntryElement.style.color = "yellow";
                         noteEntryElement.innerHTML = json[key];
                         noteElement.appendChild(noteEntryElement);
                     }
                     x[0].appendChild(noteElement);
                 }
             }
          }
      }

      this.notesVisible = !this.notesVisible;
    }

};
