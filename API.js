
const API_BASE_URL = 'https://services.odata.org/TripPinRESTierService/(S(zmvnmwolerxlglf1jhdcrgek))';
const PEOPLE_ENDPOINT = '/People';
const DEFAULT_PAGE_SIZE = 10;


let peopleCurrentPage = 1;
let peoplePageSize = DEFAULT_PAGE_SIZE;
let peopleTotalCount = 0;
let peopleActiveFilters = [];
let peopleActiveSorts = [];

document.addEventListener('DOMContentLoaded', function() {

    document.getElementById('peopleSortBtn').addEventListener('click', openPeopleSortModal);
    document.getElementById('peopleFilterBtn').addEventListener('click', openPeopleFilterModal);
    document.getElementById('peopleRefreshBtn').addEventListener('click', loadPeopleData);
    
  
    document.getElementById('clearPeopleSort').addEventListener('click', function(e) {
        e.stopPropagation(); 
        clearPeopleSorts();
    });
    
    document.getElementById('clearPeopleFilter').addEventListener('click', function(e) {
        e.stopPropagation(); 
        clearPeopleFilters();
    });
    
 
    document.getElementById('peopleActiveSortIndicator').addEventListener('click', function(e) {
   
        if (!e.target.matches('#clearPeopleSort')) {
            openPeopleSortModal();
        }
    });
    
    document.getElementById('peopleActiveFilterIndicator').addEventListener('click', function(e) {
       
        if (!e.target.matches('#clearPeopleFilter')) {
            openPeopleFilterModal();
        }
    });
    
    document.getElementById('prevPage').addEventListener('click', () => navigatePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => navigatePage(1));
  
    document.getElementById('addPeopleFilterBtn').addEventListener('click', function() {
        addRow(document.getElementById('peopleFilterContainer'), '.filter-row', '.remove-filter-btn');
    });
    document.getElementById('resetPeopleFilterBtn').addEventListener('click', resetPeopleFilters);
    document.getElementById('applyPeopleFilterBtn').addEventListener('click', applyPeopleFilters);
    
 
    document.getElementById('addPeopleSortBtn').addEventListener('click', function() {
        addRow(document.getElementById('peopleSortContainer'), '.sort-row', '.remove-sort-btn');
    });
    document.getElementById('resetPeopleSortBtn').addEventListener('click', resetPeopleSorts);
    document.getElementById('applyPeopleSortBtn').addEventListener('click', applyPeopleSorts);
    
   
    document.querySelectorAll('#peopleFilterModal .close-modal, #peopleSortModal .close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.closest('.modal-overlay').id;
            toggleModal(modalId, false);
        });
    });
    
  
    addPageSizeControls();
    

    fetchAllPeople();
});


function addPageSizeControls() {
 
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'page-size-controls';
    
   
    controlsContainer.innerHTML = `
        <div class="page-size-input-group">
            <label for="pageSize">Records per page:</label>
            <input type="number" id="pageSize" min="1" max="100" value="${peoplePageSize}">
            <button id="applyPageSize" class="page-size-btn">Apply</button>
        </div>
        <button id="fetchAllBtn" class="fetch-all-btn">
            Fetch All People
        </button>
    `;
    
  
    const paginationControls = document.querySelector('#peopleDataView .pagination-controls');
    

    paginationControls.parentNode.insertBefore(controlsContainer, paginationControls);
    

    document.getElementById('applyPageSize').addEventListener('click', function() {
        const newPageSize = parseInt(document.getElementById('pageSize').value);
        if (newPageSize > 0) {
            peoplePageSize = newPageSize;
            peopleCurrentPage = 1; 
            loadPeopleData();
        }
    });
    
    // Add keypress event to allow Enter key to apply page size
    document.getElementById('pageSize').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('applyPageSize').click();
        }
    });
    
    document.getElementById('fetchAllBtn').addEventListener('click', fetchAllPeople);
}

