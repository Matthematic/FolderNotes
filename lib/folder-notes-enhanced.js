'use babel';

import folderNotesEnhancedView from './folder-notes-enhanced-view';
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
  * Walk the json tree
  */
var walkJSON = function(json, constructedPath, targetPath, callBack) {
  if (constructedPath.substring(1) == targetPath) {
    callBack(json);
  } else {
    for (let subElement in json["subElements"]) {
      let nextPath = constructedPath + '/' + subElement;
      walkJSON(json["subElements"][subElement], nextPath, targetPath, callBack);
    }
  }
}

/**
 * Determines if a list item has a note defined for it, and returns a Note Element if it does;
 */
var getNoteElement = function(dataPath) {
    if (dataPath) {
        let normalizedDataPath = normalizeFilename(dataPath);

        for (var i = 0; i < folderPaths.length; i++) {
          folderPaths[i] = normalizeFilename(folderPaths[i]);
          var dataPathRel = normalizedDataPath.replace(folderPaths[i] + '/', '');
          let properties = new Promise(function(success, error) {
            walkJSON(json[folderPaths[i]], "", dataPathRel, success);
          });

          // "Consuming Code" (Must wait for a fulfilled Promise)
          properties.then(
            function(value) { console.log(value);
              return createNoteElement(dataPathRel, value["notes"], value["color"]);
             },
            function(error) { /* code if some error */ }
          );

          /*
          for (var key in  json) {
            if (key.indexOf(folderPaths[i]) > -1){
              var dataPathRel = normalizedDataPath.replace(folderPaths[i] + '/', '');
              if (json[key]["notes"][dataPathRel]) {
                return createNoteElement(dataPathRel, json[key]["notes"][dataPathRel], key);
              }
            }
          }

          */
        }

        //console.log(dataPathRel);

        /*

        */
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
var createNoteElement = function(noteKey, noteVal, color) {
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
            noteEntryElement.style.color = color || "yellow";
            noteEntryElement.innerHTML = noteVal[noteEntry];
            noteElement.appendChild(noteEntryElement);
        }
    }
    else {
        noteEntryElement = document.createElement("li");
        noteEntryElement.style.color = color || "yellow";
        noteEntryElement.innerHTML = noteVal;
        noteElement.appendChild(noteEntryElement);
    }

    return noteElement;
}

/**
 *  Calls destroyNote on each key in the config json
 */
var destroyNotes = function() {
  for (var pathKey in json){
    for (var key in json[pathKey]["notes"]) {
        if (json[pathKey]["notes"].hasOwnProperty(key)) {
            destroyNote(key);
        }
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
var folderPaths = [];
var projectCount = atom.project.getPaths().length
for (var i = 0; i < projectCount; i++) {
  folderPaths[i] = atom.project.getPaths()[i];
}

var json = {};
target = document.querySelectorAll('.panes');

export default {
  folderNotesEnhancedView: null,
  modalPanel: null,
  subscriptions: null,
  notesVisible: false,
  observer: null,
  config: null,
  target: null,

  // called when package is initially loaded
  activate(state) {
    this.folderNotesEnhancedView = new folderNotesEnhancedView(state.folderNotesEnhancedViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.folderNotesEnhancedView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'folder-notes-enhanced:toggle': () => this.toggle()
    }));

    // Register command that shows dialogue to edit notes

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'folder-notes-enhanced:edit': () => this.editNotes()
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

//dont know why it needs to be reenabed on start

    this.toggle();
    this.toggle();
    this.toggle();

  },

// called when the packed is deactivated
  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.folderNotesEnhancedView.destroy();
  },

// called when saving the state of the package between uses. Return value is passed to activate on next activation
  serialize() {
    return {
      folderNotesEnhancedViewState: this.folderNotesEnhancedView.serialize()
    };
  },

  toggle() {
    if (!this.notesVisible) {
      for (var i = 0; i < atom.project.getPaths().length; i++){
        const file = folderPaths[i] + '/folderNotesEnhanced.confignew.json';
        if (fs.existsSync(file)) {
          json[normalizeFilename(folderPaths[i])] = jsonfile.readFileSync(file);
        } else {
          return null;
        }
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
  },

  editNotes() {
    // Show note editing dialogue
    var treeView = atom.packages.getActivePackage('tree-view');
    if(!treeView) return;
    treeView = treeView.mainModule.getTreeViewInstance();
    selectedPath = normalizeFilename(treeView.selectedPaths()[0]);
    for (let projectRoot in atom.project.getPaths()) {
      let normalisedProjectRoot = normalizeFilename(atom.project.getPaths()[projectRoot]);
      if (selectedPath.indexOf(normalisedProjectRoot) == 0) {
        let relativePath = selectedPath.replace(normalisedProjectRoot + "/", '');
        let projectName = normalisedProjectRoot.substring(normalisedProjectRoot.lastIndexOf('/')+1) + "/";
        console.log("Modify folder notes:");
        console.log(projectName + relativePath + ": " + json[normalisedProjectRoot]["notes"][relativePath]);
        this.modalPanel.show()
      }
    }
  }

};
