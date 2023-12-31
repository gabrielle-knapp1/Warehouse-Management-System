const mysql = require('../mysql');

async function GetUserCart(req, res) {
    const cart = await mysql.selectQuery(
        "select vCarts.itemID, name, quantity, borrowing, checkedOut, if(borrowing=1, 0, pricePerUnit) as pricePerUnit, if(borrowing=1, 0, pricePerUnit * quantity) as totalPrice from vCarts join vItems on vCarts.itemID=vItems.itemID where username=? and checkOutTime=?",
        [req.body.username, req.body.checkOutTime]
    );
    res.send({ success: true, rows: cart });
}

async function GetMyCart(req, res) {
    const cart = await mysql.selectQuery(
        "select vCarts.itemID, name, quantity, borrowing, if(borrowing=1, 0, pricePerUnit) as pricePerUnit, if(borrowing=1, 0, pricePerUnit * quantity) as totalPrice from vCarts join vItems on vCarts.itemID=vItems.itemID where username=? and checkedOut=false",
        [req.session.username]
    );
    res.send({ success: true, rows: cart });
}

async function Purchase(req, res) {
    //get cart
    const cartRows = await mysql.selectQuery(
        "select vCarts.itemID, name, quantity, borrowing, if(borrowing=1, 0, pricePerUnit * quantity) as totalPrice from vCarts join vItems on vCarts.itemID=vItems.itemID where username=? and checkedOut=false",
        [req.session.username]
    );
    let response = {
        success: true,
        message: "Purchase Successful"
    }
    //make transaction log
    mysql.insertQuery("insert into vTransactionLog(username, totalCost, creditCardNum) values (?, 0, 0)", [req.session.username]);
    const transactionLog = await mysql.selectQuery("SELECT transactionID FROM transactionLog WHERE transactionID = LAST_INSERT_ID()", []);
    const nextTransactionLogID = transactionLog[0].transactionID;
    //go thru each item
    let borrowing = false;
    let totalCost = 0.0;
    cartRows.forEach(async item => {
        if (item.borrowing) {
            borrowing = true;
            //insert new admin log entry
            mysql.insertQuery("insert into vAdminLog(description, transactionID) values (?, ?)", [`${req.session.username} Requested to Borrow Item: ${item.name}`, nextTransactionLogID]);
        } else {
            totalCost += item.totalPrice;
            //update or items depending on the stockQuantity and quantity bought
            let stockQuantity = await mysql.selectQuery("select stockQuantity from vItems where itemID=?", [item.itemID]);
            if (stockQuantity < item.quantity) {
                mysql.insertQuery("update vCarts set quantity=? where username=? and checkedOut=false and itemID=?", [stockQuantity, req.session.username, item.itemID]);
                item.quantity = stockQuantity;
                message = "There were not enough of some items in stock, please check your transaction log to see the quantity of items purchased.";
            }
            mysql.insertQuery("update vItems set stockQuantity=? where itemID=?", [stockQuantity - item.quantity, item.itemID]);
        }
    });
    //update the transactionLog with the values based on if borrowing
    if (borrowing) mysql.insertQuery(
            "update vTransactionLog set borrowState='pending', totalCost=?, creditCardNum=? where transactionID=?",
            [totalCost, req.body.creditCardNumber, nextTransactionLogID]
        );
    else mysql.insertQuery(
            "update vTransactionLog set expectedDeliveryTime=now()+interval 3 day, totalCost=?, creditCardNum=? where transactionID=?",
            [totalCost, req.body.creditCardNumber, nextTransactionLogID]
        );

    //update the cart checkedOut status
    mysql.insertQuery("update vCarts set checkedOut=true, checkOutTime=NOW() where username=? and checkedOut=false", [req.session.username]);

    res.send(response);
}

async function AddToCart(req, res) {
    //get the item in the req.body and insert it into this user's cart
    let quantity = 1;
    let borrowing = false;
    let checkedOut = false;
    mysql.insertQuery("insert into vCarts(username, itemID, quantity, borrowing, checkedOut) values (?, ?, ?, ?, ?)", [req.session.username, req.body.id, quantity, borrowing, checkedOut]);
    res.send({success: true});
}

function DeleteFromCart(req, res) {
    mysql.insertQuery("delete from vCarts where username=? and checkedOut=false and itemID=?", [req.session.username, req.body.itemID]);
    res.send({success: true});
}

function ChangeQuantity(req, res) {
    mysql.insertQuery("update vCarts set quantity=? where username=? and checkedOut=false and itemID=?", [req.body.newQuantity, req.session.username, req.body.itemID]);
    res.send({success: true});
}

module.exports = {
    GetUserCart,
    GetMyCart,
    Purchase,
    AddToCart,
    DeleteFromCart,
    ChangeQuantity
};
