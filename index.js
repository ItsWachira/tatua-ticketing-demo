
let activeFilters = [];
let activeSorts = [];
let encryptionKey;

// View switching
function switchView(view) {
    if (view === 'raiseTicket') {
        document.getElementById('raiseTicketView').style.display = 'block';
        document.getElementById('ticketsListView').style.display = 'none';
        document.getElementById('showForm').classList.add('active');
        document.getElementById('showList').classList.remove('active');
    } else {
        document.getElementById('raiseTicketView').style.display = 'none';
        document.getElementById('ticketsListView').style.display = 'block';
        document.getElementById('showForm').classList.remove('active');
        document.getElementById('showList').classList.add('active');
        loadTickets();
    }
}

// File validation
function validateFile(file) {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; 
    
    if (!allowedTypes.includes(file.type)) {
        return 'Only PDF and image files (PNG, JPEG) are allowed.';
    }
    
    if (file.size > maxSize) {
        return 'File size must be less than 5MB.';
    }
    
    return null;
}

// Convert file to base64 for storage
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Helper function to set select element value
function setSelectValue(selectElement, value) {
    for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].value === value) {
            selectElement.selectedIndex = i;
            break;
        }
    }
}

// Generic function to add a new row to a container
function addRow(container, rowSelector, removeButtonSelector) {
    const newRow = container.querySelector(rowSelector).cloneNode(true);
    
    // Clear input values
    newRow.querySelectorAll('input[type="text"]').forEach(input => {
        input.value = '';
    });
    
    // Reset select elements
    newRow.querySelectorAll('select').forEach(select => {
        select.selectedIndex = 0;
    });
    
    // Add event listener to remove button
    newRow.querySelector(removeButtonSelector).addEventListener('click', function() {
        if (container.querySelectorAll(rowSelector).length > 1) {
            container.removeChild(newRow);
        }
    });
    
    container.appendChild(newRow);
    return newRow;
}

// Generic function to handle modal display
function toggleModal(modalId, display) {
    document.getElementById(modalId).style.display = display ? 'flex' : 'none';
}

// Function to update indicators
function updateIndicator(indicatorId, items) {
    const indicator = document.getElementById(indicatorId);
    
    if (items && items.length > 0) {
        indicator.classList.remove('hidden');
        indicator.querySelector('.indicator-text').textContent = items.length;
    } else {
        indicator.classList.add('hidden');
    }
}

// Update both indicators
function updateIndicators() {
    updateIndicator('activeFilterIndicator', activeFilters);
    updateIndicator('activeSortIndicator', activeSorts);
}

