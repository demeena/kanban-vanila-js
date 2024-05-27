let cardId = 1;
let editingCard = null;
let expiredCards = new Set();

const addDragAndDropListeners = (element) => {
    element.addEventListener('dragstart', dragStart);
    element.addEventListener('dragend', dragEnd);
};

const dragStart = (event) => {
    const target = event.target;
    target.classList.add('dragging');
    event.dataTransfer.setData('text/plain', target.dataset.id);
};

const dragEnd = (event) => {
    const target = event.target;
    target.classList.remove('dragging');
};

const dragEnter = (event) => {
    event.currentTarget.classList.add('drop');
};

const dragLeave = (event) => {
    event.currentTarget.classList.remove('drop');
};

const drop = (event) => {
    event.preventDefault();
    const cardId = event.dataTransfer.getData('text/plain');
    const card = document.querySelector(`[data-id="${cardId}"]`);
    event.currentTarget.appendChild(card);
    event.currentTarget.classList.remove('drop');
    card.setAttribute('draggable', true);
    addDragAndDropListeners(card);
    saveState();
    updateColumnCounters();
    updateTimeouts();
};

const allowDrop = (event) => {
    event.preventDefault();
};

document.querySelectorAll('.column').forEach(column => {
    column.addEventListener('dragenter', dragEnter);
    column.addEventListener('dragleave', dragLeave);
    column.addEventListener('drop', drop);
    column.addEventListener('dragover', allowDrop);
});

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const card = e.target.closest('.card');
        card.remove();
        saveState();
    } else if (e.target.classList.contains('important-btn')) {
        const card = e.target.closest('.card');
        toggleImportant(card);
        saveState();
    } else if (e.target.closest('.card')) {
        openEditModal(e.target.closest('.card'));
    }
});

const toggleImportant = (card) => {
    card.classList.toggle('important');
    updateCardTitle(card);
};

const updateCardTitle = (card) => {
    const titleElement = card.querySelector('h3');
    const titleText = titleElement.textContent.trim();
    if (card.classList.contains('important')) {
        if (!titleText.startsWith('📍')) {
            titleElement.textContent = '📍 ' + titleText;
        }
    } else {
        titleElement.textContent = titleText.replace('📍 ', '');
    }
};

const openModalButton = document.getElementById('openModalButton');
const modal = document.getElementById('modal');
const closeModalButton = modal.querySelector('.close-button');
const modalForm = document.getElementById('modalForm');

openModalButton.addEventListener('click', () => {
    modal.style.display = 'block';
    updateColumnCounters();
});

closeModalButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

modalForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = document.getElementById('modalTitle').value;
    const text = document.getElementById('modalText').value;
    const date = document.getElementById('modalDate').value;
    const time = document.getElementById('modalTime').value;
    const column = document.querySelector('.column-todo');

    if (title.trim() && text.trim()) {
        const newCard = createCardElement({ id: cardId++, title, text, date, time });
        column.appendChild(newCard);
        modal.style.display = 'none';
        modalForm.reset();
        saveState();
        updateColumnCounters();
        checkDates(); 
        updateTimeouts();
    }
});

const createCardElement = ({ id, title, text, date, time }) => {
    const card = document.createElement('article');
    card.classList.add('card');
    card.draggable = true;
    card.dataset.id = id;
    card.innerHTML = `
        <h3>${title}</h3>
        <p>${text}</p>
        <div class="date">${date ? date : ''} ${time ? time : ''}</div>
    `;
    addDragAndDropListeners(card);
    card.addEventListener('click', () => openEditModal(card));
    return card;
};

const openEditModal = (card) => {
    editingCard = card;
    const [date, time] = card.querySelector('.date').textContent.trim().split(' ');
    document.getElementById('editModalTitle').value = card.querySelector('h3').textContent.replace('📍 ', '');
    document.getElementById('editModalText').value = card.querySelector('p').textContent;
    document.getElementById('editModalDate').value = date || '';
    document.getElementById('editModalTime').value = time || '';
    document.getElementById('editModal').style.display = 'block';
};

const closeEditModalButton = document.getElementById('closeEditModalButton');
const editModal = document.getElementById('editModal');
const editModalForm = document.getElementById('editModalForm');
const markImportantButton = document.getElementById('markImportantButton');
const deleteNoteButton = document.getElementById('deleteNoteButton');

closeEditModalButton.addEventListener('click', () => {
    editModal.style.display = 'none';
    editingCard = null;
});

window.addEventListener('click', (event) => {
    if (event.target === editModal) {
        editModal.style.display = 'none';
        editingCard = null;
    }
});

editModalForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = document.getElementById('editModalTitle').value;
    const text = document.getElementById('editModalText').value;
    const date = document.getElementById('editModalDate').value;
    const time = document.getElementById('editModalTime').value;

    if (editingCard && title.trim() && text.trim()) {
        editingCard.querySelector('h3').textContent = editingCard.classList.contains('important') ? '📍 ' + title : title;
        editingCard.querySelector('p').textContent = text;
        editingCard.querySelector('.date').textContent = `${date ? date : ''} ${time ? time : ''}`;
        editModal.style.display = 'none';
        editingCard = null;
        saveState();
        checkDates(); 
        updateTimeouts();
    }
});

markImportantButton.addEventListener('click', () => {
    if (editingCard) {
        toggleImportant(editingCard);
        saveState();
        editModal.style.display = 'none';
        editingCard = null;
    }
});

deleteNoteButton.addEventListener('click', () => {
    if (editingCard) {
        editingCard.remove();
        saveState();
        editModal.style.display = 'none';
        editingCard = null;
    }
});

const saveState = () => {
    const columns = document.querySelectorAll('.column');
    const state = Array.from(columns).map(column => {
        return Array.from(column.querySelectorAll('.card')).map(card => ({
            id: card.dataset.id,
            title: card.querySelector('h3').textContent,
            text: card.querySelector('p').textContent,
            date: card.querySelector('.date').textContent,
            important: card.classList.contains('important'),
            expired: card.classList.contains('expired')
        }));
    });
    localStorage.setItem('boardState', JSON.stringify(state));
};

const loadState = () => {
    const state = JSON.parse(localStorage.getItem('boardState'));
    if (state) {
        state.forEach((cards, columnIndex) => {
            const column = document.querySelectorAll('.column')[columnIndex];
            cards.forEach(cardData => {
                const card = createCardElement(cardData);
                column.appendChild(card);
                if (cardData.expired) {
                    markCardAsExpired(card);
                }
            });
        });
    }
};

const markCardAsExpired = (card) => {
    card.classList.add('expired');
    if (!card.querySelector('.expired-label')) {
        const expiredLabel = document.createElement('div');
        expiredLabel.classList.add('expired-label');
        expiredLabel.textContent = 'Срок истек';
        card.appendChild(expiredLabel);
    }
};

const updateColumnCounters = () => {
    document.querySelectorAll('.column').forEach(column => {
        const counter = column.querySelector('.counter');
        const cardCount = column.querySelectorAll('.card').length;
        counter.style.display = cardCount ? 'inline' : 'none';
        counter.textContent = cardCount;
    });
};

const checkDates = () => {
    const now = new Date();
    document.querySelectorAll('.card').forEach(card => {
        const dateText = card.querySelector('.date').textContent.trim();
        if (dateText && !card.classList.contains('expired')) {
            const [datePart, timePart] = dateText.split(' ');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute] = timePart ? timePart.split(':').map(Number) : [0, 0];
            const cardDate = new Date(year, month - 1, day, hour, minute);

            if (cardDate <= now) {
                showNotification(`Срок выполнения задачи: "${card.querySelector('h3').textContent}" подошёл к концу.`, card.dataset.id);
                expiredCards.add(card.dataset.id);
                markCardAsExpired(card);
                saveState();
            }
        }
    });
};

const showNotification = (message, cardId) => {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    notificationMessage.textContent = message;
    notification.style.display = 'block';

    const closeNotification = () => {
        notification.style.display = 'none';
        expiredCards.add(cardId);
        saveState();
    };

    const closeButton = document.getElementById('closeNotificationButton');
    closeButton.addEventListener('click', closeNotification, { once: true });
};

const updateTimeouts = () => {
    const now = new Date();
    document.querySelectorAll('.card').forEach(card => {
        const dateText = card.querySelector('.date').textContent.trim();
        if (dateText && !card.classList.contains('expired')) {
            const [datePart, timePart] = dateText.split(' ');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute] = timePart ? timePart.split(':').map(Number) : [0, 0];
            const cardDate = new Date(year, month - 1, day, hour, minute);
            const timeToExpire = cardDate - now;

            if (timeToExpire > 0) {
                setTimeout(() => {
                    showNotification(`Срок выполнения "${card.querySelector('h3').textContent}" подошёл к концу.`, card.dataset.id);
                    expiredCards.add(card.dataset.id);
                    markCardAsExpired(card);
                    saveState();
                }, timeToExpire);
            }
        }
    });
};

window.addEventListener('load', () => {
    loadState();
    updateColumnCounters();
    checkDates();
    updateTimeouts();
    setInterval(checkDates, 60000);
});
