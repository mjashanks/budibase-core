
export const getNewUser = app => () => ({
    name: "",
    accessLevels: [],
    passwordHash: "",
    temporaryAccessHash: "",
    temporaryAccessExpiryEpoch: 0,
    temporaryAccessId: ""
});

