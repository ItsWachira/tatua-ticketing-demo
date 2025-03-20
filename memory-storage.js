
const memoryTickets = [];




function storeFormDataInMemory(ticket) {
    
    memoryTickets.push(ticket);
}


function loadTicketsFromMemory() {
    
    let tickets = [...memoryTickets];
    
    
    tickets = applyFiltersAndSorts(tickets, activeFilters, activeSorts);
    
   
    renderTicketsToTable(tickets);
}


async function handleMemoryStorageSubmit(event) {
    event.preventDefault();
    
    const ticket = await createTicketFromForm();
    if (!ticket) return; 
    
    try {
        storeFormDataInMemory(ticket);
        resetForm(event.target);
        alert('Ticket submitted successfully and stored in memory!');
        switchView('ticketsList');
    } catch (error) {
        console.error('Error saving ticket to memory:', error);
        alert('Error saving ticket. Please try again.');
    }
}


function initMemoryStorage() {
   
    const form = document.getElementById('ticketForm');
    form.removeEventListener('submit', handleTicketSubmit);
    form.addEventListener('submit', handleMemoryStorageSubmit);
    
  
    window.originalLoadTickets = loadTickets;
    window.loadTickets = loadTicketsFromMemory;
    
    console.log('Memory storage mode activated');
}