// Load tickets function
function loadTickets() {
    let tickets = JSON.parse(localStorage.getItem('tickets') || '[]');

    // Apply filters
    if (activeFilters.length > 0) {
        tickets = tickets.filter(ticket => {
            return activeFilters.every(filter => {
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
                    case 'greaterThan':
                        if (filter.field === 'createdDate') {
                            return new Date(value) > new Date(filterValue);
                        }
                        return parseFloat(value) > parseFloat(filterValue);
                    case 'lessThan':
                        if (filter.field === 'createdDate') {
                            return new Date(value) < new Date(filterValue);
                        }
                        return parseFloat(value) < parseFloat(filterValue);
                    default:
                        return true;
                }
            });
        });
    }

    // Apply sorting
    if (activeSorts.length > 0) {
        tickets.sort((a, b) => {
            for (const sort of activeSorts) {
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

  
    updateIndicators();

    // Render tickets
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

    // Add event listeners to action buttons using event delegation
    attachActionButtonListeners();
}

// Attach action button listeners using event delegation
function attachActionButtonListeners() {
    const tableBody = document.getElementById('ticketBody');
    
    // Remove existing listeners to prevent duplicates
    const newTableBody = tableBody.cloneNode(true);
    tableBody.parentNode.replaceChild(newTableBody, tableBody);
    
    // Add event delegation
    newTableBody.addEventListener('click', function(event) {
        const target = event.target.closest('.action-btn');
        if (!target) return;
        
        const ticketId = target.getAttribute('data-id');
        
        if (target.classList.contains('view-btn')) {
            showTicketDetails(ticketId);
        } else if (target.classList.contains('download-btn')) {
            downloadAttachment(ticketId);
        } else if (target.classList.contains('call-btn')) {
            const phone = target.getAttribute('data-phone');
            window.location.href = `tel:${phone}`;
        } else if (target.classList.contains('email-btn')) {
            const email = target.getAttribute('data-email');
            window.location.href = `mailto:${email}`;
        } else if (target.classList.contains('edit-btn')) {
            editTicket(ticketId);
        } else if (target.classList.contains('delete-btn')) {
            deleteTicket(ticketId);
        }
    });
}

// Function to show ticket details
function showTicketDetails(ticketId) {
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    const ticket = tickets.find(t => t.id == ticketId);

    if (!ticket) {
        alert('Ticket not found');
        return;
    }

    const detailsContent = document.getElementById('ticketDetailsContent');

    let attachmentPreview = '';
    if (ticket.fileData) {
        if (ticket.fileType.startsWith('image/')) {
            attachmentPreview = `
                <div class="attachment-preview">
                    <img src="${ticket.fileData}" alt="Attachment">
                </div>
            `;
        } else if (ticket.fileType === 'application/pdf') {
            attachmentPreview = `
                <div class="attachment-preview">
                    <p>PDF Document: ${ticket.fileName}</p>
                    <a href="${ticket.fileData}" download="${ticket.fileName}" class="modal-btn">Download PDF</a>
                </div>
            `;
        }
    }

    detailsContent.innerHTML = `
        <div class="detail-row">
            <div class="detail-label">ID</div>
            <div class="detail-value">${ticket.id}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Name</div>
            <div class="detail-value">${ticket.name}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Email</div>
            <div class="detail-value">${ticket.email}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Phone</div>
            <div class="detail-value">${ticket.phone || 'Not provided'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Subject</div>
            <div class="detail-value">${ticket.subject}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Message</div>
            <div class="detail-value">${ticket.message}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Preferred Contact</div>
            <div class="detail-value">${ticket.preferredContact}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Status</div>
            <div class="detail-value">${ticket.status}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Date Created</div>
            <div class="detail-value">${ticket.createdDate}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Attachment</div>
            <div class="detail-value">${ticket.fileName || 'No attachment'}</div>
        </div>
        ${attachmentPreview}
    `;

    // Show modal
    toggleModal('ticketDetailsModal', true);
}

// Function to download attachment
function downloadAttachment(ticketId) {
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    const ticket = tickets.find(t => t.id == ticketId);

    if (!ticket || !ticket.fileData) {
        alert('No attachment found');
        return;
    }

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = ticket.fileData;
    link.download = ticket.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to delete ticket
function deleteTicket(ticketId) {
    if (confirm('Are you sure you want to delete this ticket?')) {
        const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
        const updatedTickets = tickets.filter(t => t.id != ticketId);

        localStorage.setItem('tickets', JSON.stringify(updatedTickets));
        loadTickets();

        alert('Ticket deleted successfully');
    }
}

// Function to open the filter modal
function openFilterModal() {
    const filterContainer = document.getElementById('filterContainer');
    
  
    while (filterContainer.querySelectorAll('.filter-row').length > 1) {
        filterContainer.removeChild(filterContainer.lastChild);
    }
    
    // Reset the first row
    const firstRow = filterContainer.querySelector('.filter-row');
    firstRow.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
    firstRow.querySelector('.filter-value').value = '';
    
    // If there are active filters, populate the modal with them
    if (activeFilters.length > 0) {
        
        const firstFilter = activeFilters[0];
        setSelectValue(firstRow.querySelector('.filter-field'), firstFilter.field);
        setSelectValue(firstRow.querySelector('.filter-operator'), firstFilter.operator);
        firstRow.querySelector('.filter-value').value = firstFilter.value;
        
    
        for (let i = 1; i < activeFilters.length; i++) {
            const filter = activeFilters[i];
            const newRow = addRow(filterContainer, '.filter-row', '.remove-filter-btn');
            
            setSelectValue(newRow.querySelector('.filter-field'), filter.field);
            setSelectValue(newRow.querySelector('.filter-operator'), filter.operator);
            newRow.querySelector('.filter-value').value
            setSelectValue(newRow.querySelector('.filter-field'), filter.field);
            setSelectValue(newRow.querySelector('.filter-operator'), filter.operator);
            newRow.querySelector('.filter-value').value = filter.value;
        }
    }
    
  
    toggleModal('filterModal', true);
}

// Function to open the sort modal
function openSortModal() {
    const sortContainer = document.getElementById('sortContainer');

    while (sortContainer.querySelectorAll('.sort-row').length > 1) {
        sortContainer.removeChild(sortContainer.lastChild);
    }
    

    const firstRow = sortContainer.querySelector('.sort-row');
    firstRow.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
    
    
    if (activeSorts.length > 0) {
 
        const firstSort = activeSorts[0];
        setSelectValue(firstRow.querySelector('.sort-field'), firstSort.field);
        setSelectValue(firstRow.querySelector('.sort-direction'), firstSort.direction);
        
      
        for (let i = 1; i < activeSorts.length; i++) {
            const sort = activeSorts[i];
            const newRow = addRow(sortContainer, '.sort-row', '.remove-sort-btn');
            
            setSelectValue(newRow.querySelector('.sort-field'), sort.field);
            setSelectValue(newRow.querySelector('.sort-direction'), sort.direction);
        }
    }
    
    
    toggleModal('sortModal', true);
}

// Function to edit ticket
function editTicket(ticketId) {
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    const ticketIndex = tickets.findIndex(t => t.id == ticketId);

    if (ticketIndex === -1) {
        alert('Ticket not found');
        return;
    }

    const ticket = tickets[ticketIndex];

  
    document.getElementById('name').value = ticket.name;
    document.getElementById('email').value = ticket.email;
    document.getElementById('phone').value = ticket.phone || '';
    document.getElementById('subject').value = ticket.subject;
    document.getElementById('message').value = ticket.message;


    if (ticket.preferredContact === 'email') {
        document.getElementById('contactEmail').checked = true;
        document.querySelector('[data-for="contactEmail"]').classList.add('selected');
        document.querySelector('[data-for="contactPhone"]').classList.remove('selected');
    } else {
        document.getElementById('contactPhone').checked = true;
        document.querySelector('[data-for="contactPhone"]').classList.add('selected');
        document.querySelector('[data-for="contactEmail"]').classList.remove('selected');
    }


    if (ticket.fileName) {
        document.getElementById('fileName').textContent = ticket.fileName;
    }

   
    switchView('raiseTicket');

 
    const form = document.getElementById('ticketForm');


    const oldForm = form.cloneNode(true);
    form.parentNode.replaceChild(oldForm, form);

 
    oldForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const file = document.getElementById('attachment').files[0];
        let fileData = ticket.fileData;
        let fileType = ticket.fileType;
        let fileName = ticket.fileName;

        if (file) {
            const errorMessage = validateFile(file);
            if (errorMessage) {
                document.getElementById('fileError').textContent = errorMessage;
                return;
            }
            
            fileData = await fileToBase64(file);
            fileType = file.type;
            fileName = file.name;
        }


        tickets[ticketIndex] = {
            ...ticket,
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value,
            preferredContact: document.querySelector('input[name="preferredContact"]:checked').value,
            fileData: fileData,
            fileName: fileName,
            fileType: fileType
        };

        localStorage.setItem('tickets', JSON.stringify(tickets));

        resetForm(event.target);
        alert('Ticket updated successfully!');
        switchView('ticketsList');

      
        const newForm = oldForm.cloneNode(true);
        oldForm.parentNode.replaceChild(newForm, oldForm);

 
        document.getElementById('ticketForm').addEventListener('submit', handleTicketSubmit);
    });
}

// Reset form helper function
function resetForm(form) {
    form.reset();
    document.getElementById('fileName').textContent = 'No file chosen';
    document.getElementById('fileError').textContent = '';
}
  // Handle ticket submission
  async function handleTicketSubmit(event) {
    event.preventDefault();
    
    const file = document.getElementById('attachment').files[0];
    if (file) {
        const errorMessage = validateFile(file);
        if (errorMessage) {
            document.getElementById('fileError').textContent = errorMessage;
            return;
        }
    }

    let fileData = null;
    let fileType = null;
    
    if (file) {
        fileData = await fileToBase64(file);
        fileType = file.type;
    }


    const existingTickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    
 
    let nextId = 1;
    if (existingTickets.length > 0) {
        
        const ids = existingTickets.map(ticket => {
            const id = parseInt(ticket.id);
            return isNaN(id) ? 0 : id; 
        });
        const highestId = Math.max(...ids);
        nextId = highestId + 1;
    }



    const ticket = {
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

    try {
        existingTickets.push(ticket);
        localStorage.setItem('tickets', JSON.stringify(existingTickets));

        resetForm(event.target);
        alert('Ticket submitted successfully!');
        switchView('ticketsList');
    } catch (error) {
        console.error('Error saving ticket:', error);
        alert('Error saving ticket. Please try again.');
    }
}
// Apply filters from modal
function applyFilters() {
    const filters = [];
    
    document.querySelectorAll('.filter-row').forEach(row => {
        const field = row.querySelector('.filter-field').value;
        const operator = row.querySelector('.filter-operator').value;
        const value = row.querySelector('.filter-value').value.trim();
        
        if (field && operator && value) {
            filters.push({ field, operator, value });
        }
    });
    
    activeFilters = filters;
    loadTickets();
    toggleModal('filterModal', false);
}

// Apply sorts from modal
function applySorts() {
    const sorts = [];
    
    document.querySelectorAll('.sort-row').forEach(row => {
        const field = row.querySelector('.sort-field').value;
        const direction = row.querySelector('.sort-direction').value;
        
        if (field && direction) {
            sorts.push({ field, direction });
        }
    });
    
    activeSorts = sorts;
    loadTickets();
    toggleModal('sortModal', false);
}

// Reset filters
function resetFilters() {
    const filterContainer = document.getElementById('filterContainer');
    
   
    while (filterContainer.querySelectorAll('.filter-row').length > 1) {
        filterContainer.removeChild(filterContainer.lastChild);
    }
    

    const firstRow = filterContainer.querySelector('.filter-row');
    firstRow.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
    firstRow.querySelector('.filter-value').value = '';
}

// Reset sorts
function resetSorts() {
    const sortContainer = document.getElementById('sortContainer');
    
    
    while (sortContainer.querySelectorAll('.sort-row').length > 1) {
        sortContainer.removeChild(sortContainer.lastChild);
    }
    

    const firstRow = sortContainer.querySelector('.sort-row');
    firstRow.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
}

// Clear all filters
function clearAllFilters() {
    activeFilters = [];
    loadTickets();
}

// Clear all sorts
function clearAllSorts() {
    activeSorts = [];
    loadTickets();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.style.display = 'none';
       
    });
    initStorageSwitching();
    document.getElementById('showForm').addEventListener('click', () => switchView('raiseTicket'));
    document.getElementById('showList').addEventListener('click', () => switchView('ticketsList'));

    document.getElementById('attachment').addEventListener('change', function(event) {
        const fileName = event.target.files[0] ? event.target.files[0].name : 'No file chosen';
        document.getElementById('fileName').textContent = fileName;
        document.getElementById('fileError').textContent = '';
    });
    
    // Custom radio buttons
    document.querySelectorAll('.radio-custom').forEach(function(radio) {
        radio.addEventListener('click', function() {
            const forInput = this.getAttribute('data-for');
            document.getElementById(forInput).checked = true;
            
            document.querySelectorAll('.radio-custom').forEach(function(r) {
                r.classList.remove('selected');
            });
            
            this.classList.add('selected');
        });
    });
    
    // Custom checkboxes
    document.querySelectorAll('.checkbox-custom').forEach(function(checkbox) {
        checkbox.addEventListener('click', function() {
            const forInput = this.getAttribute('data-for');
            const checkboxInput = document.getElementById(forInput);
            checkboxInput.checked = !checkboxInput.checked;
            
            if (checkboxInput.checked) {
                this.classList.add('selected');
            } else {
                this.classList.remove('selected');
            }
        });
    });
    
    document.getElementById('ticketForm').addEventListener('submit', handleTicketSubmit);
    
 
    document.querySelectorAll('.close-modal').forEach(element => {
        element.addEventListener('click', function() {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
   
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    });
    

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function() {
            this.style.display = 'none';
        });
    });
    

    document.getElementById('filterBtn').addEventListener('click', openFilterModal);
    

    document.querySelector('.add-filter-btn').addEventListener('click', function() {
        addRow(document.getElementById('filterContainer'), '.filter-row', '.remove-filter-btn');
    });
    
    
    document.querySelectorAll('.remove-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filterContainer = document.getElementById('filterContainer');
            if (filterContainer.querySelectorAll('.filter-row').length > 1) {
                this.closest('.filter-row').remove();
            }
        });
    });
    
    
    document.querySelector('#filterModal .confirm-btn').addEventListener('click', applyFilters);
    
    
    document.querySelector('#filterModal .reset-btn').addEventListener('click', resetFilters);
    
    
    document.getElementById('sortBtn').addEventListener('click', openSortModal);
    
    
    document.querySelector('.add-sort-btn').addEventListener('click', function() {
        addRow(document.getElementById('sortContainer'), '.sort-row', '.remove-sort-btn');
    });
    
    document.querySelectorAll('.remove-sort-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const sortContainer = document.getElementById('sortContainer');
            if (sortContainer.querySelectorAll('.sort-row').length > 1) {
                this.closest('.sort-row').remove();
            }
        });
    });
    
    
    document.querySelector('#sortModal .confirm-btn').addEventListener('click', applySorts);
    
    
    document.querySelector('#sortModal .reset-btn').addEventListener('click', resetSorts);
    

    document.getElementById('clearFilter').addEventListener('click', function(e) {
        e.stopPropagation();
        clearAllFilters();
    });


    document.getElementById('clearSort').addEventListener('click', function(e) {
        e.stopPropagation();
        clearAllSorts();
    });
    

    document.getElementById('refreshBtn').addEventListener('click', loadTickets);
    
    
    document.querySelector('#activeSortIndicator .indicator-label').addEventListener('click', function(e) {
        e.stopPropagation();
        openSortModal();
    });
    
    
    document.querySelector('#activeFilterIndicator .indicator-label').addEventListener('click', function(e) {
        e.stopPropagation();
        openFilterModal();
    });
    
    
    switchView('raiseTicket');
});


