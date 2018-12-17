'use babel';

import FolderNotesView from './folder-notes-view';
import { CompositeDisposable } from 'atom';
import fs from 'fs';

var getDataPathAttribute = function(node) {
    if (node.getAttribute) {
        return node.getAttribute("data-path");
    }
    return undefined;
};

var getNoteElement = function(dataPath) {
    if (dataPath != undefined) {
        var dataPathRel
        if (dataPath.includes(folderPath + '/')) {
            dataPathRel = dataPath.replace(folderPath + '/', '');
        }
        else if (dataPath.includes(folderPath + '\\')) {
            dataPathRel = dataPath.replace(folderPath + '\\', '');
        }

        if (json[dataPathRel] != undefined) {
            return createNoteElement(dataPathRel, json[dataPathRel]);
        }
    }
    return false;

};

var perform = function(node) {
    var dataPath = getDataPathAttribute(node);
    if (dataPath != undefined) {
        var noteElement = getNoteElement(dataPath);
        if (noteElement) {
            node.appendChild(noteElement);
        }
    }

}

var createNoteElement = function(noteKey, noteVal) {
    let noteElement;
    let noteEntryElement;
    noteElement = document.createElement("ul");
    noteElement.setAttribute("id", noteKey); // id of note is the key of the note in the json
    noteElement.setAttribute("style", "display:inline-block;vertical-align:top");

    // Create the note Element
    if (noteVal instanceof Array) {
        for (var noteEntry in noteVal) {
            noteEntryElement = document.createElement("li");
            noteEntryElement.style.color = "yellow";
            noteEntryElement.innerHTML = noteVal[noteEntry];
            noteElement.appendChild(noteEntryElement);
        }
    }
    else {
        noteEntryElement = document.createElement("li");
        noteEntryElement.style.color = "yellow";
        noteEntryElement.innerHTML = noteVal;
        noteElement.appendChild(noteEntryElement);
    }

    return noteElement;
}


var destroyNotes = function() {
    for (var key in json) {
        if (json.hasOwnProperty(key)) {
            destroyNote(key);
        }
    }
}

var destroyNote = function(key) {
    var elementList = document.querySelectorAll("ul[id='" + key + "']");
    if (elementList[0] != undefined) {
        elementList[0].outerHTML = '';
    }
}

var walkDOM = function (node,func) {
  node = node.firstChild;

  while(node) {
      perform(node);
      walkDOM(node,func);
      node = node.nextSibling;
  }
};

var folderPath = atom.project.getPaths()[0];

let json = {};
if (fs.existsSync(folderPath + '/folderNotes.config.json')) {
    json = require(folderPath + '/folderNotes.config.json');
}


target = document.querySelectorAll('.panes');

export default {
  folderNotesView: null,
  modalPanel: null,
  subscriptions: null,
  notesVisible: false,
  observer: null,
  config: null,
  target: null,

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

    if (json) {
        observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                //console.log(mutation.type);
                if (mutation.type == 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        walkDOM(node);
                    });
                }
            });
        });

        // configuration of the observer:
        config = { attributes: true, childList: true, characterData: true, subtree: true }
    }
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
      if (!this.notesVisible) {
          // pass in the target node, as well as the observer options
          observer.observe(target[0], config);
          walkDOM(target[0]);
      }
      else {
          observer.disconnect();
          destroyNotes();
      }

      this.notesVisible = !this.notesVisible;
    }

};
