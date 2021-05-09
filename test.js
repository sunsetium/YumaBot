var sqlite3 = require('sqlite3').verbose();
let stuff = true;

cumstop()
async function cumstop() {
    var db = new sqlite3.Database(`ff.db`);
    var userID = 9999;

    db.all(`SELECT userID FROM users WHERE userID=${userID}`, [], (err, rows) =>{
        if(rows.length == 0){
            db.run(`INSERT INTO users VALUES(${userID}, 1)`)
        }else{
            db.run(`UPDATE users SET status=1 WHERE userID=${userID}`)
        }
    })

}