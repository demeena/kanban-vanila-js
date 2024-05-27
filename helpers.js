export let expiredCards = new Set();
let editingCard = null;

export const setEditingCard = (card) => {
    editingCard = card;
};

export const getEditingCard = () => {
    return editingCard;
};

export const addDragAndDropListeners = (element) => {
    element.addEventListener('dragstart', dragStart);
    element.addEventListener('dragend', dragEnd);
};

export const dragStart = (event) => {
    const target = event.target;
    target.classList.add('dragging');
    event.dataTransfer.setData('text/plain', target.dataset.id);
};

export const dragEnd = (event) => {
    const target = event.target;
    target.classList.remove('dragging');
};

export const handleDropEvent = (event, type) => {
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
    if (type === 'drop') {
        card.classList.remove('drop');
    }
};

export const allowDrop = (event) => event.preventDefault();

export const toggleImportant = (card) => {
    const titleElement = card.querySelector('h3');
    const titleText = titleElement.textContent.trim();

    if (card.classList.contains('important')) {
        card.classList.remove('important');
        titleElement.textContent = titleText.replace('📍 ', '');
    } else {
        card.classList.add('important');
        if (!titleText.startsWith('📍 ')) {
            titleElement.textContent = `📍 ${titleText}`;
        }
    }
};
export const updateCardTitle = (card) => {
    const titleElement = card.querySelector('h3');
    const titleText = titleElement.textContent.trim();
    if (card.classList.contains('important') && !titleText.startsWith('📍 ')) {
        titleElement.textContent = `📍 ${titleText}`;
    } else if (!card.classList.contains('important') && titleText.startsWith('📍 ')) {
        titleElement.textContent = titleText.replace('📍 ', '');
    }
};

export const createCardElement = ({ id, title, text, date, time }) => {
    console.log('Creating card element', { id, title, text, date, time });
    const card = document.createElement('article');
    card.classList.add('card');
    card.draggable = true;
    card.dataset.id = id;
    card.innerHTML = `
        <h3>${title}</h3>
        <p>${text}</p>
        <div class="date">${date ? date : ''} ${time ? time : ''}</div>
        <button class="important-btn">Важно</button>
        <button class="delete-btn">Удалить</button>
    `;
    addDragAndDropListeners(card);
    card.querySelector('.important-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleImportant(card);
        saveState();
    });
    card.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        card.remove();
        saveState();
    });
    card.addEventListener('click', () => openEditModal(card));
    return card;
};


export const openEditModal = (card) => {
    setEditingCard(card);
    const [date, time] = card.querySelector('.date').textContent.trim().split(' ');
    document.getElementById('editModalTitle').value = card.querySelector('h3').textContent.replace('📍 ', '');
    document.getElementById('editModalText').value = card.querySelector('p').textContent;
    document.getElementById('editModalDate').value = date || '';
    document.getElementById('editModalTime').value = time || '';
    document.getElementById('editModal').style.display = 'block';
};

export const saveState = () => {
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

export const loadState = () => {
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

export const markCardAsExpired = (card) => {
    card.classList.add('expired');
    if (!card.querySelector('.expired-label')) {
        const expiredLabel = document.createElement('div');
        expiredLabel.classList.add('expired-label');
        expiredLabel.textContent = 'Срок истек';
        card.appendChild(expiredLabel);
    }
};

export const updateColumnCounters = () => {
    document.querySelectorAll('.column').forEach(column => {
        const counter = column.querySelector('.counter');
        const cardCount = column.querySelectorAll('.card').length;
        counter.style.display = cardCount ? 'inline' : 'none';
        counter.textContent = cardCount;
    });
};

const handleCardExpiration = (card, now) => {
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
};

export const checkDates = () => {
    const now = new Date();
    document.querySelectorAll('.card').forEach(card => {
        handleCardExpiration(card, now);
    });
};

export const showNotification = (message, cardId) => {
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

export const updateTimeouts = () => {
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
