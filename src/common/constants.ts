export const constants = {
    port : process.env.PORT || 3000,
    globalPrefix : process.env.GLOBAL_PREFIX || '/api/',
    jwtSecret : process.env.JWT_SECRET || 'yourSecretKeyHere',
};