// Fetch all people to get the total count
function fetchAllPeople() {
    const tableBody = document.getElementById('peopleBody');
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading all people data...</td></tr>';
    
    // Build the OData query URL to get all people
    let url = `${API_BASE_URL}${PEOPLE_ENDPOINT}?$count=true`;
    
    // Add select to only get the fields we need
    url += '&$select=UserName,FirstName,LastName,MiddleName,Gender,Age';
    
    console.log("Fetching all people data from:", url);
    
    // Fetch data from the API
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("All people data received:", data);
            
            
            if (data['@odata.count']) {
                peopleTotalCount = data['@odata.count'];
            } else {
                peopleTotalCount = data.value.length;
            }
            
          
            renderPeopleData(data.value);
            
       
            updatePaginationInfo();
            
          
            updatePeopleIndicators();
            
          
        })
        .catch(error => {
            console.error('Error fetching all people data:', error);
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Error loading data: ${error.message}</td></tr>`;
        });
}


function loadPeopleData() {
    const tableBody = document.getElementById('peopleBody');
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading data...</td></tr>';
    
 
    let url = `${API_BASE_URL}${PEOPLE_ENDPOINT}?$count=true&$top=${peoplePageSize}&$skip=${(peopleCurrentPage - 1) * peoplePageSize}`;
    
    
    url += '&$select=UserName,FirstName,LastName,MiddleName,Gender,Age';
    
    
    if (peopleActiveFilters.length > 0) {
        const filterQueries = peopleActiveFilters.map(filter => {
            const { field, operator, value } = filter;
            
          
            switch (operator) {
                case 'eq':
                    return `${field} eq '${value}'`;
                case 'contains':
                    return `contains(${field}, '${value}')`;
                case 'startswith':
                    return `startswith(${field}, '${value}')`;
                case 'endswith':
                    return `endswith(${field}, '${value}')`;
                case 'gt':
                 
                    if (field === 'Age') {
                        return `${field} gt ${value}`;
                    }
                    return `${field} gt '${value}'`;
                case 'lt':
                  
                    if (field === 'Age') {
                        return `${field} lt ${value}`;
                    }
                    return `${field} lt '${value}'`;
                default:
                    return '';
            }
        }).filter(query => query !== '');
        
        if (filterQueries.length > 0) {
            url += `&$filter=${filterQueries.join(' and ')}`;
        }
    }
    

    if (peopleActiveSorts.length > 0) {
        const sortQueries = peopleActiveSorts.map(sort => {
            return `${sort.field} ${sort.direction}`;
        });
        
        if (sortQueries.length > 0) {
            url += `&$orderby=${sortQueries.join(',')}`;
        }
    }
    
    console.log("data:", url);
    
   
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Data received:", data);
     
            if (data['@odata.count']) {
                peopleTotalCount = data['@odata.count'];
            }
            
            
            renderPeopleData(data.value);
            
         
            updatePaginationInfo();
            
          
            updatePeopleIndicators();
        })
        .catch(error => {
            console.error('Error fetching people data:', error);
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Error loading data: ${error.message}</td></tr>`;
        });
}


