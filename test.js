var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('ff.db');

// Matches even number of people
db.all("SELECT * FROM users WHERE status != 0 ORDER BY status DESC, random()", [], (err, rows) => {
    if (err) throw err;

    for(let q = 0; q < rows.length; q++){
        console.log(rows[q])
    }
    for (let i = 0; i < rows.length; i += 2){
        if(rows[i+1]){
            Promise.all([checkHistory(rows[i].userID, rows[i+1].userID)])
            .then((talkedTo) => {
                if(!talkedTo[0]){
                    updateUsers(rows[i].userID, rows[i+1].userID, 0)
                    addToHistory(rows[i].userID, rows[i+1].userID)
                    console.log(`${rows[i].userID} is matched with ${rows[i+1].userID}`)
                }else{
                    updateUsers(rows[i].userID, rows[i+1].userID, 2)
                    console.log(`${rows[i].userID} already mached with ${rows[i+1].userID} send to priority queue`)
                }
            })
        }else{
            db.run(`UPDATE users 
                    SET status = 2
                    WHERE userID = ${rows[i].userID}`)
            console.log(`${rows[i].userID} is ignored, send to priority queue`)
        }
    }
});

function checkHistory(user1, user2){
    return new Promise((resolve, reject) => {
        db.all(`SELECT users.userID, histories.spokenToID FROM users
                INNER JOIN histories ON users.userID = histories.userID
                WHERE (users.userID = ${user1} OR histories.spokenToID = ${user1})
                AND (users.userID = ${user2} OR histories.spokenToID = ${user2});`, [], (err, rows) =>{
            if (err) throw err;

            if(rows.length == 0){
                resolve(false)
            }else{
                resolve(true)
            }
        })
    })
}

function updateUsers(user1, user2, status){
    db.run(`UPDATE users 
                SET status = CASE userID 
                    WHEN ${user1} THEN ${status} 
                    WHEN ${user2} THEN ${status} 
                END 
            WHERE userID IN (${user1},${user2});`)
}

function addToHistory(user1, user2){
    db.run(`INSERT INTO histories (userID, spokentoID)
            VALUES (${user1}, ${user2});`);
}