// Storage type switching
function initStorageSwitching() {
    const storageSelector = document.getElementById('storageType');
    
    
    const currentStorage = localStorage.getItem('preferredStorageType') || 'local';
    storageSelector.value = currentStorage;
    
   
    applyStorageType(currentStorage);
    
    storageSelector.addEventListener('change', function() {
        const storageType = this.value;
        localStorage.setItem('preferredStorageType', storageType);
        applyStorageType(storageType);
        
   
        loadTickets();
    });
}


// Apply the selected storage type
function applyStorageType(storageType) {
    
    if (window.originalLoadTickets) {
        window.loadTickets = window.originalLoadTickets;
    }
    
    
    const form = document.getElementById('ticketForm');
    form.removeEventListener('submit', handleSessionStorageSubmit);
    form.removeEventListener('submit', handleMemoryStorageSubmit);
    form.removeEventListener('submit', handleEncryptedSubmit);
    form.addEventListener('submit', handleTicketSubmit);
    

    switch (storageType) {
        case 'encrypted':
            console.log('Switching to Encrypted Storage');
            initEncryptedStorage();
            break;
        case 'session':
            console.log('Switching to Session Storage');
            initSessionStorage();
            break;
        case 'memory':
            console.log('Switching to Memory Storage');
            initMemoryStorage();
            break;
        default:
            console.log('Switching to Local Storage');
            break;
    }
}


