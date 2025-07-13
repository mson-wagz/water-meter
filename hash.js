import { hash as _hash } from 'bcrypt';

const password = 'Wagura_123'; // ← replace this with your actual password

_hash(password, 10).then((hash) => {
  console.log("Hashed Password:", hash);
});
