const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

/**
 * ============================================================================
 * ALGORITHM: EdDSA (Edwards-curve Digital Signature Algorithm) via TweetNaCl
 * PURPOSE: To ensure data integrity and authenticity of canteen feedback.
 * ============================================================================
 */

/**
 * STEP 1: DETERMINISTIC SERIALIZATION
 * EdDSA requires a strict byte array to sign. If the data format changes even 
 * slightly (e.g., a number becomes a string), the signature will fail. 
 * This function standardizes the feedback data before signing or verifying.
 */
function serializeForSignature(feedbackObj) {
    // Strictly cast types to prevent type coercion bugs
    const name = feedbackObj.customer_name ? String(feedbackObj.customer_name).trim() : "";
    const rating = Number(feedbackObj.rating) || 0;
    const comment = feedbackObj.comment ? String(feedbackObj.comment).trim() : "";

    // Encode strings to prevent malicious delimiter injection
    const safeName = encodeURIComponent(name);
    const safeComment = encodeURIComponent(comment);

    // Create a canonical, fixed-order string
    const canonicalString = `customer_name=${safeName}&rating=${rating}&comment=${safeComment}`;
    
    // Convert to Uint8Array (the format required by TweetNaCl)
    return nacl.util.decodeUTF8(canonicalString);
}

/**
 * STEP 2: KEY GENERATION
 * Generates an EdDSA public/private keypair from a secure 32-byte hexadecimal seed.
 * The Private Key signs the data; the Public Key verifies it.
 */
function keyPairFromSeed(hexSeed) {
    const seed = Buffer.from(hexSeed, 'hex');
    return nacl.sign.keyPair.fromSeed(seed);
}

/**
 * STEP 3: DATA SIGNING (ENCRYPTION-LIKE HASHING)
 * Takes the raw feedback and the Private Key, generating a unique cryptographic 
 * signature. If the feedback text is altered later, this signature becomes invalid.
 */
function signFeedback(privateKey, feedbackObj) {
    const messageUint8 = serializeForSignature(feedbackObj);
    const signature = nacl.sign.detached(messageUint8, privateKey);
    return nacl.util.encodeBase64(signature); // Store as Base64 in the database
}

/**
 * STEP 4: SIGNATURE VERIFICATION
 * Takes the Public Key, the retrieved feedback data, and the stored signature.
 * It recalculates the hash of the data and checks if it matches the signature.
 */
function verifySignature(publicKey, feedbackObj, signatureB64) {
    const messageUint8 = serializeForSignature(feedbackObj);
    const signatureUint8 = nacl.util.decodeBase64(signatureB64);
    
    // Ensure the public key is a strict Uint8Array
    const pubKeyUint8 = new Uint8Array(publicKey); 
    
    return nacl.sign.detached.verify(messageUint8, signatureUint8, pubKeyUint8);
}

module.exports = {
    keyPairFromSeed,
    signFeedback,
    verifySignature,
};