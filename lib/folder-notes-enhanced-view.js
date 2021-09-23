'use babel';

export default class folderNotesEnhancedView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('folder-notes-enhanced');

    // Create message element
    const message = document.createElement('div');
    message.textContent = 'The folderNotesEnhanced package is Alive! It\'s ALIVE!';
    message.classList.add('message');
    this.element.appendChild(message);

    // Create message element
    const exitButton = document.createElement('button');
    exitButton.textContent = 'Done';
    exitButton.classList.add('close-button', 'pull-right');
    this.element.appendChild(exitButton);
    exitButton.addEventListener('click', () => this.element.hide());
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
