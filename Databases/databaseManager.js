const sqlite3 = require("sqlite3").verbose();
let openDatabases = [];

// Column Class that is used in creating a table
class Column {
	constructor(name, type) {
		this.name = name;
		this.type = type.toUpperCase();
	}
}

// Database class to simplify creation of SQLite database
class Database {
	constructor(db, path) {
		this.db = db;
		this.path = path;

		openDatabases.push(this);
	}

	Close() {
		const i = openDatabases.indexOf(this);
		if(i !== -1) openDatabases.splice(i, 1);

		this.db.close();
	}

	Run(query) {
        try {
            this.db.run(query);
        } catch(err) {
            console.log(err);
            return err;
        }    
    }

    RunValues(query, values) {
        try {
            this.db.run(query, values);
        } catch(err) {
            console.log(err);
            return err;
        }
    }

    GetAll(query, values) {
        return new Promise((resolve, reject) => {
            this.db.all(query, values, (err, rows) => {
                if(err) {
                    console.error(err);
                    reject(err);
                }

                resolve(rows);
                
            });

        });
    }

    Get(query, values) {
        return new Promise((resolve, reject) => {
            this.db.get(query, values, (err, row) => {
                if(err) {
                    console.error(err);
                    reject(err);
                }

                resolve(row);
                
            });

        });
    }

	CreateTable(name, columns) {
		let query = `CREATE TABLE IF NOT EXISTS ${name}(`;

        for (let c = 0; c < columns.length; c++) {
            query += `${columns[c].name} ${columns[c].type}`;
            if(c !== (columns.length - 1)) query += ", ";
            
        }

		query += ")";

		this.Run(query);
    }

}

// Creates an array of columns class from array of name and types, prevents having to repeat new Column()
function CreateColumnsArray(c) {
	let a = [];
	for (let i = 0; i < c.length; i += 2) {
		a.push(new Column(c[i], c[i + 1]));
		
	}

	return a;
}

// Instantiates a new Database Class with the sqlite db object and the path to the database
function InitialiseDatabase(path, fullPath = false) {
    let p;
    if(fullPath) p = path;
    else p = `./Databases/${path}`;

	const object = new sqlite3.Database(p, sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE, (err) => {
		if(err) {
            console.log(err);
            return err;
        }
	});

	return new Database(object, path);

}

// Loops through all open database objects defined in openDatabases and closees them
function CloseAllDatabases() {
	openDatabases.forEach(d => {
		d.Close();
	});
}

module.exports = {
    Column: Column,
    Database: Database,
    CreateColumnsArray: CreateColumnsArray,
    InitialiseDatabase: InitialiseDatabase,
    CloseAllDatabases: CloseAllDatabases,

};
