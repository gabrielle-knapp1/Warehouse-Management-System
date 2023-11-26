document.addEventListener('DOMContentLoaded', () => {
    RefreshCart();
});

async function RefreshCart() {
    try {
        const response = await fetch('/api/myCart', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {throw new Error('Network response was not ok');}
        const data = await response.json();
        console.log(data);
        if (data.success) {
            // Assume you have an array containing cart data
            const cart = data.rows;

            // Get the table body element
            const tableBody = document.querySelector('tbody');

            // Populate the table with cart data
            cart.forEach(itemRow => {
                const row = document.createElement('tr');
                row.id = `logEntry${itemRow.itemID}`;

                row.appendChild(document.createElement('td')).textContent = itemRow.itemID;
                row.appendChild(document.createElement('td')).textContent = itemRow.name;
                row.appendChild(document.createElement('td')).textContent = itemRow.quantity;
                row.appendChild(document.createElement('td')).textContent = itemRow.borrowing == 1;
                row.appendChild(document.createElement('td')).textContent = '$' + itemRow.pricePerUnit;
                row.appendChild(document.createElement('td')).textContent = '$' + itemRow.totalPrice;

                const buttonCell = document.createElement('td');
                const editButton = createButton(() => OpenPopup("editItemPopup"));
                buttonCell.appendChild(editButton);
                row.appendChild(buttonCell);

                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error fetching cart:', error);
        alert('An error occurred while fetching cart');
    }
}

function createButton(clickHandler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Edit Item';
    button.classList.add('action-button'); // Add a CSS class for styling
    button.addEventListener('click', clickHandler);
    return button;
}

function OpenPopup(id) {
    const popup = document.getElementById(id);
    popup.style.display = 'block';
}

function ClosePopup(id) {
    const popup = document.getElementById(id);
    popup.style.display = 'none';
}

async function UseAccountInfo() {
    //use the first name, last name, etc from the user's account to fill in the input fields
    //if the field is null then leave the input field blank
    try {
        const response = await fetch('/api/account', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {throw new Error('Network response was not ok');}
        const data = await response.json();
        if (data.success) {
            document.getElementById('firstNameInput').value = (data.account.firstName != null || data.account.firstName !== "")? data.account.firstName : "";
            document.getElementById('lastNameInput').value = (data.account.lastName != null || data.account.lastName !== "")? data.account.lastName : "";
            document.getElementById('addressInput').value = (data.account.address != null || data.account.address !== "")? data.account.address : "";
            document.getElementById('emailInput').value = (data.account.email != null || data.account.email !== "")? data.account.email : "";
        } else {
            console.error('Failed to get account info');
            alert('Failed to get account info');
        }
    } catch (error) {
        console.error('Failed to get account info:', error);
        alert('Failed to get account info');
    }
}

async function SubmitTransaction() {
    const firstName = document.getElementById('firstNameInput').value;
    const lastName = document.getElementById('lastNameInput').value;
    const address = document.getElementById('addressInput').value;
    const email = document.getElementById('emailInput').value;
    const creditCardNumber = document.getElementById('creditCardNumberInput').value;

    if (firstName != null && firstName !== "" && lastName != null && lastName !== "" && address != null && address !== "" && email != null && email !== "" && creditCardNumber != null && creditCardNumber !== "") {
        document.getElementById('warning').innerHTML = "";
        //update the database here
        ClosePopup('checkOutPopup');
        location.reload();
    } else {
        document.getElementById('warning').innerHTML = "All fields must be filled";
    }
}