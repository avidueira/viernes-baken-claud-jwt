var jwt = require('jsonwebtoken');
const { Base64 } = require('js-base64');

const SECRET = 'secret';
const EXPIRES_IN = 15; // expires in 30 seconds

function _sleep(seconds) {
  console.log(`\nSleeping for ${seconds}s`);
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function createSimpleToken() {
  console.log('\nCreating simple token\n');
  return jwt.sign({
    exp: Math.floor(Date.now() / 1000) + EXPIRES_IN,
    hello: 'world'
  }, SECRET);
}

function createCustomClaimsToken(claims) {
  console.log('\nCreating custom claims token\n');
  return jwt.sign({
    exp: Math.floor(Date.now() / 1000) + EXPIRES_IN,
    ...claims
  }, SECRET);
}

function verifyToken(token) {
  console.log('\nVerifying token\n');
  return jwt.verify(token, SECRET);
}

async function main() {
  try {
    // We create a token in server
    const token = createSimpleToken();
    console.log('simple-token', token);
    // Then we send this token to client
    await _sleep(1);

    // Client is trying to access a resource, we need to verify the incoming token => VALID
    let decodedToken = verifyToken(token);
    console.log('decoded-token-1', decodedToken);

    await _sleep(EXPIRES_IN / 2);

    // Client is trying to access a resource, we need to verify the incoming token => VALID
    decodedToken = verifyToken(token);
    console.log('decoded-token-2', decodedToken);

    await _sleep(EXPIRES_IN / 2);

    // Client is trying to access a resource, we need to verify the incoming token => EXPIRED
    decodedToken = verifyToken(token);
    console.log('decoded-token-3', decodedToken);
  } catch (error) {
    console.error(error);
  }
}

async function main2() {
  try {
    // We create a custom claim token in server
    const token = createCustomClaimsToken({
      vip: false,
      read: ['incomes'],
      write: [],
      userId: 123
    });
    console.log('custom-claims-token', token);
    // Then we send this token to client

    // Client is trying to access a resource, we need to verify the incoming token => VALID
    const decodedToken = verifyToken(token);
    console.log('decoded-token', decodedToken);

    // We have access to all claims, and can trust them
    console.log('\nUser id is: ', decodedToken.userId);
    console.log('User is vip?', decodedToken.vip);
    console.log('User can read from: ', decodedToken.read.join(','));
    console.log('User can write to: ', decodedToken.write.join(','));

    // What if a client tries to modify the token's claims?
    // First we need to split the parts that compose a JWT token
    const parts = token.split('.');
    // Then we need to base64 decode the middle part that contains the token's claims
    const stringDecodedClaims = Base64.decode(parts[1]);
    const decodedClaims = JSON.parse(stringDecodedClaims);
    // Now we will modify some properties
    decodedClaims['vip'] = true;
    decodedClaims['write'] = ['users', 'payments', 'ALL'];
    decodedClaims['userId'] = 1;
    console.log('\nmodified-decoded-claims', decodedClaims);
    // Now we encode the modified claims and create a new token
    const stringEncodedClaims = JSON.stringify(decodedClaims);
    parts[1] = Base64.encode(stringEncodedClaims);
    const modifiedToken = `${parts[0]}.${parts[1]}.${parts[2]}`;
    // Now as a "valid" client, we send this token to server
    // Server will verify it and detect that it was modified :^)
    const modifiedDecodedToken = verifyToken(modifiedToken);
    console.log('modified-decoded-token', modifiedDecodedToken);
  } catch (error) {
    console.error(error);
  }
}

main();
//main2();
















