export const constantValues = {
    port : process.env.PORT || 3001,
    globalPrefix : process.env.GLOBAL_PREFIX || '/api/',
    jwtSecret : process.env.JWT_SECRET || 'yourSecretKeyHere',
    jwtExpiry : Number(process.env.JWT_EXPIRY) || 2*60*60*1000, // 2 hours in milliseconds
};