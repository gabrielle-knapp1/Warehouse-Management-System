document.addEventListener('DOMContentLoaded', () => {
    RefreshTable();
});

async function RefreshTable() {
    try {
        const response = await fetch('/api/warehouse', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {throw new Error('Network response was not ok');}
        const data = await response.json();
        console.log(data);
        if (data.success) {
            // Assume you have an array containing warehouse data called "Items"
            const warehouse = data.items;
            // Get the table body element
            const tableBody = document.querySelector('tbody');
            tableBody.innerHTML = '';

            // Populate the table with item data
            warehouse.forEach(item => {
                const row = document.createElement('tr');
                row.id = `itemEntry${item.itemID}`;

                //const descriptionCell = document.createElement('td');

                row.appendChild(document.createElement('td')).textContent = item.itemID;
                row.appendChild(document.createElement('td')).textContent = item.name;
                row.appendChild(document.createElement('td')).textContent = item.stockQuantity;
                row.appendChild(document.createElement('td')).textContent = item.pricePerUnit;
                //row.appendChild(createButton("Remove Item", () => removeItem));
                row.appendChild(createButton("Edit Item", () => editItem(item.itemID)));
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error fetching warehouse data:', error);
        alert('An error occurred while fetching warehouse data');
    }
}

function editItem(id) {
    var table = document.querySelector('tbody');
    var rows = table.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var rowId = rows[i].getElementsByTagName('td')[0].textContent;
        if (rowId === id.toString()) {
            makeRowEditable(rows[i]);
            break;
        }
    }
}

async function addItem() {
    try {
        const newItem = {name: 'New Product', stockQuantity: 5, pricePerUnit: 100};//default item
        const response = await fetch('/api/warehouse/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItem)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log(data);

        if (data.success) {
            RefreshTable();
        }
    } catch (error) {
        console.error('Error adding item:', error);
        alert('An error occurred while adding item');
    }
}

function createButton(text, clickHandler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.classList.add('action-button'); // Add a CSS class for styling
    button.addEventListener('click', clickHandler);
    return button;
}
async function updateItem(itemID, name, stockQuantity, pricePerUnit) {
    try {
        // Parse stockQuantity and pricePerUnit if needed
        const parsedStockQuantity = parseInt(stockQuantity, 10);
        const parsedPricePerUnit = parseFloat(pricePerUnit);

        const response = await fetch('/api/warehouse/edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                itemID,
                name,
                stockQuantity: isNaN(parsedStockQuantity) ? null : parsedStockQuantity,
                pricePerUnit: isNaN(parsedPricePerUnit) ? null : parsedPricePerUnit,
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log(data);

        if (data.success) {
            RefreshTable();
        }
    } catch (error) {
        console.error('Error updating item:', error);
        alert('An error occurred while updating item');
    }
}
function makeRowEditable(row) {
    var cells = row.getElementsByTagName('td');
    
    // Create input fields for each value
    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = cells[1].textContent;
    cells[1].textContent = '';
    cells[1].appendChild(nameInput);

    var stockQuantityInput = document.createElement('input');
    stockQuantityInput.type = 'text';
    stockQuantityInput.value = cells[2].textContent;
    cells[2].textContent = '';
    cells[2].appendChild(stockQuantityInput);

    var pricePerUnitInput = document.createElement('input');
    pricePerUnitInput.type = 'text';
    pricePerUnitInput.value = cells[3].textContent;
    cells[3].textContent = '';
    cells[3].appendChild(pricePerUnitInput);

    // Create the "Save Item" button and pass input values to updateItem
    row.appendChild(createButton("Save Item", function () {
        updateItem(
            cells[0].textContent,       // Original itemID
            nameInput.value,            // Updated name
            stockQuantityInput.value,   // Updated stockQuantity
            pricePerUnitInput.value     // Updated pricePerUnit
        );
    }));
}
