

// Store form data in session storage
function storeFormDataInSession(ticket) {
    
    const existingTickets = JSON.parse(sessionStorage.getItem('tickets') || '[]');

   
    existingTickets.push(ticket);
    
   
    sessionStorage.setItem('tickets', JSON.stringify(existingTickets));
}


function loadTicketsFromSession() {
    let tickets = JSON.parse(sessionStorage.getItem('tickets') || '[]');

    tickets = applyFiltersAndSorts(tickets, activeFilters, activeSorts);
    
   
    renderTicketsToTable(tickets);
}

async function handleSessionStorageSubmit(event) {
    event.preventDefault();
    
    const ticket = await createTicketFromForm();
    if (!ticket) return; 
    
    try {
        storeFormDataInSession(ticket);
        resetForm(event.target);
        alert('Ticket submitted successfully and stored in session storage!');
        switchView('ticketsList');
    } catch (error) {
        console.error('Error saving ticket to session storage:', error);
        alert('Error saving ticket. Please try again.');
    }
}


function initSessionStorage(loadTicketsFunction) {
    
    const form = document.getElementById('ticketForm');
    form.removeEventListener('submit', handleTicketSubmit);
    form.addEventListener('submit', handleSessionStorageSubmit);
    
   
    window.originalLoadTickets = loadTicketsFunction || window.loadTickets;
    window.loadTickets = function() {
        
    };
    
    console.log('Session storage mode activated');
}
