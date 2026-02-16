const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('Connection failed:', err);
        return;
    }
    console.log('Connected to database.');

    // 1. Find all users who have 'energy' item in inventory
    db.query("SELECT * FROM inventory WHERE item_key = 'energy'", (err, energyItems) => {
        if (err) {
            console.error('Error fetching energy items:', err);
            db.end();
            return;
        }

        console.log(`Found ${energyItems.length} 'energy' items.`);

        let pending = energyItems.length;
        if (pending === 0) {
            console.log('No energy items to process.');
            fixElectricity(); // Proceed to rename electricity
            return;
        }

        // Delete 'energy' items (as requested: "energy olanı sil, elektrik olanı kullanacağız")
        // NOTE: The prompt says "enerji olanı sil", assuming 'energy' is the one to delete and keep 'electricity' logic in DB?
        // Wait, 'electricity' is not used in server.js code (grep showed nothing).
        // Let's re-read the grep output.
        // grep -r "electricity" src/server.js -> NO MATCH.
        // grep -r "energy" src/server.js -> MANY MATCHES.
        
        // The user said: "sistemde elektrik ve enerji olarak iki farklı item olabilir bu itemlerden enerji olanı sil, elektrik olanı kullancacağız"
        // THIS IS VERY CONFUSING if the code uses 'energy'.
        // If the code uses 'energy', and I delete 'energy' items and keep 'electricity' items, the code will not find them!
        
        // Let's assume the user means "On the UI/Game Logic side, we want to use 'electricity' concept, but in DB we have mixed."
        // OR maybe the user wants to rename 'energy' to 'electricity' everywhere?
        // BUT the grep showed 'electricity' is NOT in the code.
        
        // HYPOTHESIS: The user sees "Enerji" in the UI (which usually maps to 'energy' key) and "Elektrik" (which might map to 'electricity' key or is just a translation).
        // If I delete 'energy' from DB, the players lose their items if the code relies on 'energy'.
        
        // Let's look at resourceMap in HTML files again.
        // 'lumber': { raw: [..., { name: 'Elektrik', key: 'energy', ... }] }
        // The frontend explicitly maps key 'energy' to name 'Elektrik'.
        
        // So if the user has 'energy' key in DB, it shows up as 'Elektrik'.
        // If the user has 'electricity' key in DB, it might show up as something else or not shown if not in map.
        
        // Wait, look at the grep output for inventory again.
        // We have items with key 'electricity' in DB.
        // We have items with key 'energy' in DB.
        
        // If front-end uses key 'energy' for "Elektrik", then 'energy' items are the correct ones for the factory logic!
        // The 'electricity' items in DB might be legacy or wrong.
        
        // HOWEVER, the user said: "enerji olanı sil, elektrik olanı kullancacağız"
        // This literally means: Delete items where item_key='energy', Use items where item_key='electricity'.
        // IF I DO THIS, I MUST UPDATE THE CODE TO USE 'electricity' KEY INSTEAD OF 'energy'.
        
        // BUT changing all code from 'energy' to 'electricity' is a huge task and risky.
        // MAYBE the user means the Name/Label? "Enerji" vs "Elektrik".
        
        // Let's look at the `inventory.html` logic. It iterates over DB items.
        // If DB has 'electricity' key, and config has 'electricity' key?
        // In `factory-management.html`, the config for 'lumber' uses key: 'energy'.
        
        // ERROR: If I strictly follow "enerji olanı sil, elektrik olanı kullancacağız", I would delete the 'energy' rows.
        // Then I would need to rename 'electricity' rows to 'energy' so the code finds them? 
        // OR change the code to look for 'electricity'.
        
        // Let's assume the user wants to CONSOLIDATE to ONE key.
        // And they prefer the concept of "Elektrik".
        // BUT if the codebase uses 'energy' string 100 times, it is better to migrate 'electricity' data to 'energy' key and just label it "Elektrik" in UI.
        
        // Let's Ask/Infer? No, user clearly said "enerji olanı sil".
        // Wait, maybe "enerji" refers to property of user (stamina) vs "electricity" (item)?
        // The user said "item olarak".
        
        // Let's look at the `check_energy_inv.js` output again.
        // User 3 has 940401 'electricity'.
        // User 1 has 64 'energy'.
        
        // If I simply delete 'energy' items, User 1 loses 64 energy.
        // If I update 'electricity' to 'energy', User 3 keeps 940401 energy (as factory fuel).
        
        // DECISION: The most logical path for a working system (since server.js uses 'energy' key for factories factory_inputs) is:
        // 1. The CODE expects 'energy'.
        // 2. The DB has 'electricity' (likely from some old script or manual insert) AND 'energy'.
        // 3. User wants to use 'electricity' (conceptually).
        
        // INTERPRETATION: The user probably has duplicate items showing up in inventory: "Enerji" and "Elektrik".
        // They want to keep "Elektrik".
        // If "Elektrik" corresponds to the `electricity` key in DB, then that is the one they want to keep.
        // BUT the System uses `energy` key.
        
        // PROPOSAL:
        // 1. Delete `energy` items from inventory (as requested).
        // 2. Rename `electricity` items to `energy` so they work with the system.
        // OR
        // 1. Change system to use `electricity` key. (Harder, many files).
        
        // Let's check `inventory.html` again.
        // It fetches `/api/inventory/ userId`.
        // It renders items.
        
        // If I change `factory-management.html` resourceMap to use `electricity` key?
        // Then I need to change server.js `FACTORY_INPUTS` to use `electricity`.
        // Then I need to change the DB `energy` items to `electricity`.
        
        // This seems to be what the user is asking: "use electricity item".
        
        // Let's verify if `energy` is used for STAMINA (User Energy) as well?
        // Yes: `UPDATE users SET energy = energy - ?`
        // BUT that is a COLUMN in `users` table.
        // The ITEM in `inventory` table is `item_key='energy'`.
        // These are distinct but share the name. This causes confusion.
        // Changing the inventory item key to `electricity` solves the confusion!
        
        // PLAN:
        // 1. Update `inventory.html` and `factory-management.html` resource maps to use key `electricity`.
        // 2. Update `server.js` FACTORY_INPUTS to use `electricity` instead of `energy`.
        // 3. Update DB: Delete `energy` items (inventory), Rename `energy` items to `electricity`?? 
        //    Wait, user said "enerji olanı sil". So delete `energy` rows.
        //    And Use `electricity` rows.
        //    (Ensure no duplicates before rename if needed).
        
        // WAIT: If I delete `energy` rows, and there are no `electricity` rows for that user, they lose it.
        // BUT the user specifically said "energy olanı sil". Maybe they are bugged/duplicated.
        
        // ACTION: I will execute a script to:
        // 1. Delete inventory items where item_key = 'energy'.
        // 2. (Implicitly) The `electricity` items remain.
        // 3. I will then update the code to use `electricity` key.
        
        db.query("DELETE FROM inventory WHERE item_key = 'energy'", (err, resDel) => {
            if (err) console.error(err);
            console.log(`Deleted ${resDel.affectedRows} 'energy' items.`);
            db.end();
        });
    });
});

function fixElectricity() {
    // If no energy items were found, we are just done with deletion part.
    db.end();
}
