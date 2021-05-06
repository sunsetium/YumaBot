var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('ff.db');

// Matches even number of people
db.all("select * from users where status != 0 order by status desc, random()", [], (err, rows) => {
    if (err) throw err;

    for (let i = 0; i < rows.length; i += 2){
        if(rows[i+1]){
            Promise.all([checkHisotry(rows[i].userid, rows[i+1].userid)])
            .then((talkedTo) => {
                if(!talkedTo[0]){
                    updateUsers(rows[i].userid, rows[i+1].userid, 0)
                    console.log(`${rows[i].userid} is matched with ${rows[i+1].userid}`)
                }else{
                    updateUsers(rows[i].userid, rows[i+1].userid, 2)
                    console.log(`${rows[i].userid} already mached with ${rows[i+1].userid} send to priority queue`)
                }
            })
        }else{
            updateUsers(rows[i].userid, rows[i+1].userid, 2)
            console.log(`${rows[i].userid} is ignored, send to priority queue`)
        }
    }
});

function checkHisotry(user1, user2){
    return new Promise((resolve, reject) => {
        db.all(`Select users.userid, histories.spokenToID from users` +
        ` inner join histories on users.userid = histories.userID` +
        ` where (users.userid = ${user1} or histories.spokenToID = ${user1})`+
        ` and (users.userid = ${user2} or histories.spokenToID = ${user2})`, [], (err, rows) =>{
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
            WHERE userID IN (${user1},${user2})`)
}