function renderPeopleData(people) {
    const tableBody = document.getElementById('peopleBody');
    tableBody.innerHTML = '';
    
    if (people.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No people found</td></tr>';
        return;
    }
    
    people.forEach(person => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${person.UserName || ''}</td>
            <td>${person.FirstName || ''}</td>
            <td>${person.LastName || ''}</td>
            <td>${person.MiddleName || ''}</td>
            <td>${person.Gender || ''}</td>
            <td>${person.Age || ''}</td>
        `;
        
        tableBody.appendChild(row);
    });
}


function updatePaginationInfo() {
    const pageInfo = document.getElementById('pageInfo');
    const totalPages = Math.ceil(peopleTotalCount / peoplePageSize);
    
    pageInfo.textContent = `Page ${peopleCurrentPage} of ${totalPages || 1} (Total: ${peopleTotalCount} records)`;
    

    document.getElementById('prevPage').disabled = peopleCurrentPage <= 1;
    document.getElementById('nextPage').disabled = peopleCurrentPage >= totalPages;
    
   
    document.getElementById('pageSize').value = peoplePageSize;
}


function navigatePage(direction) {
    const newPage = peopleCurrentPage + direction;
    if (newPage < 1) return;
    
    const totalPages = Math.ceil(peopleTotalCount / peoplePageSize);
    if (totalPages > 0 && newPage > totalPages) return;
    
    peopleCurrentPage = newPage;
    loadPeopleData();
}


function updatePeopleIndicators() {
  
    const filterIndicator = document.getElementById('peopleActiveFilterIndicator');
    if (peopleActiveFilters && peopleActiveFilters.length > 0) {
        filterIndicator.classList.remove('hidden');
        filterIndicator.querySelector('.indicator-text').textContent = peopleActiveFilters.length;
        
      
        const indicatorLabel = filterIndicator.querySelector('.indicator-label');
        
   
        const newIndicatorLabel = indicatorLabel.cloneNode(true);
        indicatorLabel.parentNode.replaceChild(newIndicatorLabel, indicatorLabel);
        
       
        newIndicatorLabel.addEventListener('click', function(e) {
            e.stopPropagation();
            openPeopleFilterModal();
        });
        
       
        newIndicatorLabel.style.cursor = 'pointer';
        newIndicatorLabel.title = 'Click to edit filters';
    } else {
        filterIndicator.classList.add('hidden');
    }
    

    const sortIndicator = document.getElementById('peopleActiveSortIndicator');
    if (peopleActiveSorts && peopleActiveSorts.length > 0) {
        sortIndicator.classList.remove('hidden');
        sortIndicator.querySelector('.indicator-text').textContent = peopleActiveSorts.length;
        
       
        const indicatorLabel = sortIndicator.querySelector('.indicator-label');
        
      
        const newIndicatorLabel = indicatorLabel.cloneNode(true);
        indicatorLabel.parentNode.replaceChild(newIndicatorLabel, indicatorLabel);
    
        newIndicatorLabel.addEventListener('click', function(e) {
            e.stopPropagation();
            openPeopleSortModal();
        });
   
        newIndicatorLabel.style.cursor = 'pointer';
        newIndicatorLabel.title = 'Click to edit sorts';
    } else {
        sortIndicator.classList.add('hidden');
    }
}


function openPeopleFilterModal() {
    const filterContainer = document.getElementById('peopleFilterContainer');
    
   
    while (filterContainer.querySelectorAll('.filter-row').length > 1) {
        filterContainer.removeChild(filterContainer.lastChild);
    }
    

    const firstRow = filterContainer.querySelector('.filter-row');
    firstRow.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
    firstRow.querySelector('.filter-value').value = '';
    
 
    if (peopleActiveFilters.length > 0) {
        const firstFilter = peopleActiveFilters[0];
        setSelectValue(firstRow.querySelector('.filter-field'), firstFilter.field);
        setSelectValue(firstRow.querySelector('.filter-operator'), firstFilter.operator);
        firstRow.querySelector('.filter-value').value = firstFilter.value;
        
     
        for (let i = 1; i < peopleActiveFilters.length; i++) {
            const filter = peopleActiveFilters[i];
            const newRow = addRow(filterContainer, '.filter-row', '.remove-filter-btn');
            
            setSelectValue(newRow.querySelector('.filter-field'), filter.field);
            setSelectValue(newRow.querySelector('.filter-operator'), filter.operator);
            newRow.querySelector('.filter-value').value = filter.value;
        }
    }
    
 
    toggleModal('peopleFilterModal', true);
}


function openPeopleSortModal() {
    const sortContainer = document.getElementById('peopleSortContainer');
    

    while (sortContainer.querySelectorAll('.sort-row').length > 1) {
        sortContainer.removeChild(sortContainer.lastChild);
    }
    
  
    const firstRow = sortContainer.querySelector('.sort-row');
    firstRow.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
    
    if (peopleActiveSorts.length > 0) {
        const firstSort = peopleActiveSorts[0];
        setSelectValue(firstRow.querySelector('.sort-field'), firstSort.field);
        setSelectValue(firstRow.querySelector('.sort-direction'), firstSort.direction);

        for (let i = 1; i < peopleActiveSorts.length; i++) {
            const sort = peopleActiveSorts[i];
            const newRow = addRow(sortContainer, '.sort-row', '.remove-sort-btn');
            
            setSelectValue(newRow.querySelector('.sort-field'), sort.field);
            setSelectValue(newRow.querySelector('.sort-direction'), sort.direction);
        }
    }
    
    
    toggleModal('peopleSortModal', true);
}

function applyPeopleFilters() {
    const filters = [];
    
    document.querySelectorAll('#peopleFilterContainer .filter-row').forEach(row => {
        const field = row.querySelector('.filter-field').value;
        const operator = row.querySelector('.filter-operator').value;
        const value = row.querySelector('.filter-value').value.trim();
        
        if (field && operator && value) {
            filters.push({ field, operator, value });
        }
    });
    
    peopleActiveFilters = filters;
    peopleCurrentPage = 1; 
    loadPeopleData();
    toggleModal('peopleFilterModal', false);
}


function applyPeopleSorts() {
    const sorts = [];
    
    document.querySelectorAll('#peopleSortContainer .sort-row').forEach(row => {
        const field = row.querySelector('.sort-field').value;
        const direction = row.querySelector('.sort-direction').value;
        
        if (field && direction) {
            sorts.push({ field, direction });
        }
    });
    
    peopleActiveSorts = sorts;
    loadPeopleData();
    toggleModal('peopleSortModal', false);
}


function resetPeopleFilters() {
    const filterContainer = document.getElementById('peopleFilterContainer');
    

    while (filterContainer.querySelectorAll('.filter-row').length > 1) {
        filterContainer.removeChild(filterContainer.lastChild);
    }
    
  
    const firstRow = filterContainer.querySelector('.filter-row');
    firstRow.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
    firstRow.querySelector('.filter-value').value = '';
}


function resetPeopleSorts() {
    const sortContainer = document.getElementById('peopleSortContainer');
    
 
    while (sortContainer.querySelectorAll('.sort-row').length > 1) {
        sortContainer.removeChild(sortContainer.lastChild);
    }
    

    const firstRow = sortContainer.querySelector('.sort-row');
    firstRow.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
}


function clearPeopleFilters() {
    peopleActiveFilters = [];
    loadPeopleData();
}


function clearPeopleSorts() {
    peopleActiveSorts = [];
    loadPeopleData();
}
