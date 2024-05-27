import {
    addDragAndDropListeners,
    allowDrop,
    handleDropEvent,
    toggleImportant,
    createCardElement,
    openEditModal,
    saveState,
    loadState,
    updateColumnCounters,
    checkDates,
    updateTimeouts,
    getEditingCard,
    setEditingCard
} from './helpers.js';

let cardId = 1;

document.querySelectorAll('.column').forEach(column => {
    column.addEventListener('dragenter', (e) => handleDropEvent(e, 'enter'));
    column.addEventListener('dragleave', (e) => handleDropEvent(e, 'leave'));
    column.addEventListener('drop', (e) => handleDropEvent(e, 'drop'));
    column.addEventListener('dragover', allowDrop);
});

document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('delete-btn')) {
        const card = target.closest('.card');
        card.remove();
        saveState();
    } else if (target.classList.contains('important-btn')) {
        const card = target.closest('.card');
        toggleImportant(card);
        saveState();
    } else if (target.closest('.card')) {
        openEditModal(target.closest('.card'));
    }
});

const modal = document.getElementById('modal');
const openModalButton = document.getElementById('openModalButton');
const closeModalButton = modal.querySelector('.close-button');
const modalForm = document.getElementById('modalForm');

openModalButton.addEventListener('click', () => {
    console.log('Open modal button clicked');
    modal.style.display = 'block';
    updateColumnCounters();
});

closeModalButton.addEventListener('click', () => {
    console.log('Close modal button clicked');
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        console.log('Click outside modal');
        modal.style.display = 'none';
    }
});

modalForm.addEventListener('submit', (event) => {
    event.preventDefault();
    console.log('Modal form submitted');
    const title = document.getElementById('modalTitle').value;
    const text = document.getElementById('modalText').value;
    const date = document.getElementById('modalDate').value;
    const time = document.getElementById('modalTime').value;
    const column = document.querySelector('.column-todo');

    if (title.trim() && text.trim()) {
        console.log('Creating new card');
        const newCard = createCardElement({ id: cardId++, title, text, date, time });
        console.log('Appending new card to column');
        column.appendChild(newCard);
        modal.style.display = 'none';
        modalForm.reset();
        saveState();
        updateColumnCounters();
        checkDates();
        updateTimeouts();
    } else {
        console.log('Title or text is empty');
    }
});

const closeEditModalButton = document.getElementById('closeEditModalButton');
const editModal = document.getElementById('editModal');
const editModalForm = document.getElementById('editModalForm');
const markImportantButton = document.getElementById('markImportantButton');
const deleteNoteButton = document.getElementById('deleteNoteButton');

closeEditModalButton.addEventListener('click', () => {
    editModal.style.display = 'none';
    setEditingCard(null);
});

window.addEventListener('click', (event) => {
    if (event.target === editModal) {
        editModal.style.display = 'none';
        setEditingCard(null);
    }
});

editModalForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = document.getElementById('editModalTitle').value;
    const text = document.getElementById('editModalText').value;
    const date = document.getElementById('editModalDate').value;
    const time = document.getElementById('editModalTime').value;
    const editingCard = getEditingCard();

    if (editingCard && title.trim() && text.trim()) {
        editingCard.querySelector('h3').textContent = editingCard.classList.contains('important') ? '📍 ' + title : title;
        editingCard.querySelector('p').textContent = text;
        editingCard.querySelector('.date').textContent = `${date ? date : ''} ${time ? time : ''}`;
        editModal.style.display = 'none';
        setEditingCard(null);
        saveState();
        checkDates();
        updateTimeouts();
    }
});

markImportantButton.addEventListener('click', () => {
    const editingCard = getEditingCard();
    if (editingCard) {
        toggleImportant(editingCard);
        saveState();
        editModal.style.display = 'none';
        setEditingCard(null);
    }
});

deleteNoteButton.addEventListener('click', () => {
    const editingCard = getEditingCard();
    if (editingCard) {
        editingCard.remove();
        saveState();
        editModal.style.display = 'none';
        setEditingCard(null);
    }
});

window.addEventListener('load', () => {
    console.log('Window loaded');
    loadState();
    updateColumnCounters();
    checkDates();
    updateTimeouts();
    setInterval(checkDates, 60000);
});
