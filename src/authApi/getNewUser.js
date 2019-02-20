
export const getNewUser = app => () => ({
    name: "",
    accessLevels: [],
    enabled: true,
    temporaryAccessId: ""
});

export const getNewUserAuth = app => () => ({
    passwordHash: "",
    temporaryAccessHash: "",
    temporaryAccessExpiryEpoch: 0
});