// Function to generate an AES
async function generateKey() {
    return await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}


async function encryptData(data, key) {

    if (data.length > 5000000) { 
        throw new Error("Data too large to encrypt. Maximum size is 5MB.");
    }
    
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12)); 

    try {
        const encryptedData = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            key,
            encoder.encode(data)
        );

   
        return {
            iv: btoa(String.fromCharCode.apply(null, iv)), 
            encrypted: btoa(arrayBufferToString(encryptedData))
        };
    } catch (error) {
        console.error("Encryption error:", error);
        throw new Error("Failed to encrypt data: " + error.message);
    }
}

// Helper function to safely convert ArrayBuffer to string
function arrayBufferToString(buffer) {
    const bytes = new Uint8Array(buffer);
    let result = '';
    const chunkSize = 8192; 
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        result += String.fromCharCode.apply(null, chunk);
    }
    
    return result;
}
// Function to decrypt data using AES-GCM
async function decryptData(encryptedObj, key) {
    const decoder = new TextDecoder();
    const iv = new Uint8Array(atob(encryptedObj.iv).split("").map(c => c.charCodeAt(0)));
    const encryptedData = new Uint8Array(atob(encryptedObj.encrypted).split("").map(c => c.charCodeAt(0)));

    const decryptedData = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encryptedData
    );

    return decoder.decode(decryptedData);
}

// Initialize encrypted storage
async function initEncryptedStorage() {
    console.log("Initializing encrypted storage");
   
    if (!window.encryptionKey) {
        window.encryptionKey = await generateKey();
    }
    
    window.originalLoadTickets = window.loadTickets;
    
   
    window.loadTickets = async function() {
        try {
        
            const encryptedData = localStorage.getItem('encryptedTickets');
            let tickets = [];
            
            if (encryptedData) {
              
                const decryptedData = await decryptData(JSON.parse(encryptedData), window.encryptionKey);
                tickets = JSON.parse(decryptedData);
            }
            
          
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

         
            attachActionButtonListeners();
            
        } catch (error) {
            console.error("Error loading encrypted tickets:", error);
            
            if (window.originalLoadTickets) {
                window.originalLoadTickets();
            }
        }
    };
    
   
    const form = document.getElementById('ticketForm');
    form.removeEventListener('submit', handleTicketSubmit);
    form.addEventListener('submit', handleEncryptedSubmit);
}
  // Handle encrypted ticket submission
  async function handleEncryptedSubmit(event) {
      event.preventDefault();
    
      try {
          const file = document.getElementById('attachment').files[0];
          if (file) {
              const errorMessage = validateFile(file);
              if (errorMessage) {
                  document.getElementById('fileError').textContent = errorMessage;
                  return;
              }
            
             
              if (file.size > 2 * 1024 * 1024) { 
                  document.getElementById('fileError').textContent = 
                      "File too large for encrypted storage. Maximum size is 2MB.";
                  return;
              }
          }

          let fileData = null;
          let fileType = null;
          let fileName = "";
        
          if (file) {
              try {
                  fileData = await fileToBase64(file);
                  fileType = file.type;
                  fileName = file.name;
              } catch (fileError) {
                  console.error("Error processing file:", fileError);
                  document.getElementById('fileError').textContent = 
                      "Error processing file. Please try a smaller file.";
                  return;
              }
          }

          // Get existing tickets
          let existingTickets = [];
          const encryptedData = localStorage.getItem('encryptedTickets');
        
          if (encryptedData) {
              try {
                  const decryptedData = await decryptData(JSON.parse(encryptedData), window.encryptionKey);
                  existingTickets = JSON.parse(decryptedData);
              } catch (decryptError) {
                  console.error("Error decrypting existing tickets:", decryptError);
                  
                  existingTickets = [];
              }
          }
     
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
              fileName: fileName,
              fileType: fileType,
              status: "New",
              createdDate: new Date().toLocaleString()
          };

        
          existingTickets.push(ticket);
        
       
          const ticketsJson = JSON.stringify(existingTickets);
        
          
          if (ticketsJson.length > 5000000) { 
              throw new Error("Total data size too large for encryption. Please delete some tickets first.");
          }
        
         
          const encryptedObj = await encryptData(ticketsJson, window.encryptionKey);
          localStorage.setItem('encryptedTickets', JSON.stringify(encryptedObj));

         
          resetForm(event.target);
          alert('Ticket submitted successfully!');
          switchView('ticketsList');
        
      } catch (error) {
          console.error('Error saving encrypted ticket:', error);
          alert('Error saving ticket: ' + error.message);
      }
  }

async function deleteEncryptedTicket(ticketId) {
    if (confirm('Are you sure you want to delete this ticket?')) {
        try {
           
            const encryptedData = localStorage.getItem('encryptedTickets');
            if (!encryptedData) {
                alert('No tickets found');
                return;
            }
            
         
            const decryptedData = await decryptData(JSON.parse(encryptedData), window.encryptionKey);
            const tickets = JSON.parse(decryptedData);
          
            const updatedTickets = tickets.filter(t => t.id != ticketId);
            
            
            const encryptedObj = await encryptData(JSON.stringify(updatedTickets), window.encryptionKey);
            localStorage.setItem('encryptedTickets', JSON.stringify(encryptedObj));
            
          
            await loadTickets();
            
            alert('Ticket deleted successfully');
            
        } catch (error) {
            console.error('Error deleting encrypted ticket:', error);
            alert('Error deleting ticket. Please try again.');
        }
    }
}