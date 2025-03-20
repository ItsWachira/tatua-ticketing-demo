
async function createTicketFromForm() {
    const file = document.getElementById('attachment').files[0];
    if (file) {
        const errorMessage = validateFile(file);
        if (errorMessage) {
            document.getElementById('fileError').textContent = errorMessage;
            return null;
        }
    }

    let fileData = null;
    let fileType = null;
    
    if (file) {
        fileData = await fileToBase64(file);
        fileType = file.type;
    }

  
    let nextId = 1;
    const existingTickets = getExistingTickets();
    
    if (existingTickets.length > 0) {
        
        const ids = existingTickets.map(ticket => {
            const id = parseInt(ticket.id);
            return isNaN(id) ? 0 : id;
        });
        const highestId = Math.max(...ids);
        nextId = highestId + 1;
    }

    return {
        id: nextId,
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value,
        preferredContact: document.querySelector('input[name="preferredContact"]:checked').value,
        fileData: fileData,
        fileName: file ? file.name : "",
        fileType: fileType,
        status: "New",
        createdDate: new Date().toLocaleString()
    };
}


function getExistingTickets() {
    const localTickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    const sessionTickets = JSON.parse(sessionStorage.getItem('tickets') || '[]');
    return [...localTickets, ...sessionTickets, ...memoryTickets];
}


function applyFiltersAndSorts(tickets, filters, sorts) {
    
    if (filters.length > 0) {
        tickets = tickets.filter(ticket => {
            return filters.every(filter => {
                const value = String(ticket[filter.field] || '');
                const filterValue = filter.value;
                
                switch (filter.operator) {
                    case 'equals':
                        return value.toLowerCase() === filterValue.toLowerCase();
                    case 'contains':
                        return value.toLowerCase().includes(filterValue.toLowerCase());
                    case 'startsWith':
                        return value.toLowerCase().startsWith(filterValue.toLowerCase());
                    case 'endsWith':
                        return value.toLowerCase().endsWith(filterValue.toLowerCase());
                    default:
                        return true;
                }
            });
        });
    }

  
    if (sorts.length > 0) {
        tickets.sort((a, b) => {
            for (const sort of sorts) {
                const field = sort.field;
                const direction = sort.direction;
                const valueA = String(a[field] || '');
                const valueB = String(b[field] || '');
                
                if (valueA < valueB) {
                    return direction === 'asc' ? -1 : 1;
                }
                if (valueA > valueB) {
                    return direction === 'asc' ? 1 : -1;
                }
            }
            return 0;
        });
    }
    
    return tickets;
}


function renderTicketsToTable(tickets) {
    const tableBody = document.getElementById('ticketBody');
    tableBody.innerHTML = '';

    if (tickets.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center;">No tickets found</td>';
        tableBody.appendChild(row);
        return;
    }

    tickets.forEach(ticket => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${ticket.id}</td>
            <td>
                <div class="ticket-info">
                    <div class="primary-info">${ticket.name}</div>
                    <div class="secondary-info">${ticket.email}</div>
                </div>
            </td>
            <td>
                <div class="ticket-info">
                    <div class="primary-info">${ticket.subject}</div>
                    <div class="secondary-info">${ticket.message.substring(0, 30)}${ticket.message.length > 30 ? '...' : ''}</div>
                </div>
            </td>
            <td>${ticket.createdDate}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" title="View Details" data-id="${ticket.id}">
                        <img src="assets/media/view-data-icon.png" alt="View" class="action-icon">
                    </button>
                    <button class="action-btn download-btn" title="Download Attachment" data-id="${ticket.id}" ${!ticket.fileData ? 'disabled' : ''}>
                        <img src="assets/media/download-icon.png" alt="Download" class="action-icon">
                    </button>
                    <button class="action-btn call-btn" title="Call" data-phone="${ticket.phone}" ${!ticket.phone ? 'disabled' : ''}>
                        <img src="assets/media/call-icon.png" alt="Call" class="action-icon">
                    </button>
                    <button class="action-btn email-btn" title="Email" data-email="${ticket.email}">
                        <img src="assets/media/email-icon.png" alt="Email" class="action-icon">
                    </button>
                    <button class="action-btn edit-btn" title="Edit" data-id="${ticket.id}">
                        <img src="assets/media/report-icon.png" alt="Edit" class="action-icon">
                    </button>
                    <button class="action-btn delete-btn" title="Delete" data-id="${ticket.id}">
                        <img src="assets/media/delete-icon.png" alt="Delete" class="action-icon">
                    </button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });


    attachActionButtonListeners();
}
