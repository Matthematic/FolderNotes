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

      var target = document.querySelectorAll('.panes');
      console.log(target);

      // create an observer instance
      var observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
              //console.log(mutation.type);
              if (mutation.type == 'childList') {
                  console.log(mutation.addedNodes.length);
                  mutation.addedNodes.forEach(function(node) {
                      console.log(node.innerHTML);
                      // turn the innerHTML into an element object so we can query its attributes
                      var htmlObj = document.createElement('div');
                      htmlObj.innerHTML = node.innerHTML;
                      //htmlObj = htmlObj.firstChild;
                      console.log(htmlObj.childNodes);
                      htmlObj.childNodes.forEach ( function(child) {
                          var dataPath = child.getAttribute("data-path");
                          if (dataPath != undefined) {
                              var dataPathRel = dataPath.replace(folderPath + '/', '');
                              console.log(dataPath);
                              console.log(dataPathRel);

                              if (json[dataPathRel] != undefined) {
                                  console.log("FOUND");
                                  console.log(json[dataPathRel]);
                              }
                              else {
                                  console.log("NOT FOUND");
                              }
                          }
                      });
                  });
              }
          });
      });

      // configuration of the observer:
      var config = { attributes: true, childList: true, characterData: true, subtree: true }

      // pass in the target node, as well as the observer options
      observer.observe(target[0], config);

      /*for (var key in json) {
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
      }*/

      this.notesVisible = !this.notesVisible;
    }

};
