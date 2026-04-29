import { hashPassword, comparePassword } from './hash.util';

async function test() {
  console.log('🧪 Testing Password Hashing\n');

  const plainPassword = 'Password123!';
  console.log('Original Password:', plainPassword);
  console.log('');

  // Test 1: Hash the same password twice
  console.log('Test 1: Hashing same password twice');
  const hash1 = await hashPassword(plainPassword);
  const hash2 = await hashPassword(plainPassword);

  console.log('Hash 1:', hash1);
  console.log('Hash 2:', hash2);
  console.log(
    'Are hashes same?',
    hash1 === hash2 ? '❌ PROBLEM!' : '✅ Different (Good!)',
  );
  console.log('');

  // Test 2: Compare correct password
  console.log('Test 2: Compare correct password');
  const isCorrect = await comparePassword(plainPassword, hash1);
  console.log('Result:', isCorrect ? '✅ Match!' : '❌ No match');
  console.log('');

  // Test 3: Compare wrong password
  console.log('Test 3: Compare wrong password');
  const wrongPassword = 'WrongPass123!';
  const isWrong = await comparePassword(wrongPassword, hash1);
  console.log(
    'Result:',
    isWrong ? '❌ Should not match!' : '✅ Correctly rejected',
  );
  console.log('');

  // Test 4: Performance test
  console.log('Test 4: Performance (10 rounds)');
  const startTime = Date.now();
  await hashPassword(plainPassword);
  const endTime = Date.now();
  console.log(`Time taken: ${endTime - startTime}ms`);
  console.log('(Should be ~100ms with saltRounds=10)');
}

test();
