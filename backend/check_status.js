const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./refood.db');

console.log('Checking pickup statuses...');

db.all('SELECT status, COUNT(*) as count FROM pickups GROUP BY status', (err, rows) => {
  if (err) {
    console.log('Error:', err);
  } else {
    console.log('Pickup Status Breakdown:');
    rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count} pickups`);
    });
  }
  
  // Also check for recent pickups
  db.all('SELECT id, status, updated_at FROM pickups ORDER BY updated_at DESC LIMIT 10', (err2, recent) => {
    if (!err2) {
      console.log('\nRecent 10 pickups:');
      recent.forEach(p => {
        console.log(`  ID ${p.id}: ${p.status} (${p.updated_at})`);
      });
    }
    db.close();
  });
}); 