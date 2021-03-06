'use babel';

import FolderNotesView from './folder-notes-view';
import { CompositeDisposable } from 'atom';
import fs from 'fs';
import jsonfile from 'jsonfile';
var toStyleString = require('to-style').string

/**
 *  Retrieves the data-path attribute from an html element
 */
var getDataPathAttribute = function(node) {
    if (node.getAttribute) {
        return node.getAttribute("data-path");
    }
    return undefined;
};

/**
  normalizes a filename to use unix forward-slashes
 */
const normalizeFilename = (path) => {
  if (path) {
      return path.replace(/\\/g, '/');
  }
}

/**
 * Determines if a list item has a note defined for it, and returns a Note Element if it does;
 */
var getNoteElement = function(dataPath) {
    if (dataPath) {
        let normalizedDataPath = normalizeFilename(dataPath);
        let dataPathRel = normalizedDataPath.replace(folderPath + '/', '');

        if (json["notes"][dataPathRel]) {
          return createNoteElement(dataPathRel, json["notes"][dataPathRel]);
        }
    }
    return false;
};

/**
 *  Performs the comparison on each list item in the file tree
 */
var perform = function(node) {
    var dataPath = getDataPathAttribute(node);
    if (dataPath != undefined) {
        var noteElement = getNoteElement(dataPath);
        if (noteElement) {
            node.appendChild(noteElement);
        }
    }

}


/**
 *  Creates the HTML list and list items that comprise a Note.
 */
var createNoteElement = function(noteKey, noteVal) {
    let noteElement;
    let noteEntryElement;
    noteElement = document.createElement("ul");
    noteElement.setAttribute("id", noteKey); // id of note is the key of the note in the json
    const style = toStyleString({
      display: "inline-block",
      "vertical-align": "top",
    });
    noteElement.setAttribute("style", style);

    // Create the note Element
    if (noteVal instanceof Array) {
        for (var noteEntry in noteVal) {
            noteEntryElement = document.createElement("li");
            noteEntryElement.style.color = json["color"] || "yellow";
            noteEntryElement.innerHTML = noteVal[noteEntry];
            noteElement.appendChild(noteEntryElement);
        }
    }
    else {
        noteEntryElement = document.createElement("li");
        noteEntryElement.style.color = json["color"] || "yellow";
        noteEntryElement.innerHTML = noteVal;
        noteElement.appendChild(noteEntryElement);
    }

    return noteElement;
}

/**
 *  Calls destroyNote on each key in the config json
 */
var destroyNotes = function() {
    for (var key in json["notes"]) {
        if (json["notes"].hasOwnProperty(key)) {
            destroyNote(key);
        }
    }
}

/**
 *  Removes the ul element that was created
 */
var destroyNote = function(key) {
    var elementList = document.querySelectorAll("ul[id='" + key + "']");
    if (elementList[0] != undefined) {
        elementList[0].outerHTML = '';
    }
}

/**
 *  Recursively walks down the file tree DOM and calls perform();
 */
var walkDOM = function (node,func) {
  node = node.firstChild;

  while(node) {
      perform(node);
      walkDOM(node,func);
      node = node.nextSibling;
  }
};

/* The root folder path */
var folderPath = normalizeFilename(atom.project.getPaths()[0]);
let json = {};
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
          const file = folderPath + '/folderNotes.config.json';
          if (fs.existsSync(file)) {
              json = jsonfile.readFileSync(file);
          }
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
